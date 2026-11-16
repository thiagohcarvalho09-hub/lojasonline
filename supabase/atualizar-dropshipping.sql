-- ATELIER — atualização do banco já instalado: custo protegido + dropshipping / venda sem estoque.
-- Pode rodar mais de uma vez.
begin;

-- Custo das peças fora do alcance público (0005), em versão que pode rodar de novo.
create table if not exists public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  cost numeric(10, 2) not null check (cost >= 0),
  updated_at timestamptz not null default now()
);
alter table public.product_costs enable row level security;
drop policy if exists "somente equipe" on public.product_costs;
create policy "somente equipe" on public.product_costs for all
  using ((select public.is_staff())) with check ((select public.is_staff()));
revoke all on public.product_costs from anon;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'cost') then
    insert into public.product_costs (product_id, cost)
      select id, cost from public.products where cost is not null and cost >= 0
      on conflict (product_id) do nothing;
    alter table public.products drop column cost;
  end if;
end $$;

-- Modelos de venda por peça:
--   stock     — estoque próprio: confere e baixa estoque, a loja envia (como sempre foi);
--   dropship  — o fornecedor envia direto ao cliente; vende sem estoque;
--   preorder  — sob encomenda: vende sem estoque, a loja produz/compra e envia no prazo.
-- O prazo extra de envio é público; os dados do fornecedor ficam numa tabela só da equipe.

alter table public.products
  add column if not exists fulfillment text not null default 'stock'
    check (fulfillment in ('stock', 'dropship', 'preorder')),
  add column if not exists lead_time_days int not null default 0
    check (lead_time_days between 0 and 120);

-- O modelo vai junto com cada item do pedido, para o estoque e a expedição não dependerem de mudanças futuras na peça.
alter table public.order_items
  add column if not exists fulfillment text not null default 'stock'
    check (fulfillment in ('stock', 'dropship', 'preorder'));

create table if not exists public.product_suppliers (
  product_id uuid primary key references public.products (id) on delete cascade,
  supplier_name text not null default '',
  supplier_url text not null default '',
  supplier_sku text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.product_suppliers enable row level security;
drop policy if exists "somente equipe" on public.product_suppliers;
create policy "somente equipe" on public.product_suppliers for all
  using ((select public.is_staff())) with check ((select public.is_staff()));
revoke all on public.product_suppliers from anon;

create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  staff boolean := public.is_staff();
  v_channel text := 'online';
  v_method text := coalesce(p ->> 'payment_method', 'pix');
  v_email text := lower(trim(coalesce(p #>> '{customer,email}', '')));
  v_name text := trim(coalesce(p #>> '{customer,name}', ''));
  v_settings public.store_settings;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_shipping numeric := 0;
  v_coupon jsonb;
  v_coupon_code text;
  v_customer uuid;
  v_order public.orders;
  v_paid boolean := false;
  it jsonb;
  r record;
  v_qty int;
begin
  if staff then
    v_channel := coalesce(p ->> 'channel', 'online');
    v_paid := coalesce((p ->> 'mark_paid')::boolean, false);
  end if;
  if v_channel not in ('online', 'store', 'whatsapp') then raise exception 'Canal inválido.'; end if;
  if v_method not in ('pix', 'card', 'cash') or (v_method = 'cash' and not staff) then
    raise exception 'Forma de pagamento inválida.';
  end if;
  if char_length(v_name) < 2 then raise exception 'Informe o nome completo.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Informe um e-mail válido.'; end if;
  if jsonb_typeof(p -> 'items') is distinct from 'array' or jsonb_array_length(p -> 'items') = 0 then
    raise exception 'O carrinho está vazio.';
  end if;
  if jsonb_array_length(p -> 'items') > 40 then raise exception 'Pedido grande demais.'; end if;

  select * into v_settings from public.store_settings where id = 1;

  create temp table _lines (
    variant_id uuid, product_id uuid, name text, label text, price numeric, qty int, fulfillment text
  ) on commit drop;

  for it in select * from jsonb_array_elements(p -> 'items') loop
    v_qty := (it ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'Quantidade inválida.'; end if;
    select v.id as variant_id, v.stock, pr.id as product_id, pr.name, pr.status, pr.fulfillment,
           coalesce(v.price_override, pr.price) as price,
           concat_ws(' · ', nullif(v.size, ''), nullif(v.color, '')) as label
      into r
      from public.product_variants v join public.products pr on pr.id = v.product_id
      where v.id = (it ->> 'variant_id')::uuid
      for update of v;
    if not found or (r.status <> 'active' and not staff) then raise exception 'Uma das peças não está mais disponível.'; end if;
    -- Dropshipping e sob encomenda vendem sem estoque; só o estoque próprio é conferido.
    if r.fulfillment = 'stock' and r.stock < v_qty then
      raise exception 'Estoque insuficiente para % (%): restam % un.', r.name, r.label, r.stock;
    end if;
    insert into _lines values (r.variant_id, r.product_id, r.name, r.label, r.price, v_qty, r.fulfillment);
    v_subtotal := v_subtotal + r.price * v_qty;
  end loop;

  if coalesce(trim(p ->> 'coupon'), '') <> '' then
    v_coupon := public.validate_coupon(p ->> 'coupon', v_subtotal);
    if not (v_coupon ->> 'valid')::boolean then raise exception '%', v_coupon ->> 'message'; end if;
    v_discount := (v_coupon ->> 'discount')::numeric;
    v_coupon_code := v_coupon ->> 'code';
    update public.coupons set used_count = used_count + 1 where code = v_coupon_code;
  end if;

  if v_channel = 'store'
     or coalesce((v_coupon ->> 'free_shipping')::boolean, false)
     or (v_subtotal - v_discount) >= v_settings.free_shipping_over then
    v_shipping := 0;
  else
    v_shipping := v_settings.shipping_flat;
  end if;

  insert into public.customers (name, email, phone, cpf, address)
  values (v_name, v_email, coalesce(p #>> '{customer,phone}', ''), coalesce(p #>> '{customer,cpf}', ''),
          coalesce(p -> 'address', '{}'::jsonb))
  on conflict (email) do update set
    name = excluded.name,
    phone = case when excluded.phone <> '' then excluded.phone else public.customers.phone end,
    cpf = case when excluded.cpf <> '' then excluded.cpf else public.customers.cpf end,
    address = case when excluded.address <> '{}'::jsonb then excluded.address else public.customers.address end
  returning id into v_customer;

  insert into public.orders (customer_id, status, channel, payment_method, subtotal, discount, shipping, total,
                             coupon_code, shipping_address, notes, paid_at)
  values (v_customer, case when v_paid then 'paid' else 'pending' end, v_channel, v_method,
          v_subtotal, v_discount, v_shipping, v_subtotal - v_discount + v_shipping,
          v_coupon_code, coalesce(p -> 'address', '{}'::jsonb), left(coalesce(p ->> 'notes', ''), 500),
          case when v_paid then now() end)
  returning * into v_order;

  insert into public.order_items (order_id, product_id, variant_id, name, variant_label, unit_price, quantity, total, fulfillment)
    select v_order.id, product_id, variant_id, name, label, price, qty, price * qty, fulfillment from _lines;
  update public.product_variants v set stock = v.stock - l.qty from _lines l where v.id = l.variant_id and l.fulfillment = 'stock';
  insert into public.inventory_movements (variant_id, delta, reason, note, order_id)
    select variant_id, -qty, 'sale', 'Pedido #' || v_order.number, v_order.id from _lines where fulfillment = 'stock';
  insert into public.order_events (order_id, status, message)
  values (v_order.id, v_order.status,
          case when v_paid then 'Pedido criado e pago no balcão.' else 'Pedido recebido. Aguardando pagamento.' end);

  drop table _lines;
  return jsonb_build_object('id', v_order.id, 'number', v_order.number, 'token', v_order.public_token, 'total', v_order.total);
end $$;

create or replace function public.set_order_status(p_order uuid, p_status text, p_tracking text default null, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders; closed text[] := array['cancelled', 'refunded'];
begin
  if not public.is_staff() then raise exception 'Acesso negado.'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Pedido não encontrado.'; end if;
  if o.status = any (closed) then raise exception 'Pedido encerrado não pode ser alterado.'; end if;

  if p_status = any (closed) then
    update public.product_variants v set stock = v.stock + i.quantity
      from public.order_items i where i.order_id = o.id and v.id = i.variant_id and i.fulfillment = 'stock';
    insert into public.inventory_movements (variant_id, delta, reason, note, order_id)
      select variant_id, quantity, 'return', 'Pedido #' || o.number || ' encerrado', o.id
      from public.order_items where order_id = o.id and variant_id is not null and fulfillment = 'stock';
  end if;

  update public.orders set
    status = p_status,
    tracking_code = coalesce(nullif(trim(p_tracking), ''), tracking_code),
    paid_at = case when p_status in ('paid', 'processing', 'shipped', 'delivered') and paid_at is null then now() else paid_at end
  where id = o.id;

  insert into public.order_events (order_id, status, message)
  values (o.id, p_status, coalesce(nullif(trim(p_note), ''), case p_status
    when 'paid' then 'Pagamento confirmado.'
    when 'processing' then 'Pedido em separação.'
    when 'shipped' then 'Pedido enviado.' || coalesce(' Rastreio: ' || nullif(trim(p_tracking), ''), '')
    when 'delivered' then 'Pedido entregue.'
    when 'cancelled' then 'Pedido cancelado. Peças devolvidas ao estoque.'
    when 'refunded' then 'Pedido estornado. Peças devolvidas ao estoque.'
    else 'Status atualizado.' end));
end $$;

commit;

select 'modelo de venda' item, (select count(*) from information_schema.columns where table_name = 'products' and column_name = 'fulfillment')::text = '1' ok
union all select 'fornecedores', to_regclass('public.product_suppliers') is not null
union all select 'custo protegido', to_regclass('public.product_costs') is not null;

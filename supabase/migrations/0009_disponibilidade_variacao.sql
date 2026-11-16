-- Disponibilidade por variação (tamanho/cor).
-- Em dropshipping a loja não tem estoque, então precisa saber se o fornecedor ainda tem aquele tamanho.
-- `product_variants.available` é público (a vitrine esconde o que está indisponível) e o checkout recusa
-- variações indisponíveis. Por enquanto é marcado à mão no painel; depois pode vir de um feed/API do fornecedor.
-- Pode rodar mais de uma vez.

alter table public.product_variants add column if not exists available boolean not null default true;

-- O campo que ficou reservado em variant_suppliers (0008) passa a morar na variação.
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'variant_suppliers' and column_name = 'available') then
    update public.product_variants v set available = vs.available
      from public.variant_suppliers vs where vs.variant_id = v.id and vs.available = false;
    alter table public.variant_suppliers drop column available;
  end if;
end $$;

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
    select v.id as variant_id, v.stock, v.available, pr.id as product_id, pr.name, pr.status, pr.fulfillment,
           coalesce(v.price_override, pr.price) as price,
           concat_ws(' · ', nullif(v.size, ''), nullif(v.color, '')) as label
      into r
      from public.product_variants v join public.products pr on pr.id = v.product_id
      where v.id = (it ->> 'variant_id')::uuid
      for update of v;
    if not found or (r.status <> 'active' and not staff) then raise exception 'Uma das peças não está mais disponível.'; end if;
    if not r.available then
      raise exception '% (%) está indisponível no momento.', r.name, r.label;
    end if;
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

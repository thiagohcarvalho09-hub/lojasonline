-- Fornecedores e pedidos ao fornecedor (dropshipping / sob encomenda).
--   suppliers            — cadastro único de fornecedor, reaproveitado em várias peças (prazo, troca, contato);
--   variant_suppliers    — código do fornecedor por tamanho/cor (e disponibilidade no fornecedor, para a próxima etapa);
--   supplier_orders      — um registro por fornecedor em cada pedido do cliente, com custo, status e rastreio próprios;
--   supplier_order_items — os itens que entram em cada pedido ao fornecedor.
-- Quando um pedido do cliente é pago, os pedidos ao fornecedor são criados sozinhos, agrupados por fornecedor.
-- Tudo é visível só para a equipe. Pode rodar mais de uma vez.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) > 0),
  contact_name text not null default '',
  email text not null default '',
  whatsapp text not null default '',
  website text not null default '',
  lead_time_days int not null default 7 check (lead_time_days between 0 and 120),
  return_policy text not null default '',
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.product_suppliers
  add column if not exists supplier_id uuid references public.suppliers (id) on delete set null;

-- Fornecedores digitados à mão nas peças viram cadastros únicos.
insert into public.suppliers (name)
  select distinct trim(supplier_name) from public.product_suppliers where trim(supplier_name) <> ''
  on conflict (name) do nothing;
update public.product_suppliers ps set supplier_id = s.id
  from public.suppliers s where ps.supplier_id is null and s.name = trim(ps.supplier_name);

create table if not exists public.variant_suppliers (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  supplier_sku text not null default '',
  available boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  supplier_name text not null default '',
  status text not null default 'to_order' check (status in ('to_order', 'ordered', 'shipped', 'delivered', 'cancelled')),
  cost numeric(10, 2) check (cost is null or cost >= 0),
  supplier_ref text not null default '',
  tracking_code text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ordered_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
);
create index if not exists supplier_orders_status_idx on public.supplier_orders (status, created_at);
create index if not exists supplier_orders_order_idx on public.supplier_orders (order_id);

create table if not exists public.supplier_order_items (
  supplier_order_id uuid not null references public.supplier_orders (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  name text not null default '',
  variant_label text not null default '',
  quantity int not null check (quantity > 0),
  supplier_sku text not null default '',
  primary key (supplier_order_id, order_item_id)
);

do $$ declare t text; begin
  foreach t in array array['suppliers', 'variant_suppliers', 'supplier_orders', 'supplier_order_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "somente equipe" on public.%I', t);
    execute format('create policy "somente equipe" on public.%I for all using ((select public.is_staff())) with check ((select public.is_staff()))', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Cria os pedidos ao fornecedor de um pedido do cliente: um por fornecedor, só com itens que vendem sem estoque.
-- O custo estimado vem do custo cadastrado da peça; o código do fornecedor vem da variação (ou da peça).
create or replace function public.generate_supplier_orders(p_order uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0; g record; v_so uuid;
begin
  if exists (select 1 from public.supplier_orders where order_id = p_order) then return 0; end if;
  for g in
    select ps.supplier_id, coalesce(s.name, nullif(trim(ps.supplier_name), ''), 'Sem fornecedor') as sname,
           sum(pc.cost * i.quantity) as est_cost
    from public.order_items i
    left join public.product_suppliers ps on ps.product_id = i.product_id
    left join public.suppliers s on s.id = ps.supplier_id
    left join public.product_costs pc on pc.product_id = i.product_id
    where i.order_id = p_order and i.fulfillment <> 'stock'
    group by 1, 2
  loop
    insert into public.supplier_orders (order_id, supplier_id, supplier_name, cost)
      values (p_order, g.supplier_id, g.sname, g.est_cost) returning id into v_so;
    insert into public.supplier_order_items (supplier_order_id, order_item_id, name, variant_label, quantity, supplier_sku)
      select v_so, i.id, i.name, i.variant_label, i.quantity,
             coalesce(nullif(vs.supplier_sku, ''), ps.supplier_sku, '')
      from public.order_items i
      left join public.product_suppliers ps on ps.product_id = i.product_id
      left join public.suppliers s on s.id = ps.supplier_id
      left join public.variant_suppliers vs on vs.variant_id = i.variant_id
      where i.order_id = p_order and i.fulfillment <> 'stock'
        and ps.supplier_id is not distinct from g.supplier_id
        and coalesce(s.name, nullif(trim(ps.supplier_name), ''), 'Sem fornecedor') = g.sname;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.generate_supplier_orders(uuid) from public, anon, authenticated;

-- Pagamento confirmado → cria os pedidos ao fornecedor. Cancelamento → cancela os que ainda não foram feitos.
-- Roda no fim da transação (deferred), quando os itens do pedido já foram gravados.
create or replace function public.orders_supplier_sync() returns trigger
language plpgsql security definer set search_path = public as $$
declare paid text[] := array['paid', 'processing', 'shipped', 'delivered'];
begin
  if new.status = any (paid) and (tg_op = 'INSERT' or not (old.status = any (paid))) then
    perform public.generate_supplier_orders(new.id);
  elsif new.status in ('cancelled', 'refunded') and tg_op = 'UPDATE' and old.status is distinct from new.status then
    update public.supplier_orders
      set status = 'cancelled', updated_at = now(), notes = trim(notes || ' Pedido do cliente cancelado.')
      where order_id = new.id and status = 'to_order';
  end if;
  return null;
end $$;
revoke execute on function public.orders_supplier_sync() from public, anon, authenticated;

drop trigger if exists orders_supplier_sync on public.orders;
create constraint trigger orders_supplier_sync after insert or update of status on public.orders
  deferrable initially deferred for each row execute function public.orders_supplier_sync();

-- Pedidos já pagos antes desta atualização também ganham os pedidos ao fornecedor.
do $$ declare o record; begin
  for o in select id from public.orders where status in ('paid', 'processing') loop
    perform public.generate_supplier_orders(o.id);
  end loop;
end $$;

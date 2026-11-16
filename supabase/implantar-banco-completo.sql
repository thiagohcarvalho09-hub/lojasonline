-- ATELIER — instalação completa do banco (rode UMA vez num projeto Supabase novo)
-- Junta, em ordem: 0001_schema, 0002_seed (catálogo de exemplo), 0003_forum, 0004_proprietaria.
-- Se o banco já tiver a loja instalada, o script para logo no começo sem mudar nada.
begin;
do $$ begin
  if to_regclass('public.profiles') is not null then
    raise exception 'A loja já está instalada neste banco (tabela profiles existe). Nada foi alterado.';
  end if;
end $$;

-- ===== supabase/migrations/0001_schema.sql =====
-- ATELIER / workspace — schema, segurança (RLS) e regras de negócio
create extension if not exists pgcrypto;

-- ───────────────────────── Perfis e papéis ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'customer' check (role in ('owner', 'staff', 'customer')),
  created_at timestamptz not null default now()
);

-- O primeiro usuário cadastrado vira proprietário da loja; os demais entram como clientes.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case when exists (select 1 from public.profiles where role = 'owner') then 'customer' else 'owner' end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'staff'));
$$;

create function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;

-- ───────────────────────── Loja ─────────────────────────
create table public.store_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'ATELIER',
  tagline text not null default 'Moda & Acessórios',
  announcement text not null default 'Frete grátis acima de R$ 900 · Troca fácil em 30 dias · Nova coleção no ar',
  hero_title text not null default 'Nova coleção',
  hero_subtitle text not null default 'Peças que definem a temporada.',
  season text not null default 'SS27',
  shipping_flat numeric(10, 2) not null default 29.90,
  free_shipping_over numeric(10, 2) not null default 900,
  low_stock_threshold int not null default 5,
  pix_key text not null default '',
  whatsapp text not null default '',
  contact_email text not null default '',
  instagram text not null default '',
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  position int not null default 0
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  season text not null default '',
  image_url text,
  tone text not null default '#cfcac0',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  collection_id uuid references public.collections (id) on delete set null,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2),
  cost numeric(10, 2),
  sku text,
  images text[] not null default '{}',
  art text not null default 'blazer',
  tone text not null default '#cfcac0',
  material text not null default '',
  care text not null default '',
  tags text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  is_featured boolean not null default false,
  wish_count int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.products (category_id);
create index on public.products (collection_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text not null default 'Único',
  color text not null default 'Preto',
  color_hex text not null default '#0b0b0c',
  sku text,
  stock int not null default 0 check (stock >= 0),
  price_override numeric(10, 2),
  created_at timestamptz not null default now()
);
create index on public.product_variants (product_id);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null default '',
  cpf text not null default '',
  address jsonb not null default '{}',
  tags text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create sequence public.order_number_seq start 10400;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('public.order_number_seq'),
  public_token uuid not null unique default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  channel text not null default 'online' check (channel in ('online', 'store', 'whatsapp')),
  payment_method text not null default 'pix' check (payment_method in ('pix', 'card', 'cash')),
  subtotal numeric(10, 2) not null default 0,
  discount numeric(10, 2) not null default 0,
  shipping numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  coupon_code text,
  shipping_address jsonb not null default '{}',
  tracking_code text,
  notes text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.orders (created_at desc);
create index on public.orders (customer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  name text not null,
  variant_label text not null default '',
  unit_price numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  total numeric(10, 2) not null
);
create index on public.order_items (order_id);
create index on public.order_items (product_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text,
  message text not null,
  created_at timestamptz not null default now()
);
create index on public.order_events (order_id);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null default 'percent' check (type in ('percent', 'fixed', 'free_shipping')),
  value numeric(10, 2) not null default 0,
  min_subtotal numeric(10, 2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('sale', 'restock', 'adjustment', 'return')),
  note text not null default '',
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.inventory_movements (variant_id, created_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  author text not null check (char_length(author) between 2 and 60),
  rating int not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 3 and 1000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.reviews (product_id);

create table public.newsletter_subscribers (
  email text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles enable row level security;
alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.coupons enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.reviews enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "perfil próprio ou equipe" on public.profiles for select
  using (id = (select auth.uid()) or (select public.is_staff()));
create policy "proprietário gerencia papéis" on public.profiles for update
  using ((select public.is_owner())) with check ((select public.is_owner()));

create policy "leitura pública" on public.store_settings for select using (true);
create policy "equipe edita" on public.store_settings for update
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "leitura pública" on public.categories for select using (true);
create policy "equipe insere" on public.categories for insert with check ((select public.is_staff()));
create policy "equipe edita" on public.categories for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "equipe remove" on public.categories for delete using ((select public.is_staff()));

create policy "ativas ou equipe" on public.collections for select using (is_active or (select public.is_staff()));
create policy "equipe insere" on public.collections for insert with check ((select public.is_staff()));
create policy "equipe edita" on public.collections for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "equipe remove" on public.collections for delete using ((select public.is_staff()));

create policy "ativos ou equipe" on public.products for select using (status = 'active' or (select public.is_staff()));
create policy "equipe insere" on public.products for insert with check ((select public.is_staff()));
create policy "equipe edita" on public.products for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "equipe remove" on public.products for delete using ((select public.is_staff()));

create policy "leitura pública" on public.product_variants for select using (true);
create policy "equipe insere" on public.product_variants for insert with check ((select public.is_staff()));
create policy "equipe edita" on public.product_variants for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "equipe remove" on public.product_variants for delete using ((select public.is_staff()));

create policy "somente equipe" on public.customers for all using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "somente equipe" on public.orders for all using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "somente equipe" on public.order_items for all using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "somente equipe" on public.order_events for all using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "somente equipe" on public.coupons for all using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "somente equipe" on public.inventory_movements for all using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "aprovadas ou equipe" on public.reviews for select using (approved or (select public.is_staff()));
create policy "qualquer pessoa envia para moderação" on public.reviews for insert with check (approved = false);
create policy "equipe modera" on public.reviews for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "equipe remove" on public.reviews for delete using ((select public.is_staff()));

create policy "qualquer pessoa assina" on public.newsletter_subscribers for insert with check (true);
create policy "equipe lê" on public.newsletter_subscribers for select using ((select public.is_staff()));
create policy "equipe remove" on public.newsletter_subscribers for delete using ((select public.is_staff()));

-- ───────────────────────── Regras de negócio (RPC) ─────────────────────────

-- Calcula o desconto de um cupom. Retorna {valid, message, code, type, discount, free_shipping}.
create function public.validate_coupon(p_code text, p_subtotal numeric) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c public.coupons;
begin
  select * into c from public.coupons where upper(code) = upper(trim(p_code));
  if not found or not c.is_active then
    return jsonb_build_object('valid', false, 'message', 'Cupom inválido.');
  end if;
  if c.ends_at is not null and c.ends_at < now() then
    return jsonb_build_object('valid', false, 'message', 'Este cupom expirou.');
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return jsonb_build_object('valid', false, 'message', 'Este cupom atingiu o limite de usos.');
  end if;
  if p_subtotal < c.min_subtotal then
    return jsonb_build_object('valid', false, 'message',
      'Pedido mínimo de R$ ' || replace(to_char(c.min_subtotal, 'FM999999990.00'), '.', ',') || ' para este cupom.');
  end if;
  return jsonb_build_object(
    'valid', true, 'code', c.code, 'type', c.type, 'value', c.value,
    'free_shipping', c.type = 'free_shipping',
    'discount', case c.type
      when 'percent' then round(p_subtotal * least(c.value, 100) / 100, 2)
      when 'fixed' then least(c.value, p_subtotal)
      else 0 end,
    'message', 'Cupom aplicado.');
end $$;

-- Fecha um pedido de forma atômica: confere preços e estoque no banco, aplica cupom e frete,
-- cria/atualiza o cliente, baixa o estoque e registra o histórico.
create function public.place_order(p jsonb) returns jsonb
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
    variant_id uuid, product_id uuid, name text, label text, price numeric, qty int
  ) on commit drop;

  for it in select * from jsonb_array_elements(p -> 'items') loop
    v_qty := (it ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'Quantidade inválida.'; end if;
    select v.id as variant_id, v.stock, pr.id as product_id, pr.name, pr.status,
           coalesce(v.price_override, pr.price) as price,
           concat_ws(' · ', nullif(v.size, ''), nullif(v.color, '')) as label
      into r
      from public.product_variants v join public.products pr on pr.id = v.product_id
      where v.id = (it ->> 'variant_id')::uuid
      for update of v;
    if not found or (r.status <> 'active' and not staff) then raise exception 'Uma das peças não está mais disponível.'; end if;
    if r.stock < v_qty then
      raise exception 'Estoque insuficiente para % (%): restam % un.', r.name, r.label, r.stock;
    end if;
    insert into _lines values (r.variant_id, r.product_id, r.name, r.label, r.price, v_qty);
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

  insert into public.order_items (order_id, product_id, variant_id, name, variant_label, unit_price, quantity, total)
    select v_order.id, product_id, variant_id, name, label, price, qty, price * qty from _lines;
  update public.product_variants v set stock = v.stock - l.qty from _lines l where v.id = l.variant_id;
  insert into public.inventory_movements (variant_id, delta, reason, note, order_id)
    select variant_id, -qty, 'sale', 'Pedido #' || v_order.number, v_order.id from _lines;
  insert into public.order_events (order_id, status, message)
  values (v_order.id, v_order.status,
          case when v_paid then 'Pedido criado e pago no balcão.' else 'Pedido recebido. Aguardando pagamento.' end);

  drop table _lines;
  return jsonb_build_object('id', v_order.id, 'number', v_order.number, 'token', v_order.public_token, 'total', v_order.total);
end $$;

-- Muda o status de um pedido; cancelamentos e estornos devolvem as peças ao estoque.
create function public.set_order_status(p_order uuid, p_status text, p_tracking text default null, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders; closed text[] := array['cancelled', 'refunded'];
begin
  if not public.is_staff() then raise exception 'Acesso negado.'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Pedido não encontrado.'; end if;
  if o.status = any (closed) then raise exception 'Pedido encerrado não pode ser alterado.'; end if;

  if p_status = any (closed) then
    update public.product_variants v set stock = v.stock + i.quantity
      from public.order_items i where i.order_id = o.id and v.id = i.variant_id;
    insert into public.inventory_movements (variant_id, delta, reason, note, order_id)
      select variant_id, quantity, 'return', 'Pedido #' || o.number || ' encerrado', o.id
      from public.order_items where order_id = o.id and variant_id is not null;
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

create function public.adjust_stock(p_variant uuid, p_delta int, p_reason text default 'adjustment', p_note text default '')
returns int language plpgsql security definer set search_path = public as $$
declare v_stock int;
begin
  if not public.is_staff() then raise exception 'Acesso negado.'; end if;
  if p_delta = 0 then raise exception 'Informe uma quantidade diferente de zero.'; end if;
  update public.product_variants set stock = stock + p_delta where id = p_variant and stock + p_delta >= 0
    returning stock into v_stock;
  if not found then raise exception 'Ajuste deixaria o estoque negativo.'; end if;
  insert into public.inventory_movements (variant_id, delta, reason, note)
  values (p_variant, p_delta, p_reason, coalesce(p_note, ''));
  return v_stock;
end $$;

-- Consulta pública de pedido: só com o token do pedido, ou com número + e-mail.
create function public.order_public(p_token uuid default null, p_number int default null, p_email text default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'number', o.number, 'token', o.public_token, 'status', o.status, 'channel', o.channel,
    'payment_method', o.payment_method, 'subtotal', o.subtotal, 'discount', o.discount,
    'shipping', o.shipping, 'total', o.total, 'coupon_code', o.coupon_code,
    'tracking_code', o.tracking_code, 'created_at', o.created_at, 'address', o.shipping_address,
    'customer_name', c.name,
    'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'name', i.name, 'label', i.variant_label, 'quantity', i.quantity, 'unit_price', i.unit_price,
        'total', i.total, 'art', pr.art, 'tone', pr.tone, 'image', pr.images[1])), '[]'::jsonb)
      from public.order_items i left join public.products pr on pr.id = i.product_id where i.order_id = o.id),
    'events', (select coalesce(jsonb_agg(jsonb_build_object(
        'status', e.status, 'message', e.message, 'created_at', e.created_at) order by e.created_at), '[]'::jsonb)
      from public.order_events e where e.order_id = o.id))
  from public.orders o left join public.customers c on c.id = o.customer_id
  where (p_token is not null and o.public_token = p_token)
     or (p_token is null and p_number is not null and o.number = p_number and lower(c.email) = lower(trim(p_email)))
  limit 1;
$$;

create function public.bump_wish(p_product uuid, p_delta int) returns void
language sql security definer set search_path = public as $$
  update public.products set wish_count = greatest(0, wish_count + sign(p_delta)::int) where id = p_product;
$$;

-- Indicadores do painel para um período, com comparação ao período anterior de mesma duração.
create function public.dashboard_stats(p_from timestamptz, p_to timestamptz) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_prev_from timestamptz := p_from - (p_to - p_from);
  result jsonb;
begin
  if not public.is_staff() then raise exception 'Acesso negado.'; end if;
  with valid as (
    select * from public.orders where status in ('paid', 'processing', 'shipped', 'delivered')
  ), cur as (
    select * from valid where created_at >= p_from and created_at < p_to
  ), prev as (
    select * from valid where created_at >= v_prev_from and created_at < p_from
  ), buyers as (
    select c.customer_id, (select count(*) from valid v where v.customer_id = c.customer_id) as lifetime
    from cur c where c.customer_id is not null group by c.customer_id
  ), items as (
    select i.*, pr.art, pr.tone, pr.images, pr.slug, cat.name as category
    from public.order_items i join cur on cur.id = i.order_id
    left join public.products pr on pr.id = i.product_id
    left join public.categories cat on cat.id = pr.category_id
  )
  select jsonb_build_object(
    'revenue', (select coalesce(sum(total), 0) from cur),
    'orders', (select count(*) from cur),
    'prev_revenue', (select coalesce(sum(total), 0) from prev),
    'prev_orders', (select count(*) from prev),
    'units', (select coalesce(sum(quantity), 0) from items),
    'discounts', (select coalesce(sum(discount), 0) from cur),
    'buyers', (select count(*) from buyers),
    'recurring', (select count(*) from buyers where lifetime > 1),
    'pending', (select count(*) from public.orders where status = 'pending'),
    'to_ship', (select count(*) from public.orders where status in ('paid', 'processing')),
    'channels', (select coalesce(jsonb_agg(jsonb_build_object('channel', channel, 'total', t, 'count', n)), '[]'::jsonb)
      from (select channel, sum(total) t, count(*) n from cur group by channel) s),
    'payments', (select coalesce(jsonb_agg(jsonb_build_object('method', payment_method, 'total', t, 'count', n)), '[]'::jsonb)
      from (select payment_method, sum(total) t, count(*) n from cur group by payment_method) s),
    'statuses', (select coalesce(jsonb_agg(jsonb_build_object('status', status, 'count', n)), '[]'::jsonb)
      from (select status, count(*) n from public.orders where created_at >= p_from and created_at < p_to group by status) s),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'total', t, 'count', n) order by d), '[]'::jsonb)
      from (select (created_at at time zone 'America/Sao_Paulo')::date d, sum(total) t, count(*) n from cur group by 1) s),
    'categories', (select coalesce(jsonb_agg(jsonb_build_object('category', category, 'total', t, 'units', u) order by t desc), '[]'::jsonb)
      from (select coalesce(category, 'Sem categoria') category, sum(total) t, sum(quantity) u from items group by 1) s),
    'top_products', (select coalesce(jsonb_agg(to_jsonb(s) order by s.units desc), '[]'::jsonb)
      from (select product_id, name, max(slug) slug, max(art) art, max(tone) tone, (max(images))[1] image,
                   sum(quantity) units, sum(total) revenue
            from items group by product_id, name order by sum(quantity) desc limit 8) s)
  ) into result;
  return result;
end $$;

revoke execute on function public.set_order_status(uuid, text, text, text) from public, anon;
revoke execute on function public.adjust_stock(uuid, int, text, text) from public, anon;
revoke execute on function public.dashboard_stats(timestamptz, timestamptz) from public, anon;
grant execute on function public.set_order_status(uuid, text, text, text) to authenticated;
grant execute on function public.adjust_stock(uuid, int, text, text) to authenticated;
grant execute on function public.dashboard_stats(timestamptz, timestamptz) to authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- ───────────────────────── Storage: fotos de produto ─────────────────────────
insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true)
on conflict (id) do nothing;

create policy "equipe envia fotos" on storage.objects for insert
  with check (bucket_id = 'produtos' and (select public.is_staff()));
create policy "equipe atualiza fotos" on storage.objects for update
  using (bucket_id = 'produtos' and (select public.is_staff()));
create policy "equipe remove fotos" on storage.objects for delete
  using (bucket_id = 'produtos' and (select public.is_staff()));

insert into public.store_settings (id) values (1) on conflict do nothing;

-- Resumo por cliente (respeita o RLS de quem consulta).
create view public.customer_stats with (security_invoker = true) as
select c.*,
  count(o.id) filter (where o.status in ('paid', 'processing', 'shipped', 'delivered')) as orders_count,
  coalesce(sum(o.total) filter (where o.status in ('paid', 'processing', 'shipped', 'delivered')), 0) as total_spent,
  max(o.created_at) as last_order_at
from public.customers c left join public.orders o on o.customer_id = c.id
group by c.id;

-- ===== supabase/migrations/0002_seed.sql =====
-- Dados de demonstração: catálogo, clientes fictícios e ~2 meses de pedidos.
-- Pode ser apagado pelo painel a qualquer momento.
insert into public.categories (name, slug, position) values
  ('Alfaiataria', 'alfaiataria', 1), ('Vestidos', 'vestidos', 2), ('Bolsas', 'bolsas', 3),
  ('Joias', 'joias', 4), ('Óculos', 'oculos', 5), ('Calçados', 'calcados', 6), ('Acessórios', 'acessorios', 7);

insert into public.collections (name, slug, description, season, tone, is_featured, position) values
  ('Nova Coleção', 'nova-colecao', 'Alfaiataria de ombro marcado, couro estruturado e metal líquido. Peças que definem a temporada.', 'SS27', '#c9c5bd', true, 1),
  ('Metal Líquido', 'metal-liquido', 'Joias esculturais em banho de prata com acabamento espelhado.', 'SS27', '#bfc4c9', true, 2),
  ('Essenciais', 'essenciais', 'O guarda-roupa permanente: cortes limpos, tecidos nobres, zero excesso.', 'Permanente', '#d6d0c4', false, 3),
  ('Noite', 'noite', 'Cetim, brilho contido e silhuetas longas para depois das oito.', 'FW26', '#b9b4b0', false, 4);

with p (name, slug, cat, col, price, compare, cost, art, tone, material, care, featured, wish, descr, sizes, colors) as (values
  ('Blazer de alfaiataria', 'blazer-de-alfaiataria', 'alfaiataria', 'nova-colecao', 2890.00, null, 980.00, 'blazer', '#c9c5bd', 'Lã fria 100% · forro de cupro', 'Lavagem a seco', true, 142, 'Ombro estruturado, lapela de pico e cintura levemente marcada. Cortado em lã fria italiana com forro de cupro.', 'PP,P,M,G,GG', 'Preto:#0b0b0c,Grafite:#3a3b3f'),
  ('Bolsa estruturada', 'bolsa-estruturada', 'bolsas', 'nova-colecao', 1980.00, 2290.00, 720.00, 'bag', '#cfcac0', 'Couro bovino liso · ferragens em níquel', 'Limpar com pano seco', true, 96, 'Bolsa de mão em couro rígido com aba geométrica e alça arqueada. Interior em suede com bolso para cartões.', 'Único', 'Preto:#0b0b0c,Marfim:#e8e1d2'),
  ('Óculos de acetato', 'oculos-de-acetato', 'oculos', 'nova-colecao', 780.00, null, 240.00, 'sunglasses', '#d4cdc0', 'Acetato italiano · lentes UV400', 'Guardar no estojo', true, 78, 'Armação espessa em acetato tartaruga com lentes fumê degradê e proteção UV400.', 'Único', 'Tartaruga:#5b3a22,Preto:#0b0b0c'),
  ('Brinco escultural', 'brinco-escultural', 'joias', 'metal-liquido', 1250.00, null, 380.00, 'earring', '#c3c7cb', 'Latão com banho de prata 925', 'Evitar contato com perfume', true, 64, 'Gota oca de superfície espelhada, moldada à mão. Leve apesar do volume.', 'Único', 'Prata:#c9ccd1,Ouro:#c9a24b'),
  ('Bracelete líquido', 'bracelete-liquido', 'joias', 'metal-liquido', 1490.00, null, 450.00, 'cuff', '#c3c7cb', 'Latão com banho de prata 925', 'Evitar contato com perfume', true, 51, 'Bracelete rígido de formas orgânicas, como metal derretido solidificado no pulso.', 'P,M', 'Prata:#c9ccd1'),
  ('Anel duplo cromado', 'anel-duplo-cromado', 'joias', 'metal-liquido', 690.00, null, 190.00, 'ring', '#c8cbce', 'Latão com banho de prata 925', 'Evitar contato com perfume', false, 33, 'Dois aros fundidos em um só, polimento espelhado.', '14,16,18,20', 'Prata:#c9ccd1'),
  ('Vestido coluna', 'vestido-coluna', 'vestidos', 'noite', 3450.00, null, 1150.00, 'dress', '#bdb8b3', 'Cetim de seda 100%', 'Lavagem a seco', true, 88, 'Vestido longo de corte reto em cetim de seda pesado, alças finas e fenda lateral.', 'PP,P,M,G', 'Preto:#0b0b0c,Champagne:#d8c7a6'),
  ('Calça pantalona', 'calca-pantalona', 'alfaiataria', 'essenciais', 1290.00, null, 420.00, 'trousers', '#d6d0c4', 'Lã fria com elastano', 'Lavagem a seco', false, 47, 'Cintura alta, pregas frontais e perna ampla que cai até o chão.', '34,36,38,40,42,44', 'Preto:#0b0b0c,Areia:#cbbfa8'),
  ('Camisa de popeline', 'camisa-de-popeline', 'alfaiataria', 'essenciais', 890.00, null, 260.00, 'shirt', '#dcd8cf', 'Algodão egípcio 100%', 'Lavar à mão', false, 39, 'Camisa de modelagem ampla, colarinho firme e punho duplo.', 'P,M,G,GG', 'Branco:#f4f1ea,Azul:#1546ff'),
  ('Scarpin fio', 'scarpin-fio', 'calcados', 'noite', 1690.00, 1990.00, 560.00, 'heel', '#c7c2bb', 'Couro verniz · salto 9 cm', 'Limpar com flanela', false, 58, 'Scarpin de bico fino em verniz com salto agulha de 9 cm.', '34,35,36,37,38,39', 'Preto:#0b0b0c'),
  ('Sobretudo longo', 'sobretudo-longo', 'alfaiataria', 'nova-colecao', 4290.00, null, 1480.00, 'coat', '#c4c0b8', 'Lã e cashmere', 'Lavagem a seco', true, 71, 'Sobretudo transpassado até o tornozelo, ombro caído e cinto do mesmo tecido.', 'P,M,G', 'Preto:#0b0b0c,Camelo:#b08a5b'),
  ('Cinto de fivela oval', 'cinto-de-fivela-oval', 'acessorios', 'essenciais', 590.00, null, 160.00, 'belt', '#d6d0c4', 'Couro bovino · fivela niquelada', 'Limpar com pano seco', false, 22, 'Cinto de 3 cm com fivela oval polida.', '80,90,100', 'Preto:#0b0b0c'),
  ('Lenço de seda', 'lenco-de-seda', 'acessorios', 'essenciais', 480.00, null, 130.00, 'scarf', '#d9d3c6', 'Seda pura 90 × 90', 'Lavagem a seco', false, 27, 'Carré de seda com bainha feita à mão.', 'Único', 'Azul:#1546ff,Lima:#dcf24e,Preto:#0b0b0c'),
  ('Saia lápis de couro', 'saia-lapis-de-couro', 'alfaiataria', 'nova-colecao', 2190.00, null, 760.00, 'skirt', '#cbc6bd', 'Couro de cordeiro', 'Limpeza especializada', false, 44, 'Saia midi em couro macio com fenda traseira e zíper invisível.', '34,36,38,40,42', 'Preto:#0b0b0c'),
  ('Tricot canelado', 'tricot-canelado', 'alfaiataria', 'essenciais', 1090.00, null, 340.00, 'knit', '#d8d3c8', 'Lã merino extrafina', 'Lavar à mão, secar na horizontal', false, 35, 'Suéter de gola alta em ponto canelado, ajustado ao corpo.', 'P,M,G', 'Marfim:#e8e1d2,Preto:#0b0b0c'),
  ('Bota cano alto', 'bota-cano-alto', 'calcados', 'nova-colecao', 2590.00, null, 880.00, 'boot', '#c5c0b8', 'Couro bovino · salto bloco 6 cm', 'Hidratar o couro a cada estação', false, 62, 'Bota de cano reto até o joelho, bico quadrado e salto bloco.', '35,36,37,38,39', 'Preto:#0b0b0c')
), ins as (
  insert into public.products (name, slug, description, category_id, collection_id, price, compare_at_price, cost, sku, art, tone, material, care, is_featured, wish_count, tags, created_at)
  select p.name, p.slug, p.descr, c.id, co.id, p.price, p.compare, p.cost,
         'ATL-' || upper(left(p.art, 3)) || '-' || lpad((row_number() over ())::text, 3, '0'),
         p.art, p.tone, p.material, p.care, p.featured, p.wish, array[p.cat, co.season],
         now() - (row_number() over ()) * interval '3 days'
  from p join public.categories c on c.slug = p.cat join public.collections co on co.slug = p.col
  returning id, slug, sku
)
insert into public.product_variants (product_id, size, color, color_hex, sku, stock)
select ins.id, sz, split_part(cl, ':', 1), split_part(cl, ':', 2),
       ins.sku || '-' || upper(left(split_part(cl, ':', 1), 2)) || '-' || sz,
       (abs(hashtext(ins.slug || sz || cl)) % 19)
from ins join p on p.slug = ins.slug,
     unnest(string_to_array(p.sizes, ',')) sz, unnest(string_to_array(p.colors, ',')) cl;

insert into public.customers (name, email, phone, address, tags, created_at)
select 'Cliente ' || lpad(n::text, 2, '0'), 'cliente' || lpad(n::text, 2, '0') || '@exemplo.com',
       '(11) 9' || lpad((abs(hashtext('t' || n)) % 100000000)::text, 8, '0'),
       jsonb_build_object('cep', '01310-100', 'street', 'Av. Paulista', 'number', (100 + n * 37)::text,
                          'district', 'Bela Vista', 'city', 'São Paulo', 'state', 'SP'),
       case when n % 5 = 0 then array['VIP'] else '{}'::text[] end,
       now() - (70 - n) * interval '1 day'
from generate_series(1, 24) n;

insert into public.coupons (code, type, value, min_subtotal, max_uses) values
  ('BEMVINDA10', 'percent', 10, 0, null),
  ('ATELIER200', 'fixed', 200, 1500, 100),
  ('FRETEGRATIS', 'free_shipping', 0, 300, null);

insert into public.reviews (product_id, author, rating, comment, approved)
select id, 'Cliente 0' || n, 5 - (n % 2), case n
  when 1 then 'Caimento impecável, o tecido é ainda melhor ao vivo.'
  when 2 then 'Chegou em dois dias, embalagem linda. Veste um pouco maior.'
  else 'Peça de acabamento perfeito. Já quero em outra cor.' end, n < 3
from public.products, generate_series(1, 3) n where is_featured;

-- Pedidos dos últimos 60 dias
do $$
declare
  i int; v_order uuid; v_when timestamptz; v_cust uuid; v_channel text; v_status text; v_sub numeric;
  v_ship numeric; r record; n_items int; roll float; age float;
begin
  for i in 1..96 loop
    age := power(random(), 1.35) * 60;
    v_when := now() - age * interval '1 day';
    select id into v_cust from public.customers order by random() * (1 + abs(hashtext(email)) % 5) limit 1;
    roll := random();
    v_channel := case when roll < 0.58 then 'online' when roll < 0.90 then 'store' else 'whatsapp' end;
    roll := random();
    v_status := case
      when age < 1 then (array['pending', 'paid', 'paid', 'processing'])[1 + floor(random() * 4)::int]
      when age < 4 then (array['paid', 'processing', 'shipped', 'shipped'])[1 + floor(random() * 4)::int]
      when roll < 0.05 then 'cancelled' when roll < 0.08 then 'refunded' else 'delivered' end;
    if v_channel = 'store' and v_status in ('pending', 'processing', 'shipped') then v_status := 'delivered'; end if;

    insert into public.orders (customer_id, status, channel, payment_method, shipping_address, created_at, paid_at)
    select v_cust, v_status, v_channel,
           case when v_channel = 'store' and random() < 0.3 then 'cash' when random() < 0.55 then 'pix' else 'card' end,
           c.address, v_when, case when v_status <> 'pending' then v_when + interval '20 minutes' end
    from public.customers c where c.id = v_cust returning id into v_order;

    n_items := 1 + floor(power(random(), 2.2) * 3)::int;
    v_sub := 0;
    for r in
      select v.id variant_id, p.id product_id, p.name, v.size || ' · ' || v.color label, p.price
      from public.product_variants v join public.products p on p.id = v.product_id
      order by random() / (p.wish_count + 20) limit n_items
    loop
      insert into public.order_items (order_id, product_id, variant_id, name, variant_label, unit_price, quantity, total)
      values (v_order, r.product_id, r.variant_id, r.name, r.label, r.price, 1, r.price);
      v_sub := v_sub + r.price;
    end loop;
    v_ship := case when v_channel = 'store' or v_sub >= 900 then 0 else 29.90 end;
    update public.orders set subtotal = v_sub, shipping = v_ship, total = v_sub + v_ship,
      tracking_code = case when v_status in ('shipped', 'delivered') and v_channel <> 'store'
        then 'BR' || lpad((abs(hashtext(v_order::text)) % 1000000000)::text, 9, '0') || 'SP' end
    where id = v_order;
    insert into public.order_events (order_id, status, message, created_at)
    values (v_order, 'pending', 'Pedido recebido.', v_when);
    if v_status <> 'pending' then
      insert into public.order_events (order_id, status, message, created_at)
      values (v_order, v_status, 'Status atualizado para ' || v_status || '.', v_when + interval '1 hour');
    end if;
  end loop;
end $$;

-- ===== supabase/migrations/0003_forum.sql =====
-- Fórum do ateliê: tópicos e respostas da comunidade.
create table public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 140),
  body text not null check (char_length(body) between 4 and 5000),
  category text not null default 'Styling' check (category in ('Styling', 'Medidas & caimento', 'Cuidados', 'Lançamentos', 'Geral')),
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null default '',
  author_staff boolean not null default false,
  pinned boolean not null default false,
  locked boolean not null default false,
  replies_count int not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on public.forum_topics (pinned desc, last_activity_at desc);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics (id) on delete cascade,
  body text not null check (char_length(body) between 2 and 5000),
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null default '',
  author_staff boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.forum_replies (topic_id, created_at);

-- Autoria vem sempre da sessão, nunca do que o cliente envia.
create function public.forum_stamp_author() returns trigger
language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid();
  if not found then raise exception 'Entre na sua conta para participar do fórum.'; end if;
  new.author_id := p.id;
  new.author_name := coalesce(nullif(split_part(p.full_name, ' ', 1), ''), 'Cliente');
  new.author_staff := p.role in ('owner', 'staff');
  new.created_at := now();
  if tg_table_name = 'forum_topics' then
    new.replies_count := 0;
    new.last_activity_at := now();
    if not new.author_staff then new.pinned := false; new.locked := false; end if;
  elsif exists (select 1 from public.forum_topics t where t.id = new.topic_id and t.locked) and not new.author_staff then
    raise exception 'Este tópico está fechado para novas respostas.';
  end if;
  return new;
end $$;

create trigger forum_topics_author before insert on public.forum_topics
for each row execute function public.forum_stamp_author();
create trigger forum_replies_author before insert on public.forum_replies
for each row execute function public.forum_stamp_author();

create function public.forum_count_replies() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_topics set replies_count = replies_count + 1, last_activity_at = now() where id = new.topic_id;
  else
    update public.forum_topics set replies_count = greatest(0, replies_count - 1) where id = old.topic_id;
  end if;
  return null;
end $$;

create trigger forum_replies_count after insert or delete on public.forum_replies
for each row execute function public.forum_count_replies();

alter table public.forum_topics enable row level security;
alter table public.forum_replies enable row level security;

create policy "leitura pública" on public.forum_topics for select using (true);
create policy "contas criam tópicos" on public.forum_topics for insert to authenticated with check (true);
create policy "equipe modera" on public.forum_topics for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "autora ou equipe remove" on public.forum_topics for delete
  using (author_id = (select auth.uid()) or (select public.is_staff()));

create policy "leitura pública" on public.forum_replies for select using (true);
create policy "contas respondem" on public.forum_replies for insert to authenticated with check (true);
create policy "autora ou equipe remove" on public.forum_replies for delete
  using (author_id = (select auth.uid()) or (select public.is_staff()));

revoke execute on function public.forum_stamp_author() from public, anon, authenticated;
revoke execute on function public.forum_count_replies() from public, anon, authenticated;

-- ===== supabase/migrations/0004_proprietaria.sql =====
-- Garante que tefi7009@gmail.com seja proprietária da loja (acesso total ao /admin),
-- tanto para a conta que já existe quanto para um cadastro futuro com esse e-mail.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when lower(new.email) = 'tefi7009@gmail.com' then 'owner'
      when exists (select 1 from public.profiles where role = 'owner') then 'customer'
      else 'owner'
    end
  );
  return new;
end $$;

-- Conta já cadastrada: cria o perfil se faltar e promove a proprietária.
insert into public.profiles (id, full_name, email, role)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)), u.email, 'owner'
from auth.users u
where lower(u.email) = 'tefi7009@gmail.com'
on conflict (id) do update set role = 'owner';

-- Usuários criados antes da instalação ganham perfil (clientes; tefi7009@gmail.com como proprietária).
insert into public.profiles (id, full_name, email, role)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)), u.email,
       case when lower(u.email) = 'tefi7009@gmail.com' then 'owner' else 'customer' end
from auth.users u
on conflict (id) do nothing;

commit;

-- Conferência: deve listar tefi7009@gmail.com como owner.
select email, role from public.profiles order by role, email;

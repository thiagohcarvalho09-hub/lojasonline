-- Custo das peças fora do alcance público.
-- `products` tem leitura pública (peças ativas) e o Supabase expõe todas as colunas da tabela,
-- então `products.cost` deixava qualquer visitante calcular a margem da loja.
-- O custo passa a morar numa tabela própria, visível apenas para a equipe.

create table public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  cost numeric(10, 2) not null check (cost >= 0),
  updated_at timestamptz not null default now()
);

alter table public.product_costs enable row level security;
create policy "somente equipe" on public.product_costs for all
  using ((select public.is_staff())) with check ((select public.is_staff()));
revoke all on public.product_costs from anon;

insert into public.product_costs (product_id, cost)
  select id, cost from public.products where cost is not null and cost >= 0;

alter table public.products drop column cost;

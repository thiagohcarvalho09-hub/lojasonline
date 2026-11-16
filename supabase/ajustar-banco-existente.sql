-- ATELIER — ajuste para um banco onde a loja JÁ está instalada.
-- 1) libera tefi7009@gmail.com como proprietária; 2) apaga os dados fictícios. Pode rodar mais de uma vez.
begin;

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

-- Remove o catálogo de demonstração (antigo 0002_seed): peças, clientes, pedidos,
-- cupons e avaliações fictícios. Só apaga o que foi criado pelo seed; pode rodar mais de uma vez.

-- Pedidos e clientes fictícios (cliente01@exemplo.com … cliente24@exemplo.com)
delete from public.orders
where customer_id in (select id from public.customers where email ~ '^cliente[0-9]{2}@exemplo\.com$');
delete from public.customers where email ~ '^cliente[0-9]{2}@exemplo\.com$';

-- Cupons de exemplo
delete from public.coupons where code in ('BEMVINDA10', 'ATELIER200', 'FRETEGRATIS');

-- Peças de exemplo (variantes, avaliações e movimentos de estoque saem junto)
delete from public.products where slug in (
  'blazer-de-alfaiataria', 'bolsa-estruturada', 'oculos-de-acetato', 'brinco-escultural',
  'bracelete-liquido', 'anel-duplo-cromado', 'vestido-coluna', 'calca-pantalona',
  'camisa-de-popeline', 'scarpin-fio', 'sobretudo-longo', 'cinto-de-fivela-oval',
  'lenco-de-seda', 'saia-lapis-de-couro', 'tricot-canelado', 'bota-cano-alto'
);

-- Coleções e categorias de exemplo, só se nenhuma peça real usar
delete from public.collections c
where c.slug in ('nova-colecao', 'metal-liquido', 'essenciais', 'noite')
  and not exists (select 1 from public.products p where p.collection_id = c.id);
delete from public.categories c
where c.slug in ('alfaiataria', 'vestidos', 'bolsas', 'joias', 'oculos', 'calcados', 'acessorios')
  and not exists (select 1 from public.products p where p.category_id = c.id);

commit;

-- Conferência
select 'proprietária' item, string_agg(email, ', ') valor from public.profiles where role = 'owner'
union all select 'peças', count(*)::text from public.products
union all select 'pedidos', count(*)::text from public.orders
union all select 'clientes', count(*)::text from public.customers
union all select 'fórum instalado', (to_regclass('public.forum_topics') is not null)::text;

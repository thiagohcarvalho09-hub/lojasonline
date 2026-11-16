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

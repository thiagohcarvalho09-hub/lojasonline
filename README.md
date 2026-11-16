# ATELIER / workspace

Loja online de moda + painel de gestão. Next.js 16 (App Router) na Vercel, Supabase (Postgres, Auth, Storage) como banco.

## O que tem

**Loja** — vitrine em largura total com menu lateral de três barras e prévia do fórum, fórum da comunidade (tópicos, respostas, moderação), catálogo com filtros (categoria, tamanho, ordem, busca, sale), página de peça com grade de cor/tamanho, avaliações com moderação, lista de desejos, sacola, checkout com CEP automático e cupom, página de acompanhamento do pedido, rastreio por número + e-mail, newsletter.

**Painel (`/admin`)** — visão geral com indicadores, pedidos (fila, detalhe, mudança de status, rastreio, impressão, exportação CSV), nova venda de balcão/WhatsApp, produtos com grade e upload de fotos, coleções e categorias, clientes (ficha, histórico, etiquetas), estoque por variação com histórico de movimentações, cupons, avaliações, relatórios e configurações da loja/equipe.

**Backend** — rotas em `app/api/*` e server actions em `app/admin/actions.ts`. As regras críticas ficam no banco (`supabase/migrations/0001_schema.sql`): `place_order` confere preço, estoque, cupom e frete e fecha o pedido numa transação; `set_order_status` devolve peças ao estoque em cancelamentos; RLS limita tudo que é gestão à equipe.

## Colocar no ar

1. Crie um projeto no Supabase e rode `supabase/implantar-banco-completo.sql` no SQL Editor (ou os arquivos de `supabase/migrations/` em ordem). A loja começa vazia: peças, categorias e coleções são cadastradas pelo painel. Num banco que já tinha o catálogo de exemplo, rode `supabase/ajustar-banco-existente.sql` para apagá-lo.
2. Na Vercel, importe este repositório e defina `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (veja `.env.example`).
3. Abra `/login` e crie a primeira conta: ela vira proprietária da loja. Faça isso logo após publicar.

Local: `cp .env.example .env.local`, preencha, `npm install && npm run dev`.

## Limites conhecidos

- Pagamento não passa por gateway: o pedido entra como “aguardando pagamento” (Pix pela chave configurada ou link de cartão enviado pela loja) e a equipe confirma no painel.
- Frete é valor fixo com faixa de frete grátis, sem cálculo por CEP.
- Sem fotos enviadas, as peças usam ilustrações de estúdio em SVG.

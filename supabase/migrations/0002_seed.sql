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

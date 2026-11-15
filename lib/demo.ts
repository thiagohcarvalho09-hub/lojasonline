/* Modo demonstração: enquanto o Supabase não está conectado, a plataforma roda com este
   catálogo de exemplo em memória. Somente leitura — nenhuma alteração é salva. */

export const DEMO_MESSAGE = "Modo demonstração: conecte o Supabase para salvar alterações.";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

// gerador determinístico, para a demonstração ser a mesma a cada carregamento
let seed = 20270;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
const uid = (n: number, k: number) => `${String(k).padStart(8, "0")}-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ago = (days: number) => new Date(Date.now() - days * 864e5).toISOString();

const CATS = ["Alfaiataria", "Vestidos", "Bolsas", "Joias", "Óculos", "Calçados", "Acessórios"];
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

const CATALOG: [string, string, number, number, number | null, number, string, string, string, boolean, number, string, string, string][] = [
  // nome, categoria, coleção, preço, "de", custo, arte, fundo, composição, destaque, desejos, descrição, tamanhos, cores
  ["Blazer de alfaiataria", "Alfaiataria", 0, 2890, null, 980, "blazer", "#c9c5bd", "Lã fria 100% · forro de cupro", true, 142, "Ombro estruturado, lapela de pico e cintura levemente marcada. Cortado em lã fria italiana com forro de cupro.", "PP,P,M,G,GG", "Preto:#0b0b0c,Grafite:#3a3b3f"],
  ["Bolsa estruturada", "Bolsas", 0, 1980, 2290, 720, "bag", "#cfcac0", "Couro bovino liso · ferragens em níquel", true, 96, "Bolsa de mão em couro rígido com aba geométrica e alça arqueada. Interior em suede com bolso para cartões.", "Único", "Preto:#0b0b0c,Marfim:#e8e1d2"],
  ["Óculos de acetato", "Óculos", 0, 780, null, 240, "sunglasses", "#d4cdc0", "Acetato italiano · lentes UV400", true, 78, "Armação espessa em acetato tartaruga com lentes fumê degradê e proteção UV400.", "Único", "Tartaruga:#5b3a22,Preto:#0b0b0c"],
  ["Brinco escultural", "Joias", 1, 1250, null, 380, "earring", "#c3c7cb", "Latão com banho de prata 925", true, 64, "Gota oca de superfície espelhada, moldada à mão. Leve apesar do volume.", "Único", "Prata:#c9ccd1,Ouro:#c9a24b"],
  ["Bracelete líquido", "Joias", 1, 1490, null, 450, "cuff", "#c3c7cb", "Latão com banho de prata 925", true, 51, "Bracelete rígido de formas orgânicas, como metal derretido solidificado no pulso.", "P,M", "Prata:#c9ccd1"],
  ["Anel duplo cromado", "Joias", 1, 690, null, 190, "ring", "#c8cbce", "Latão com banho de prata 925", false, 33, "Dois aros fundidos em um só, polimento espelhado.", "14,16,18,20", "Prata:#c9ccd1"],
  ["Vestido coluna", "Vestidos", 3, 3450, null, 1150, "dress", "#bdb8b3", "Cetim de seda 100%", true, 88, "Vestido longo de corte reto em cetim de seda pesado, alças finas e fenda lateral.", "PP,P,M,G", "Preto:#0b0b0c,Champagne:#d8c7a6"],
  ["Calça pantalona", "Alfaiataria", 2, 1290, null, 420, "trousers", "#d6d0c4", "Lã fria com elastano", false, 47, "Cintura alta, pregas frontais e perna ampla que cai até o chão.", "34,36,38,40,42,44", "Preto:#0b0b0c,Areia:#cbbfa8"],
  ["Camisa de popeline", "Alfaiataria", 2, 890, null, 260, "shirt", "#dcd8cf", "Algodão egípcio 100%", false, 39, "Camisa de modelagem ampla, colarinho firme e punho duplo.", "P,M,G,GG", "Branco:#f4f1ea,Azul:#1546ff"],
  ["Scarpin fio", "Calçados", 3, 1690, 1990, 560, "heel", "#c7c2bb", "Couro verniz · salto 9 cm", false, 58, "Scarpin de bico fino em verniz com salto agulha de 9 cm.", "34,35,36,37,38,39", "Preto:#0b0b0c"],
  ["Sobretudo longo", "Alfaiataria", 0, 4290, null, 1480, "coat", "#c4c0b8", "Lã e cashmere", true, 71, "Sobretudo transpassado até o tornozelo, ombro caído e cinto do mesmo tecido.", "P,M,G", "Preto:#0b0b0c,Camelo:#b08a5b"],
  ["Cinto de fivela oval", "Acessórios", 2, 590, null, 160, "belt", "#d6d0c4", "Couro bovino · fivela niquelada", false, 22, "Cinto de 3 cm com fivela oval polida.", "80,90,100", "Preto:#0b0b0c"],
  ["Lenço de seda", "Acessórios", 2, 480, null, 130, "scarf", "#d9d3c6", "Seda pura 90 × 90", false, 27, "Carré de seda com bainha feita à mão.", "Único", "Azul:#1546ff,Lima:#dcf24e,Preto:#0b0b0c"],
  ["Saia lápis de couro", "Alfaiataria", 0, 2190, null, 760, "skirt", "#cbc6bd", "Couro de cordeiro", false, 44, "Saia midi em couro macio com fenda traseira e zíper invisível.", "34,36,38,40,42", "Preto:#0b0b0c"],
  ["Tricot canelado", "Alfaiataria", 2, 1090, null, 340, "knit", "#d8d3c8", "Lã merino extrafina", false, 35, "Suéter de gola alta em ponto canelado, ajustado ao corpo.", "P,M,G", "Marfim:#e8e1d2,Preto:#0b0b0c"],
  ["Bota cano alto", "Calçados", 0, 2590, null, 880, "boot", "#c5c0b8", "Couro bovino · salto bloco 6 cm", false, 62, "Bota de cano reto até o joelho, bico quadrado e salto bloco.", "35,36,37,38,39", "Preto:#0b0b0c"],
] as never;

function build() {
  const settings = {
    id: 1, name: "ATELIER", tagline: "Moda & Acessórios", season: "SS27", hero_title: "Nova coleção",
    hero_subtitle: "Peças que definem a temporada.", shipping_flat: 29.9, free_shipping_over: 900, low_stock_threshold: 5,
    announcement: "Frete grátis acima de R$ 900 · Troca fácil em 30 dias · Nova coleção no ar",
    pix_key: "", whatsapp: "", contact_email: "", instagram: "",
  };
  const categories = CATS.map((name, i) => ({ id: uid(i + 1, 1), name, slug: slug(name), position: i + 1 }));
  const collections = [
    ["Nova Coleção", "Alfaiataria de ombro marcado, couro estruturado e metal líquido. Peças que definem a temporada.", "SS27", "#c9c5bd", true],
    ["Metal Líquido", "Joias esculturais em banho de prata com acabamento espelhado.", "SS27", "#bfc4c9", true],
    ["Essenciais", "O guarda-roupa permanente: cortes limpos, tecidos nobres, zero excesso.", "Permanente", "#d6d0c4", false],
    ["Noite", "Cetim, brilho contido e silhuetas longas para depois das oito.", "FW26", "#b9b4b0", false],
  ].map(([name, description, season, tone, is_featured], i) => ({
    id: uid(i + 1, 2), name, slug: slug(name as string), description, season, tone, is_featured, is_active: true, image_url: null, position: i + 1, created_at: ago(90),
  }));

  const variants: Row[] = [];
  const products: Row[] = CATALOG.map((c, i) => {
    const [name, cat, col, price, compare, cost, art, tone, material, featured, wish, description, sizes, colors] = c as unknown as [string, string, number, number, number | null, number, string, string, string, boolean, number, string, string, string];
    const category = categories.find((x) => x.name === cat)!;
    const collection = collections[col];
    const sku = `ATL-${art.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`;
    const p: Row = {
      id: uid(i + 1, 3), name, slug: slug(name), description, price, compare_at_price: compare, cost, sku, images: [], art, tone, material,
      care: "Lavagem a seco", tags: [], status: "active", is_featured: featured, wish_count: wish, created_at: ago((i + 1) * 3),
      category_id: category.id, collection_id: collection.id,
      categories: { name: category.name, slug: category.slug },
      collections: { name: collection.name, slug: collection.slug, season: collection.season },
      product_variants: [],
    };
    for (const size of sizes.split(",")) for (const color of colors.split(",")) {
      const [cname, hex] = color.split(":");
      const v: Row = {
        id: uid(variants.length + 1, 4), product_id: p.id, size, color: cname, color_hex: hex, price_override: null,
        sku: `${sku}-${cname.slice(0, 2).toUpperCase()}-${size}`, stock: Math.floor(rnd() * 19),
        products: { id: p.id, name, art, tone, images: [], price, cost },
      };
      variants.push(v); p.product_variants.push(v);
    }
    return p;
  });

  const customers: Row[] = Array.from({ length: 24 }, (_, i) => ({
    id: uid(i + 1, 5), name: `Cliente ${String(i + 1).padStart(2, "0")}`, email: `cliente${String(i + 1).padStart(2, "0")}@exemplo.com`,
    phone: `(11) 9${String(Math.floor(rnd() * 1e8)).padStart(8, "0")}`, cpf: "", notes: "", tags: (i + 1) % 5 === 0 ? ["VIP"] : [],
    address: { cep: "01310-100", street: "Av. Paulista", number: String(100 + i * 37), district: "Bela Vista", city: "São Paulo", state: "SP" },
    created_at: ago(70 - i),
  }));

  const weighted = products.flatMap((p) => Array(Math.ceil(p.wish_count / 12)).fill(p)) as Row[];
  const orders: Row[] = Array.from({ length: 96 }, (_, i) => {
    const age = Math.pow(rnd(), 1.35) * 60;
    const customer = customers[Math.floor(Math.pow(rnd(), 1.6) * customers.length)];
    const r = rnd();
    const channel = r < 0.58 ? "online" : r < 0.9 ? "store" : "whatsapp";
    let status = age < 1 ? pick(["pending", "paid", "paid", "processing"]) : age < 4 ? pick(["paid", "processing", "shipped", "shipped"])
      : rnd() < 0.05 ? "cancelled" : rnd() < 0.03 ? "refunded" : "delivered";
    if (channel === "store" && ["pending", "processing", "shipped"].includes(status)) status = "delivered";
    const id = uid(i + 1, 6);
    const n = 1 + Math.floor(Math.pow(rnd(), 2.2) * 3);
    const items = Array.from({ length: n }, (_, k) => {
      const p = pick(weighted); const v = pick(p.product_variants as Row[]);
      return { id: uid(i * 4 + k + 1, 7), order_id: id, product_id: p.id, variant_id: v.id, name: p.name, variant_label: `${v.size} · ${v.color}`,
        unit_price: p.price, quantity: 1, total: p.price, products: { art: p.art, tone: p.tone, images: p.images, slug: p.slug, category: p.categories.name } };
    });
    const subtotal = items.reduce((a, x) => a + x.total, 0);
    const shipping = channel === "store" || subtotal >= 900 ? 0 : 29.9;
    const created_at = ago(age);
    return {
      id, number: 0, public_token: uid(i + 1, 8), customer_id: customer.id, status, channel,
      payment_method: channel === "store" && rnd() < 0.3 ? "cash" : rnd() < 0.55 ? "pix" : "card",
      subtotal, discount: 0, shipping, total: subtotal + shipping, coupon_code: null, shipping_address: customer.address,
      tracking_code: ["shipped", "delivered"].includes(status) && channel !== "store" ? `BR${String(Math.floor(rnd() * 1e9)).padStart(9, "0")}SP` : null,
      notes: "", paid_at: status === "pending" ? null : created_at, created_at,
      customers: customer, order_items: items,
      order_events: [
        { id: uid(i * 2 + 1, 9), status: "pending", message: "Pedido recebido.", created_at },
        ...(status === "pending" ? [] : [{ id: uid(i * 2 + 2, 9), status, message: "Pagamento confirmado.", created_at }]),
      ],
    };
  }).sort((a, b) => a.created_at.localeCompare(b.created_at));
  orders.forEach((o, i) => { o.number = 10333 + i; });

  const ok = ["paid", "processing", "shipped", "delivered"];
  const customer_stats = customers.map((c) => {
    const mine = orders.filter((o) => o.customer_id === c.id);
    const valid = mine.filter((o) => ok.includes(o.status));
    return { ...c, orders_count: valid.length, total_spent: valid.reduce((a, o) => a + o.total, 0), last_order_at: mine.at(-1)?.created_at ?? null };
  });

  const QUOTES = ["Caimento impecável, o tecido é ainda melhor ao vivo.", "Chegou em dois dias, embalagem linda. Veste um pouco maior.", "Peça de acabamento perfeito. Já quero em outra cor."];
  const reviews = products.filter((p) => p.is_featured).flatMap((p, i) => QUOTES.map((comment, k) => ({
    id: uid(i * 3 + k + 1, 10), product_id: p.id, author: `Cliente 0${k + 1}`, rating: 5 - (k % 2), comment, approved: k < 2,
    created_at: ago(i * 2 + k + 1), products: { id: p.id, name: p.name },
  })));
  const coupons = [
    { code: "BEMVINDA10", type: "percent", value: 10, min_subtotal: 0, max_uses: null, used_count: 37 },
    { code: "ATELIER200", type: "fixed", value: 200, min_subtotal: 1500, max_uses: 100, used_count: 12 },
    { code: "FRETEGRATIS", type: "free_shipping", value: 0, min_subtotal: 300, max_uses: null, used_count: 58 },
  ].map((c, i) => ({ ...c, id: uid(i + 1, 11), ends_at: null, is_active: true, created_at: ago(40 - i) }));
  const inventory_movements = orders.slice(-14).reverse().map((o, i) => {
    const v = variants.find((x) => x.id === o.order_items[0].variant_id)!;
    return { id: uid(i + 1, 12), variant_id: v.id, delta: i % 5 === 3 ? 6 : -1, reason: i % 5 === 3 ? "restock" : "sale", note: i % 5 === 3 ? "Reposição do ateliê" : `Pedido #${o.number}`,
      order_id: o.id, created_at: o.created_at, product_variants: { size: v.size, color: v.color, products: { name: v.products.name } } };
  });
  const profiles = [{ id: DEMO_USER.id, full_name: "Ana Costa", email: DEMO_USER.email, role: "owner", created_at: ago(120) }];

  return {
    store_settings: [settings], categories, collections, products, product_variants: variants, customers, customer_stats, orders,
    order_items: orders.flatMap((o) => o.order_items), order_events: orders.flatMap((o) => o.order_events),
    reviews, coupons, inventory_movements, profiles, newsletter_subscribers: Array.from({ length: 214 }, (_, i) => ({ email: `a${i}@exemplo.com` })),
  } as Record<string, Row[]>;
}

export const DEMO_USER = { id: "00000000-0000-4000-8000-00000000d0a0", email: "ana@atelier.demo" };

let cache: { at: number; db: Record<string, Row[]> } | null = null;
const db = () => {
  // refeito a cada hora para as datas continuarem recentes
  if (!cache || Date.now() - cache.at > 36e5) { seed = 20270; cache = { at: Date.now(), db: build() }; }
  return cache.db;
};

const get = (row: Row, path: string) => path.split(".").reduce((v, k) => (v == null ? v : v[k]), row as any); // eslint-disable-line @typescript-eslint/no-explicit-any
const like = (value: unknown, pattern: string) => String(value ?? "").toLowerCase().includes(pattern.replace(/%/g, "").toLowerCase());

/** Imita a parte do construtor de consultas do Supabase que a plataforma usa. */
class Query {
  private rows: Row[];
  private one = false;
  private head = false;
  private counted = false;
  private write = false;
  constructor(table: string) { this.rows = [...(db()[table] ?? [])]; }
  private keep(test: (r: Row) => boolean) { this.rows = this.rows.filter(test); return this; }
  select(_cols?: string, opts?: { count?: string; head?: boolean }) { this.counted = Boolean(opts?.count); this.head = Boolean(opts?.head); return this; }
  eq(k: string, v: unknown) { return this.keep((r) => get(r, k) == v); }
  neq(k: string, v: unknown) { return this.keep((r) => get(r, k) != v); }
  lte(k: string, v: number) { return this.keep((r) => Number(get(r, k)) <= v); }
  in(k: string, list: unknown[]) { return this.keep((r) => list.includes(get(r, k))); }
  ilike(k: string, p: string) { return this.keep((r) => like(get(r, k), p)); }
  not(k: string) { return this.keep((r) => get(r, k) != null); }
  or(expr: string) {
    const tests = expr.split(",").map((part) => { const [k, op, ...rest] = part.split("."); return { k, op, v: rest.join(".") }; });
    return this.keep((r) => tests.some((t) => (t.op === "ilike" ? like(r[t.k], t.v) : String(r[t.k]) === t.v)));
  }
  order(k: string, opts?: { ascending?: boolean }) {
    const dir = opts?.ascending === false ? -1 : 1;
    this.rows.sort((a, b) => { const x = get(a, k), y = get(b, k); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
    return this;
  }
  limit(n: number) { this.rows = this.rows.slice(0, n); return this; }
  maybeSingle() { this.one = true; return this; }
  single() { this.one = true; return this; }
  insert() { this.write = true; return this; }
  update() { this.write = true; return this; }
  delete() { this.write = true; return this; }
  then<A, B>(done: (v: { data: any; error: any; count: number | null }) => A, fail?: (e: unknown) => B) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const result = this.write ? { data: null, error: { message: DEMO_MESSAGE, code: "demo" }, count: null }
      : { data: this.head ? null : this.one ? this.rows[0] ?? null : this.rows, error: null, count: this.counted ? this.rows.length : null };
    return Promise.resolve(result).then(done, fail);
  }
}

const VALID = ["paid", "processing", "shipped", "delivered"];

function stats(from: string, to: string) {
  const d = db();
  const span = new Date(to).getTime() - new Date(from).getTime();
  const prevFrom = new Date(new Date(from).getTime() - span).toISOString();
  const valid = d.orders.filter((o) => VALID.includes(o.status));
  const cur = valid.filter((o) => o.created_at >= from && o.created_at < to);
  const prev = valid.filter((o) => o.created_at >= prevFrom && o.created_at < from);
  const sum = (list: Row[], k = "total") => list.reduce((a, r) => a + Number(r[k]), 0);
  const group = <T extends Row>(list: Row[], key: (r: Row) => string, make: (k: string, rows: Row[]) => T) => {
    const m = new Map<string, Row[]>();
    list.forEach((r) => m.set(key(r), [...(m.get(key(r)) ?? []), r]));
    return [...m].map(([k, rows]) => make(k, rows));
  };
  const items = cur.flatMap((o) => o.order_items as Row[]);
  const buyers = [...new Set(cur.map((o) => o.customer_id))];
  return {
    revenue: sum(cur), orders: cur.length, prev_revenue: sum(prev), prev_orders: prev.length, units: sum(items, "quantity"), discounts: 0,
    buyers: buyers.length, recurring: buyers.filter((id) => valid.filter((o) => o.customer_id === id).length > 1).length,
    pending: d.orders.filter((o) => o.status === "pending").length, to_ship: d.orders.filter((o) => ["paid", "processing"].includes(o.status)).length,
    channels: group(cur, (o) => o.channel, (channel, r) => ({ channel, total: sum(r), count: r.length })),
    payments: group(cur, (o) => o.payment_method, (method, r) => ({ method, total: sum(r), count: r.length })),
    statuses: group(d.orders.filter((o) => o.created_at >= from && o.created_at < to), (o) => o.status, (status, r) => ({ status, count: r.length })),
    daily: group(cur, (o) => new Date(new Date(o.created_at).getTime() - 3 * 36e5).toISOString().slice(0, 10), (day, r) => ({ day, total: sum(r), count: r.length })).sort((a, b) => a.day.localeCompare(b.day)),
    categories: group(items, (i) => i.products.category, (category, r) => ({ category, total: sum(r), units: sum(r, "quantity") })).sort((a, b) => b.total - a.total),
    top_products: group(items, (i) => i.product_id, (product_id, r) => ({ product_id, name: r[0].name, slug: r[0].products.slug, art: r[0].products.art, tone: r[0].products.tone, image: null, units: sum(r, "quantity"), revenue: sum(r) }))
      .sort((a, b) => b.units - a.units).slice(0, 8),
  };
}

function orderPublic(a: { p_token?: string; p_number?: number; p_email?: string }) {
  const o = db().orders.find((x) => (a.p_token ? x.public_token === a.p_token : x.number === a.p_number && x.customers.email === String(a.p_email ?? "").trim().toLowerCase()));
  if (!o) return null;
  return {
    number: o.number, token: o.public_token, status: o.status, channel: o.channel, payment_method: o.payment_method, subtotal: o.subtotal,
    discount: o.discount, shipping: o.shipping, total: o.total, coupon_code: o.coupon_code, tracking_code: o.tracking_code, created_at: o.created_at,
    address: o.shipping_address, customer_name: o.customers.name, events: o.order_events,
    items: (o.order_items as Row[]).map((i) => ({ name: i.name, label: i.variant_label, quantity: i.quantity, unit_price: i.unit_price, total: i.total, art: i.products.art, tone: i.products.tone, image: null })),
  };
}

function coupon(code: string, subtotal: number) {
  const c = db().coupons.find((x) => x.code === String(code).trim().toUpperCase());
  if (!c) return { valid: false, message: "Cupom inválido." };
  if (subtotal < c.min_subtotal) return { valid: false, message: `Pedido mínimo de R$ ${c.min_subtotal},00 para este cupom.` };
  return { valid: true, code: c.code, type: c.type, free_shipping: c.type === "free_shipping", message: "Cupom aplicado.",
    discount: c.type === "percent" ? Math.round(subtotal * c.value) / 100 : c.type === "fixed" ? Math.min(c.value, subtotal) : 0 };
}

export function createDemoClient() {
  const refuse = async () => ({ data: { user: null, session: null }, error: { message: DEMO_MESSAGE } });
  return {
    from: (table: string) => new Query(table),
    async rpc(name: string, args: Row = {}) {
      if (name === "dashboard_stats") return { data: stats(args.p_from, args.p_to), error: null };
      if (name === "order_public") return { data: orderPublic(args), error: null };
      if (name === "validate_coupon") return { data: coupon(args.p_code, Number(args.p_subtotal)), error: null };
      if (name === "bump_wish") return { data: null, error: null };
      return { data: null, error: { message: DEMO_MESSAGE } };
    },
    auth: {
      getUser: async () => ({ data: { user: DEMO_USER }, error: null }),
      signInWithPassword: refuse, signUp: refuse, signOut: async () => ({ error: null }),
    },
  };
}

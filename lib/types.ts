export type Variant = {
  id: string; product_id: string; size: string; color: string; color_hex: string;
  sku: string | null; stock: number; price_override: number | null;
};
export type Product = {
  id: string; name: string; slug: string; description: string; price: number;
  compare_at_price: number | null; sku: string | null; images: string[];
  art: string; tone: string; material: string; care: string; tags: string[]; status: string;
  is_featured: boolean; wish_count: number; created_at: string;
  category_id: string | null; collection_id: string | null;
  categories?: { name: string; slug: string } | null;
  collections?: { name: string; slug: string; season: string } | null;
  product_variants?: Variant[];
  /** Custo da peça: tabela restrita à equipe, só vem nas consultas do painel. */
  product_costs?: { cost: number } | null;
};
export type Collection = {
  id: string; name: string; slug: string; description: string; season: string;
  image_url: string | null; tone: string; is_active: boolean; is_featured: boolean; position: number;
};
export type Settings = {
  name: string; tagline: string; announcement: string; hero_title: string; hero_subtitle: string;
  season: string; shipping_flat: number; free_shipping_over: number; low_stock_threshold: number;
  pix_key: string; whatsapp: string; contact_email: string; instagram: string;
};
export type CartLine = {
  variantId: string; productId: string; slug: string; name: string; label: string;
  price: number; qty: number; max: number; art: string; tone: string; image: string | null;
};

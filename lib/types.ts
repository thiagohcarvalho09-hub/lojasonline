export type Variant = {
  id: string; product_id: string; size: string; color: string; color_hex: string;
  sku: string | null; stock: number; price_override: number | null;
  /** Disponível para venda (ex.: o fornecedor ainda tem este tamanho). Indisponível some da vitrine. */
  available: boolean;
};
export type Product = {
  id: string; name: string; slug: string; description: string; price: number;
  compare_at_price: number | null; sku: string | null; images: string[];
  art: string; tone: string; material: string; care: string; tags: string[]; status: string;
  is_featured: boolean; wish_count: number; created_at: string;
  /** Modelo de venda: estoque próprio, dropshipping ou sob encomenda. */
  fulfillment: "stock" | "dropship" | "preorder"; lead_time_days: number;
  category_id: string | null; collection_id: string | null;
  categories?: { name: string; slug: string } | null;
  collections?: { name: string; slug: string; season: string } | null;
  product_variants?: Variant[];
  /** Custo da peça: tabela restrita à equipe, só vem nas consultas do painel. */
  product_costs?: { cost: number } | null;
  /** Fornecedor (dropshipping/encomenda): tabela restrita à equipe, só vem nas consultas do painel. */
  product_suppliers?: ProductSupplier | null;
  /** Variações com o código do fornecedor; só vem nas consultas do painel. */
  admin_variants?: { id: string; variant_suppliers: VariantSupplier | null }[];
};
export type ProductSupplier = { supplier_id: string | null; supplier_name: string; supplier_url: string; supplier_sku: string; notes: string };
/** Código do fornecedor por tamanho/cor. Só a equipe lê. */
export type VariantSupplier = { supplier_sku: string };
export type Supplier = {
  id: string; name: string; contact_name: string; email: string; whatsapp: string; website: string;
  lead_time_days: number; return_policy: string; notes: string; is_active: boolean; created_at: string;
};
export type SupplierOrderStatus = "to_order" | "ordered" | "shipped" | "delivered" | "cancelled";
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

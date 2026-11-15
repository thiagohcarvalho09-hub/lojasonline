import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Collection, Product, Settings } from "@/lib/types";

export const PRODUCT_SELECT =
  "*, categories(name, slug), collections(name, slug, season), product_variants(id, product_id, size, color, color_hex, sku, stock, price_override)";

/** Só para o painel: inclui o custo, que o banco entrega apenas à equipe. */
export const ADMIN_PRODUCT_SELECT = `${PRODUCT_SELECT}, product_costs(cost)`;

const DEFAULTS: Settings = {
  name: "ATELIER", tagline: "Moda & Acessórios", announcement: "", hero_title: "Nova coleção",
  hero_subtitle: "Peças que definem a temporada.", season: "SS27", shipping_flat: 29.9, free_shipping_over: 900,
  low_stock_threshold: 5, pix_key: "", whatsapp: "", contact_email: "", instagram: "",
};

export const getSettings = cache(async (): Promise<Settings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  return data ? { ...DEFAULTS, ...data, shipping_flat: Number(data.shipping_flat), free_shipping_over: Number(data.free_shipping_over) } : DEFAULTS;
});

export const getCategories = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, slug").order("position");
  return data ?? [];
});

export const getCollections = cache(async (): Promise<Collection[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("collections").select("*").eq("is_active", true).order("position");
  return (data ?? []) as Collection[];
});

export type CatalogFilters = { q?: string; categoria?: string; colecao?: string; tamanho?: string; ordem?: string; max?: string; promo?: string };

export async function getCatalog(f: CatalogFilters = {}, limit = 60): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT.replace("categories(", f.categoria ? "categories!inner(" : "categories(").replace("collections(", f.colecao ? "collections!inner(" : "collections("))
    .eq("status", "active")
    .limit(limit);
  if (f.categoria) query = query.eq("categories.slug", f.categoria);
  if (f.colecao) query = query.eq("collections.slug", f.colecao);
  if (f.q) query = query.ilike("name", `%${f.q.replace(/[%_,()]/g, " ").trim()}%`);
  if (f.max && Number(f.max) > 0) query = query.lte("price", Number(f.max));
  if (f.promo) query = query.not("compare_at_price", "is", null);
  if (f.ordem === "menor") query = query.order("price");
  else if (f.ordem === "maior") query = query.order("price", { ascending: false });
  else if (f.ordem === "desejados") query = query.order("wish_count", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data } = await query;
  let list = (data ?? []) as unknown as Product[];
  if (f.tamanho) list = list.filter((p) => p.product_variants?.some((v) => v.size === f.tamanho && v.stock > 0));
  return list;
}

export const stockOf = (p: Product) => (p.product_variants ?? []).reduce((a, v) => a + v.stock, 0);
export const isNew = (p: Product) => Date.now() - new Date(p.created_at).getTime() < 14 * 864e5;

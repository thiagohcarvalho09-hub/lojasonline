"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import type { ActionState } from "@/components/admin/action-form";

// Todas as ações rodam com a sessão de quem está logado: o RLS do banco garante que só a equipe grava.

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const money = (fd: FormData, k: string) => {
  const raw = str(fd, k).replace(/\s|R\$/g, "");
  if (!raw) return null;
  const n = Number(raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw);
  return Number.isFinite(n) ? n : null;
};
const fail = (message: string): ActionState => ({
  error: message.includes("duplicate key") ? "Já existe um registro com esse identificador." : message.includes("row-level security") ? "Você não tem permissão para isso." : message,
});

export async function saveProduct(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const id = str(fd, "id");
  const name = str(fd, "name");
  const price = money(fd, "price");
  if (name.length < 2) return { error: "Dê um nome à peça." };
  if (price === null || price < 0) return { error: "Informe um preço válido." };
  const cost = money(fd, "cost");
  if (cost !== null && cost < 0) return { error: "Informe um custo válido." };
  let variants: { id?: string; size: string; color: string; color_hex: string; sku: string; stock: number }[] = [];
  let images: string[] = [];
  try { variants = JSON.parse(str(fd, "variants") || "[]"); images = JSON.parse(str(fd, "images") || "[]"); } catch { return { error: "Variações inválidas." }; }
  if (!variants.length) return { error: "Cadastre ao menos uma variação (tamanho/cor)." };

  const row = {
    name, slug: slugify(str(fd, "slug") || name), description: str(fd, "description"), price,
    compare_at_price: money(fd, "compare_at_price"), sku: str(fd, "sku") || null,
    category_id: str(fd, "category_id") || null, collection_id: str(fd, "collection_id") || null,
    art: str(fd, "art") || "blazer", tone: str(fd, "tone") || "#cfcac0", material: str(fd, "material"), care: str(fd, "care"),
    status: str(fd, "status") || "active", is_featured: fd.get("is_featured") === "on", images,
    tags: str(fd, "tags").split(",").map((t) => t.trim()).filter(Boolean),
  };
  const saved = id
    ? await supabase.from("products").update(row).eq("id", id).select("id").single()
    : await supabase.from("products").insert(row).select("id").single();
  if (saved.error) return fail(saved.error.message);
  const productId = saved.data.id;

  // O custo fica numa tabela só da equipe, fora da leitura pública de products.
  const costSaved = cost === null
    ? await supabase.from("product_costs").delete().eq("product_id", productId)
    : await supabase.from("product_costs").upsert({ product_id: productId, cost, updated_at: new Date().toISOString() });
  if (costSaved.error) return fail(costSaved.error.message);

  // Variações: o estoque de variações existentes só muda pela tela de Estoque (com histórico).
  const { data: current } = await supabase.from("product_variants").select("id").eq("product_id", productId);
  const keep = new Set(variants.filter((v) => v.id).map((v) => v.id));
  const gone = (current ?? []).filter((v) => !keep.has(v.id)).map((v) => v.id);
  if (gone.length) await supabase.from("product_variants").delete().in("id", gone);
  for (const v of variants) {
    const base = { size: v.size || "Único", color: v.color || "Preto", color_hex: v.color_hex || "#0b0b0c", sku: v.sku || null };
    const res = v.id
      ? await supabase.from("product_variants").update(base).eq("id", v.id)
      : await supabase.from("product_variants").insert({ ...base, product_id: productId, stock: Math.max(0, Math.round(Number(v.stock) || 0)) }).select("id, stock").single();
    if (res.error) return fail(res.error.message);
    if (!v.id && res.data && res.data.stock > 0) {
      await supabase.from("inventory_movements").insert({ variant_id: res.data.id, delta: res.data.stock, reason: "restock", note: "Estoque inicial" });
    }
  }
  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/produtos/${productId}?salvo=1`);
  return { ok: "Peça salva." };
}

export async function deleteProduct(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", str(fd, "id"));
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  redirect("/admin/produtos");
}

export async function saveCollection(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (name.length < 2) return { error: "Dê um nome à coleção." };
  const row = {
    name, slug: slugify(str(fd, "slug") || name), description: str(fd, "description"), season: str(fd, "season"),
    tone: str(fd, "tone") || "#cfcac0", image_url: str(fd, "image_url") || null,
    is_active: fd.get("is_active") === "on", is_featured: fd.get("is_featured") === "on", position: Number(str(fd, "position")) || 0,
  };
  const { error } = id ? await supabase.from("collections").update(row).eq("id", id) : await supabase.from("collections").insert(row);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: "Coleção salva." };
}

export async function deleteCollection(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("collections").delete().eq("id", str(fd, "id"));
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: "Coleção removida." };
}

export async function saveCategory(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const name = str(fd, "name");
  if (name.length < 2) return { error: "Dê um nome à categoria." };
  const { error } = await supabase.from("categories").insert({ name, slug: slugify(name), position: Number(str(fd, "position")) || 99 });
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: "Categoria criada." };
}

export async function deleteCategory(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", str(fd, "id"));
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return null;
}

export async function updateOrderStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_order_status", {
    p_order: str(fd, "id"), p_status: str(fd, "status"), p_tracking: str(fd, "tracking") || null, p_note: str(fd, "note") || null,
  });
  if (error) return fail(error.message);
  revalidatePath("/admin", "layout");
  return { ok: "Pedido atualizado." };
}

export async function saveOrderNotes(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ notes: str(fd, "notes") }).eq("id", str(fd, "id"));
  if (error) return fail(error.message);
  revalidatePath("/admin/pedidos", "layout");
  return { ok: "Observações salvas." };
}

export async function adjustStock(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const qty = Math.round(Number(str(fd, "qty")));
  const mode = str(fd, "mode");
  if (!qty || qty < 0) return { error: "Informe a quantidade." };
  const { error } = await supabase.rpc("adjust_stock", {
    p_variant: str(fd, "variant"), p_delta: mode === "out" ? -qty : qty,
    p_reason: mode === "in" ? "restock" : "adjustment", p_note: str(fd, "note"),
  });
  if (error) return fail(error.message);
  revalidatePath("/admin", "layout");
  return { ok: mode === "out" ? `Baixa de ${qty} un. registrada.` : `Entrada de ${qty} un. registrada.` };
}

export async function saveCoupon(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const code = str(fd, "code").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 3) return { error: "O código precisa de ao menos 3 letras ou números." };
  const type = str(fd, "type");
  const { error } = await supabase.from("coupons").insert({
    code, type, value: type === "free_shipping" ? 0 : money(fd, "value") ?? 0, min_subtotal: money(fd, "min_subtotal") ?? 0,
    max_uses: Number(str(fd, "max_uses")) || null, ends_at: str(fd, "ends_at") ? new Date(str(fd, "ends_at") + "T23:59:59-03:00").toISOString() : null,
  });
  if (error) return fail(error.message);
  revalidatePath("/admin/cupons");
  return { ok: `Cupom ${code} criado.` };
}

export async function toggleCoupon(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = fd.get("delete")
    ? await supabase.from("coupons").delete().eq("id", str(fd, "id"))
    : await supabase.from("coupons").update({ is_active: str(fd, "active") === "true" }).eq("id", str(fd, "id"));
  if (error) return fail(error.message);
  revalidatePath("/admin/cupons");
  return null;
}

export async function moderateReview(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = str(fd, "op") === "delete"
    ? await supabase.from("reviews").delete().eq("id", str(fd, "id"))
    : await supabase.from("reviews").update({ approved: str(fd, "op") === "approve" }).eq("id", str(fd, "id"));
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return null;
}

export async function saveCustomer(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").update({
    name: str(fd, "name"), phone: str(fd, "phone"), notes: str(fd, "notes"),
    tags: str(fd, "tags").split(",").map((t) => t.trim()).filter(Boolean),
  }).eq("id", str(fd, "id"));
  if (error) return fail(error.message);
  revalidatePath("/admin/clientes", "layout");
  return { ok: "Cliente atualizado." };
}

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("store_settings").update({
    name: str(fd, "name") || "ATELIER", tagline: str(fd, "tagline"), announcement: str(fd, "announcement"),
    hero_title: str(fd, "hero_title"), hero_subtitle: str(fd, "hero_subtitle"), season: str(fd, "season"),
    shipping_flat: money(fd, "shipping_flat") ?? 0, free_shipping_over: money(fd, "free_shipping_over") ?? 0,
    low_stock_threshold: Math.max(0, Number(str(fd, "low_stock_threshold")) || 0),
    pix_key: str(fd, "pix_key"), whatsapp: str(fd, "whatsapp"), contact_email: str(fd, "contact_email"), instagram: str(fd, "instagram"),
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: "Configurações salvas." };
}

export async function setRole(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const role = str(fd, "role");
  if (!["staff", "customer"].includes(role)) return { error: "Papel inválido." };
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", str(fd, "id")).neq("role", "owner").select("id");
  if (error) return fail(error.message);
  if (!data?.length) return { error: "Somente a proprietária pode alterar a equipe." };
  revalidatePath("/admin/configuracoes");
  return null;
}

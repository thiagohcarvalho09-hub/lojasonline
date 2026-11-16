import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { PageHead, Tabs } from "@/components/admin/bits";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Empty } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { brl, dateShort, STATUS } from "@/lib/format";
import { SUPPLIER_STATUS } from "@/lib/fulfillment";
import type { SupplierOrderStatus } from "@/lib/types";
import { setVariantAvailable, updateSupplierOrder } from "../actions";

export const metadata: Metadata = { title: "Pedidos ao fornecedor" };

type Address = { street?: string; number?: string; complement?: string; district?: string; city?: string; state?: string; cep?: string };
type Row = {
  id: string; status: SupplierOrderStatus; supplier_name: string; cost: number | null; supplier_ref: string; tracking_code: string; notes: string; created_at: string;
  suppliers: { whatsapp: string; email: string; website: string; lead_time_days: number } | null;
  orders: { id: string; number: number; status: string; shipping_address: Address | null; customers: { name: string; phone: string; email: string } | null } | null;
  supplier_order_items: { name: string; variant_label: string; quantity: number; supplier_sku: string;
    order_items: { variant_id: string | null; product_variants: { available: boolean } | null; products: { product_suppliers: { supplier_url: string } | null } | null } | null }[];
};

const TABS: SupplierOrderStatus[] = ["to_order", "ordered", "shipped", "delivered", "cancelled"];
const addressLine = (a: Address | null) => !a ? "" :
  [[a.street, a.number].filter(Boolean).join(", "), a.complement, a.district, [a.city, a.state].filter(Boolean).join("/"), a.cep && `CEP ${a.cep}`].filter(Boolean).join(" · ");

/** Texto pronto para mandar ao fornecedor (WhatsApp ou e-mail): itens, códigos e endereço de entrega do cliente. */
function supplierMessage(r: Row) {
  const c = r.orders?.customers;
  return [
    `Pedido ${r.orders ? `#${r.orders.number}` : ""} — ${r.supplier_name}`,
    ...r.supplier_order_items.map((i) => `• ${i.quantity}× ${i.name}${i.variant_label ? ` (${i.variant_label})` : ""}${i.supplier_sku ? ` — cód. ${i.supplier_sku}` : ""}`),
    "",
    "Enviar para:",
    c?.name ?? "",
    addressLine(r.orders?.shipping_address ?? null),
    c?.phone ? `Tel.: ${c.phone}` : "",
  ].filter((l, k, all) => l !== "" || all[k - 1] !== "").join("\n").trim();
}

export default async function Compras({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const current = (TABS.includes(sp.status as SupplierOrderStatus) ? sp.status : "to_order") as SupplierOrderStatus;
  const supabase = await createClient();
  const [{ data }, { data: all }] = await Promise.all([
    supabase.from("supplier_orders")
      .select("*, suppliers(whatsapp, email, website, lead_time_days), orders(id, number, status, shipping_address, customers(name, phone, email)), supplier_order_items(name, variant_label, quantity, supplier_sku, order_items(variant_id, product_variants(available), products(product_suppliers(supplier_url))))")
      .eq("status", current).order("created_at", { ascending: current !== "delivered" && current !== "cancelled" }).limit(100),
    supabase.from("supplier_orders").select("status"),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const count = (s: string) => (all ?? []).filter((r) => r.status === s).length;

  return (
    <>
      <PageHead eyebrow="Fornecedores / pedidos a fazer" title="A pedir.">
        <Link href="/admin/fornecedores" className="btn btn-ghost h-11">Fornecedores</Link>
      </PageHead>
      <p className="mb-4 max-w-3xl text-sm text-ink/70">
        Quando um pedido com peças de dropshipping ou sob encomenda é pago, a loja cria aqui um pedido para cada fornecedor.
        Faça o pedido no fornecedor, registre o número e o custo, e depois o rastreio — cada fornecedor tem o seu.
      </p>
      <Tabs current={current} items={TABS.map((s) => ({ key: s, label: SUPPLIER_STATUS[s], count: count(s), href: `/admin/compras?status=${s}` }))} />

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {rows.map((r) => {
          const msg = supplierMessage(r);
          const wa = r.suppliers?.whatsapp?.replace(/\D/g, "");
          const links = [...new Set(r.supplier_order_items.map((i) => i.order_items?.products?.product_suppliers?.supplier_url).filter((u): u is string => !!u && /^https?:\/\//.test(u)))];
          return (
            <article key={r.id} className="glass bevel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="display text-2xl">{r.supplier_name || "Sem fornecedor"}</h2>
                  <p className="text-sm text-ink/70">
                    {r.orders && <Link href={`/admin/pedidos/${r.orders.id}`} className="font-bold underline">Pedido #{r.orders.number}</Link>}
                    {" · "}{dateShort(r.created_at)}
                    {r.orders && <> · cliente: <span className={`badge badge-${STATUS[r.orders.status]?.tone ?? "stone"}`}>{STATUS[r.orders.status]?.label ?? r.orders.status}</span></>}
                  </p>
                </div>
                {r.cost !== null && <p className="tnum text-right"><span className="block text-xs text-ink/60">Custo</span><b>{brl(r.cost)}</b></p>}
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {r.supplier_order_items.map((i, k) => (
                  <li key={k} className="flex justify-between gap-3 border-b border-ink/10 pb-1">
                    <span><b>{i.quantity}×</b> {i.name} <span className="text-ink/60">{i.variant_label}</span></span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-xs">{i.supplier_sku || <span className="text-rouge">sem código</span>}</span>
                      {i.order_items?.variant_id && (
                        <ActionForm action={setVariantAvailable}>
                          <input type="hidden" name="variant_id" value={i.order_items.variant_id} />
                          <input type="hidden" name="available" value={String(i.order_items.product_variants?.available === false)} />
                          <Submit className="text-xs underline">{i.order_items.product_variants?.available === false ? "Voltar à vitrine" : "Esgotou no fornecedor"}</Submit>
                        </ActionForm>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm"><b>Entregar para:</b> {r.orders?.customers?.name} — {addressLine(r.orders?.shipping_address ?? null) || "sem endereço (venda no balcão)"}</p>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-bold">Mensagem pronta para o fornecedor</summary>
                <textarea readOnly rows={7} value={msg} className="input mt-2 font-mono text-xs" aria-label="Mensagem para o fornecedor" />
              </details>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline"><MessageCircle className="h-4 w-4" /> Enviar no WhatsApp</a>}
                {links.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline"><ExternalLink className="h-4 w-4" /> Abrir peça no fornecedor</a>)}
              </div>

              <ActionForm action={updateSupplierOrder} className="stitch-t mt-4 grid gap-3 pt-4 sm:grid-cols-2">
                <input type="hidden" name="id" value={r.id} />
                <label className="field"><span>Status</span>
                  <select name="status" defaultValue={r.status === "to_order" ? "ordered" : r.status} className="input">
                    {TABS.map((s) => <option key={s} value={s}>{SUPPLIER_STATUS[s]}</option>)}
                  </select></label>
                <label className="field"><span>Nº do pedido no fornecedor</span><input name="supplier_ref" defaultValue={r.supplier_ref} className="input font-mono text-sm" /></label>
                <label className="field"><span>Custo real (R$)</span><input name="cost" inputMode="decimal" defaultValue={r.cost === null ? "" : Number(r.cost).toFixed(2).replace(".", ",")} className="input tnum" /></label>
                <label className="field"><span>Rastreio do fornecedor</span><input name="tracking_code" defaultValue={r.tracking_code} className="input font-mono text-sm" /></label>
                <label className="field sm:col-span-2"><span>Observações</span><input name="notes" defaultValue={r.notes} className="input" /></label>
                <div className="sm:col-span-2"><Submit className="btn btn-blue">Salvar</Submit></div>
              </ActionForm>
            </article>
          );
        })}
      </div>
      {!rows.length && <div className="mt-4"><Empty title={current === "to_order" ? "Nada a pedir agora." : `Nenhum pedido em “${SUPPLIER_STATUS[current]}”.`} /></div>}
    </>
  );
}

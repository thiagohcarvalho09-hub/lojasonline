"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
import type { Product, Variant } from "@/lib/types";
import { brl, CHANNEL, PAYMENT } from "@/lib/format";
import { ProductImage } from "@/components/art";
import { sellable } from "@/lib/fulfillment";

type Line = { variant: Variant; product: Product; qty: number };

/** Ponto de venda: monta o pedido no balcão ou a partir de uma conversa no WhatsApp. */
export function PosForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [channel, setChannel] = useState("store");
  const [method, setMethod] = useState("card");
  const [paid, setPaid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => !t || p.name.toLowerCase().includes(t) || (p.sku ?? "").toLowerCase().includes(t)).slice(0, 12);
  }, [q, products]);
  const subtotal = lines.reduce((a, l) => a + l.qty * Number(l.variant.price_override ?? l.product.price), 0);

  const add = (product: Product, variant: Variant) => setLines((cur) => {
    const i = cur.findIndex((l) => l.variant.id === variant.id);
    if (i < 0) return [...cur, { product, variant, qty: 1 }];
    return cur.map((l, k) => (k === i ? { ...l, qty: Math.min(l.qty + 1, sellable(product, variant.stock)) } : l));
  });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        customer: { name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") },
        items: lines.map((l) => ({ variant_id: l.variant.id, quantity: l.qty })),
        channel, payment_method: method, mark_paid: paid, coupon: fd.get("coupon"), notes: fd.get("notes"),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Não foi possível registrar a venda."); setBusy(false); return; }
    router.push(`/admin/pedidos/${data.id}`);
  }

  const seg = (on: boolean) => `h-10 flex-1 border border-ink px-3 text-sm ${on ? "bg-ink font-bold text-paper" : "bg-white/40"}`;

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section className="glass bevel p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar peça por nome ou SKU…" className="input pl-9" aria-label="Buscar peça" autoFocus />
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {shown.map((p) => (
            <li key={p.id} className="glass-thin flex gap-3 p-3">
              <div className="h-24 w-18 shrink-0 overflow-hidden"><ProductImage product={p} className="h-full w-full" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{p.name}</p>
                <p className="tnum text-sm">{brl(p.price)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(p.product_variants ?? []).map((v) => (
                    <button key={v.id} type="button" disabled={sellable(p, v.stock) === 0} onClick={() => add(p, v)} title={`${v.color} · ${p.fulfillment === "stock" ? `${v.stock} em estoque` : "vende sem estoque"}`}
                      className="flex h-7 items-center gap-1.5 border border-ink/60 bg-white/50 px-1.5 text-xs hover:bg-ink hover:text-paper disabled:opacity-30 disabled:line-through">
                      <span className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/30" style={{ background: v.color_hex }} />{v.size}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
          {!shown.length && <li className="py-8 text-sm text-ink/60">Nenhuma peça encontrada.</li>}
        </ul>
      </section>

      <aside className="glass bevel space-y-4 p-5 lg:sticky lg:top-24 lg:self-start">
        <h2 className="display text-2xl">Venda</h2>
        <ul>
          {lines.map((l) => (
            <li key={l.variant.id} className="stitch-b flex items-center gap-3 py-2 text-sm">
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{l.product.name}</p><p className="text-ink/60">{l.variant.size} · {l.variant.color}</p></div>
              <input type="number" min={1} max={sellable(l.product, l.variant.stock)} value={l.qty} aria-label="Quantidade" className="input h-9 w-16 px-2 text-center"
                onChange={(e) => setLines(lines.map((x) => (x === l ? { ...x, qty: Math.max(1, Math.min(Number(e.target.value) || 1, sellable(l.product, l.variant.stock))) } : x)))} />
              <span className="tnum w-24 text-right font-bold">{brl(l.qty * Number(l.variant.price_override ?? l.product.price))}</span>
              <button type="button" onClick={() => setLines(lines.filter((x) => x !== l))} aria-label="Remover"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
          {!lines.length && <li className="py-6 text-sm text-ink/60">Toque no tamanho de uma peça para adicioná-la.</li>}
        </ul>
        <div className="flex items-baseline justify-between"><span className="eyebrow">Subtotal</span><span className="figure text-4xl">{brl(subtotal)}</span></div>

        <div><p className="eyebrow mb-1">Canal</p><div className="flex">{["store", "whatsapp", "online"].map((k) => <button key={k} type="button" onClick={() => setChannel(k)} className={seg(channel === k)}>{CHANNEL[k]}</button>)}</div></div>
        <div><p className="eyebrow mb-1">Pagamento</p><div className="flex">{Object.keys(PAYMENT).map((k) => <button key={k} type="button" onClick={() => setMethod(k)} className={seg(method === k)}>{PAYMENT[k]}</button>)}</div></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-4 w-4 accent-[#1546ff]" /> Pagamento já recebido</label>

        <label className="field"><span>Cliente</span><input name="name" required minLength={2} placeholder="Nome completo" className="input" /></label>
        <div className="grid grid-cols-2 gap-3">
          <input name="email" type="email" required placeholder="E-mail" aria-label="E-mail" className="input" />
          <input name="phone" placeholder="WhatsApp" aria-label="WhatsApp" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input name="coupon" placeholder="Cupom" aria-label="Cupom" className="input font-mono uppercase" />
          <input name="notes" placeholder="Observações" aria-label="Observações" className="input" />
        </div>
        {error && <p role="alert" className="border border-rouge bg-rouge/10 p-3 text-sm font-bold text-rouge">{error}</p>}
        <button className="btn btn-blue w-full" disabled={busy || !lines.length}>{busy ? "Registrando…" : "Registrar venda"}</button>
        <p className="text-xs text-ink/50">Frete, cupom e estoque são calculados pelo servidor ao registrar.</p>
      </aside>
    </form>
  );
}

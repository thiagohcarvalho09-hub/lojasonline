import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Panel, Tabs } from "@/components/admin/bits";
import { Kpi } from "@/components/admin/charts";
import { StockAdjust } from "@/components/admin/stock-adjust";
import { ProductImage } from "@/components/art";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/shop";
import { brl, dateTime, num, REASON } from "@/lib/format";

export const metadata: Metadata = { title: "Estoque" };

type Row = { id: string; size: string; color: string; color_hex: string; sku: string | null; stock: number; products: { id: string; name: string; art: string; tone: string; images: string[]; price: number; product_costs: { cost: number } | null } };

export default async function Estoque({ searchParams }: { searchParams: Promise<{ filtro?: string; q?: string }> }) {
  const f = await searchParams;
  const supabase = await createClient();
  const settings = await getSettings();
  const [{ data }, { data: moves }] = await Promise.all([
    supabase.from("product_variants").select("id, size, color, color_hex, sku, stock, products!inner(id, name, art, tone, images, price, product_costs(cost))").order("stock"),
    supabase.from("inventory_movements").select("id, delta, reason, note, created_at, product_variants(size, color, products(name))").order("created_at", { ascending: false }).limit(14),
  ]);
  const all = (data ?? []) as unknown as Row[];
  const low = all.filter((v) => v.stock > 0 && v.stock <= settings.low_stock_threshold);
  const out = all.filter((v) => v.stock === 0);
  const t = f.q?.toLowerCase().trim();
  const rows = (f.filtro === "baixo" ? [...out, ...low] : f.filtro === "zerado" ? out : all)
    .filter((v) => !t || v.products.name.toLowerCase().includes(t) || (v.sku ?? "").toLowerCase().includes(t));
  const units = all.reduce((a, v) => a + v.stock, 0);

  return (
    <>
      <PageHead eyebrow="Estoque / grade por variação" title="O que há nas araras.">
        <form className="flex gap-2">{f.filtro && <input type="hidden" name="filtro" value={f.filtro} />}<input name="q" defaultValue={f.q} placeholder="Peça ou SKU" aria-label="Buscar no estoque" className="input h-11 w-56" /></form>
      </PageHead>
      <section className="rule mb-4 grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-ink">
        <Kpi label="Unidades em estoque" value={num(units)} />
        <Kpi label="Valor de venda" value={brl(all.reduce((a, v) => a + v.stock * Number(v.products.price), 0)).replace(/,\d\d$/, "")} />
        <Kpi label="Valor de custo" value={brl(all.reduce((a, v) => a + v.stock * Number(v.products.product_costs?.cost ?? 0), 0)).replace(/,\d\d$/, "")} />
        <Kpi label="Reposição prioritária" value={num(low.length + out.length)} hint={`${out.length} zeradas · ${low.length} abaixo de ${settings.low_stock_threshold + 1} un.`} />
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div>
          <Tabs current={f.filtro ?? "all"} items={[
            { key: "all", label: "Tudo", href: "/admin/estoque", count: all.length },
            { key: "baixo", label: "Reposição prioritária", href: "/admin/estoque?filtro=baixo", count: low.length + out.length },
            { key: "zerado", label: "Esgotadas", href: "/admin/estoque?filtro=zerado", count: out.length },
          ]} />
          <div className="scroll-x">
            <table className="table">
              <thead><tr><th colSpan={2}>Peça</th><th>Variação</th><th>SKU</th><th className="text-right">Em estoque</th><th>Movimentar</th></tr></thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td className="w-12"><div className="h-14 w-11 overflow-hidden"><ProductImage product={v.products} color={v.color_hex} className="h-full w-full" /></div></td>
                    <td><Link href={`/admin/produtos/${v.products.id}`} className="font-bold hover:text-blue">{v.products.name}</Link></td>
                    <td className="whitespace-nowrap"><span className="mr-2 inline-block h-3 w-3 rounded-full align-middle ring-1 ring-ink/30" style={{ background: v.color_hex }} />{v.size} · {v.color}</td>
                    <td className="font-mono text-xs text-ink/60">{v.sku}</td>
                    <td className="text-right">
                      <span className={`figure text-2xl ${v.stock === 0 ? "text-rouge" : ""}`}>{v.stock}</span>
                      {v.stock === 0 ? <span className="badge badge-red ml-2">Esgotada</span> : v.stock <= settings.low_stock_threshold && <span className="badge badge-lime ml-2">Baixo</span>}
                    </td>
                    <td><StockAdjust variant={v.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Panel title="Últimas movimentações" className="self-start">
          <ol>
            {(moves ?? []).map((m) => {
              const v = m.product_variants as unknown as { size: string; color: string; products: { name: string } | null } | null;
              return (
                <li key={m.id} className="stitch-b flex items-center gap-3 py-2 text-sm">
                  <span className={`figure w-10 text-right text-xl ${m.delta < 0 ? "" : "text-blue"}`}>{m.delta > 0 ? "+" : "−"}{Math.abs(m.delta)}</span>
                  <div className="min-w-0 flex-1"><p className="truncate font-bold">{v?.products?.name ?? "Peça removida"} <span className="font-normal text-ink/60">{v?.size} · {v?.color}</span></p>
                    <p className="text-xs text-ink/55">{REASON[m.reason]} {m.note && `· ${m.note}`} · {dateTime(m.created_at)}</p></div>
                </li>
              );
            })}
            {!moves?.length && <li className="py-4 text-sm text-ink/60">Sem movimentações ainda.</li>}
          </ol>
        </Panel>
      </div>
    </>
  );
}

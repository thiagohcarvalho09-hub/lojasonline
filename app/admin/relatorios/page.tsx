import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { PageHead, Panel, PeriodPicker } from "@/components/admin/bits";
import { AreaChart, BarList, Kpi } from "@/components/admin/charts";
import { ProductImage } from "@/components/art";
import { createClient } from "@/lib/supabase/server";
import { brl, CHANNEL, dateShort, num, PAYMENT, periodRange, STATUS } from "@/lib/format";

export const metadata: Metadata = { title: "Relatórios" };

type S = {
  revenue: number; orders: number; prev_revenue: number; prev_orders: number; units: number; discounts: number; buyers: number; recurring: number;
  channels: { channel: string; total: number; count: number }[]; payments: { method: string; total: number; count: number }[];
  statuses: { status: string; count: number }[]; daily: { day: string; total: number; count: number }[];
  categories: { category: string; total: number; units: number }[];
  top_products: { product_id: string; name: string; art: string; tone: string; image: string | null; units: number; revenue: number }[];
};

export default async function Relatorios({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const range = periodRange((await searchParams).periodo);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_stats", { p_from: range.from, p_to: range.to });
  if (error || !data) return <p role="alert" className="glass p-6">Não foi possível carregar os relatórios.</p>;
  const s = data as S;
  const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

  return (
    <>
      <PageHead eyebrow="Relatórios / desempenho" title="Os números.">
        <PeriodPicker base="/admin/relatorios" current={range.key} />
        <a href="/api/export/orders" className="btn btn-ghost h-11"><Download className="h-4 w-4" /> Exportar pedidos</a>
      </PageHead>
      <section className="rule grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-ink">
        <Kpi label="Faturamento" value={brl(s.revenue).replace(/,\d\d$/, "")} delta={pct(s.revenue, s.prev_revenue)} hint={`Período anterior: ${brl(s.prev_revenue)}`} />
        <Kpi label="Pedidos pagos" value={num(s.orders)} delta={pct(s.orders, s.prev_orders)} />
        <Kpi label="Peças vendidas" value={num(s.units)} hint={`${s.orders ? (s.units / s.orders).toFixed(1).replace(".", ",") : 0} por pedido`} />
        <Kpi label="Descontos concedidos" value={brl(s.discounts)} hint={`${s.recurring} de ${s.buyers} clientes recorrentes`} />
      </section>

      <Panel title="Faturamento por dia" className="mt-5">
        <AreaChart height={260} data={s.daily.map((d) => ({ label: dateShort(d.day + "T12:00:00"), value: Number(d.total) }))} />
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Por categoria"><BarList rows={s.categories.map((c) => ({ label: c.category, value: Number(c.total), hint: `${c.units} un.` }))} /></Panel>
        <Panel title="Por canal"><BarList rows={[...s.channels].sort((a, b) => b.total - a.total).map((c) => ({ label: CHANNEL[c.channel], value: Number(c.total), hint: `${c.count} pedidos` }))} /></Panel>
        <Panel title="Por pagamento"><BarList rows={[...s.payments].sort((a, b) => b.total - a.total).map((c) => ({ label: PAYMENT[c.method], value: Number(c.total), hint: `${c.count} pedidos` }))} /></Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Ranking de peças">
          <table className="table">
            <thead><tr><th>N°</th><th colSpan={2}>Peça</th><th className="text-right">Unidades</th><th className="text-right">Receita</th></tr></thead>
            <tbody>
              {s.top_products.map((p, i) => (
                <tr key={p.product_id ?? p.name}>
                  <td className="serif text-2xl">{String(i + 1).padStart(2, "0")}</td>
                  <td className="w-12"><div className="h-14 w-11 overflow-hidden bg-stone"><ProductImage product={{ art: p.art ?? "blazer", tone: p.tone ?? "#cfcac0", image: p.image }} className="h-full w-full" /></div></td>
                  <td className="font-bold">{p.product_id ? <Link href={`/admin/produtos/${p.product_id}`} className="hover:text-blue">{p.name}</Link> : p.name}</td>
                  <td className="tnum text-right">{num(p.units)}</td>
                  <td className="tnum text-right font-bold">{brl(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Pedidos por status">
          <BarList format={(n) => num(n)} rows={[...s.statuses].sort((a, b) => b.count - a.count).map((x) => ({ label: STATUS[x.status]?.label ?? x.status, value: x.count }))} />
        </Panel>
      </div>
    </>
  );
}

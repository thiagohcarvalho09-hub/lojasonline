import Link from "next/link";
import { ArrowRight, Box, Laptop, MessageCircle, Plus, Store } from "lucide-react";
import { ProductArt, ProductImage } from "@/components/art";
import { ChromeBlob, StatusBadge } from "@/components/ui";
import { AreaChart, Kpi } from "@/components/admin/charts";
import { PageHead, PeriodPicker } from "@/components/admin/bits";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/shop";
import { brl, CHANNEL, dateShort, num, periodRange } from "@/lib/format";

type Stats = {
  revenue: number; orders: number; prev_revenue: number; prev_orders: number; buyers: number; recurring: number; units: number;
  pending: number; to_ship: number;
  channels: { channel: string; total: number; count: number }[];
  daily: { day: string; total: number }[];
  top_products: { product_id: string; name: string; slug: string; art: string; tone: string; image: string | null; units: number; revenue: number }[];
};

export default async function Overview({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const range = periodRange((await searchParams).periodo);
  const supabase = await createClient();
  const settings = await getSettings();
  const [{ data: stats }, { data: recent }, { count: lowCount }, { data: featured }] = await Promise.all([
    supabase.rpc("dashboard_stats", { p_from: range.from, p_to: range.to }),
    supabase.from("orders").select("id, number, status, total, customers(name), order_items(name)").order("created_at", { ascending: false }).limit(6),
    supabase.from("product_variants").select("id", { count: "exact", head: true }).lte("stock", settings.low_stock_threshold),
    supabase.from("products").select("slug, name, art, tone, images").eq("status", "active").order("wish_count", { ascending: false }).limit(2),
  ]);
  const s = (stats ?? { revenue: 0, orders: 0, prev_revenue: 0, prev_orders: 0, buyers: 0, recurring: 0, units: 0, pending: 0, to_ship: 0, channels: [], daily: [], top_products: [] }) as Stats;
  const delta = s.prev_revenue > 0 ? ((s.revenue - s.prev_revenue) / s.prev_revenue) * 100 : null;
  const channelTotal = s.channels.reduce((a, c) => a + Number(c.total), 0) || 1;
  const icons = { online: Laptop, store: Store, whatsapp: MessageCircle } as const;
  const [a, b] = featured ?? [];

  return (
    <>
      <PageHead eyebrow={`Visão geral / ${settings.tagline}`} title="O próximo movimento.">
        <PeriodPicker base="/admin" current={range.key} />
        <Link href="/admin/produtos/novo" className="btn btn-blue h-11"><Plus className="h-5 w-5" /> Novo produto</Link>
      </PageHead>

      {/* Campanha */}
      <section className="relative grid min-h-[16.5rem] overflow-hidden bg-stone md:grid-cols-[1fr_1.1fr]">
        <div className="absolute inset-0 bg-[radial-gradient(110%_100%_at_15%_0%,rgba(255,255,255,.8),transparent_60%)]" />
        <div className="relative z-10 p-8 md:p-10">
          <h2 className="display text-[clamp(3.4rem,7vw,6rem)]">{settings.hero_title}</h2>
          <p className="serif mt-1 text-[clamp(1.6rem,2.8vw,2.5rem)]">{settings.hero_subtitle}</p>
          <Link href="/admin/colecoes" className="link mt-6">Ver coleção <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="relative hidden md:block">
          {a && <ProductImage product={a} className="absolute inset-y-0 left-0 h-full w-[58%]" />}
          {b && <ProductArt art={b.art} tone={b.tone} className="absolute inset-y-0 right-0 h-full w-[42%]" />}
          <div className="glass sheen absolute bottom-5 left-5 px-4 py-3">
            <p className="eyebrow text-[.6rem]">{settings.season} · no ar</p>
            <p className="tnum text-sm"><b>{num(s.units)}</b> peças vendidas no período</p>
          </div>
          <ChromeBlob className="absolute bottom-2 right-[34%] w-36 drop-shadow-[0_14px_14px_rgba(0,0,0,.35)]" />
        </div>
      </section>

      {/* Indicadores */}
      <section className="rule grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-ink">
        <Kpi label="Vendas no período" value={brl(s.revenue).replace(/,\d\d$/, "")} delta={delta} />
        <Kpi label="Pedidos" value={num(s.orders)} hint={`${s.pending} aguardando pagamento · ${s.to_ship} a enviar`} />
        <Kpi label="Ticket médio" value={brl(s.orders ? s.revenue / s.orders : 0)} />
        <Kpi label="Clientes recorrentes" value={`${s.buyers ? Math.round((s.recurring / s.buyers) * 100) : 0}%`} hint={`${s.recurring} de ${s.buyers} compradoras`} />
      </section>

      <div className="grid lg:grid-cols-[1.15fr_1fr] lg:divide-x lg:divide-ink">
        {/* Pedidos recentes */}
        <section className="py-5 lg:pr-6">
          <div className="mb-3 flex items-end justify-between"><h2 className="display text-[2.4rem]">Pedidos recentes</h2><Link href="/admin/pedidos" className="link">Ver todos os pedidos <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="scroll-x">
            <table className="table">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Peça</th><th>Valor</th><th>Status</th><th><span className="sr-only">Abrir</span></th></tr></thead>
              <tbody>
                {(recent ?? []).map((o) => {
                  const items = o.order_items as unknown as { name: string }[];
                  return (
                    <tr key={o.id}>
                      <td className="tnum font-bold"><Link href={`/admin/pedidos/${o.id}`}>#{o.number}</Link></td>
                      <td>{(o.customers as unknown as { name: string } | null)?.name ?? "—"}</td>
                      <td className="max-w-44 truncate">{items[0]?.name}{items.length > 1 && <span className="text-ink/50"> +{items.length - 1}</span>}</td>
                      <td className="tnum whitespace-nowrap">{brl(o.total)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="text-right"><Link href={`/admin/pedidos/${o.id}`} aria-label={`Abrir pedido ${o.number}`} className="px-2 text-xl tracking-widest">···</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Mais desejados */}
        <section className="border-t border-ink py-5 lg:border-t-0 lg:pl-6">
          <div className="mb-3 flex items-end justify-between"><h2 className="display text-[2.4rem]">Mais desejados</h2><Link href="/admin/relatorios" className="link">Ver ranking completo <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="grid grid-cols-3 gap-3">
            {s.top_products.slice(0, 3).map((p, i) => (
              <Link key={p.product_id ?? p.name} href={p.product_id ? `/admin/produtos/${p.product_id}` : "/admin/produtos"} className="group relative block">
                <div className="relative aspect-[4/4.2] overflow-hidden bg-stone">
                  <ProductImage product={{ art: p.art ?? "blazer", tone: p.tone ?? "#cfcac0", image: p.image }} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                  <span className="glass-thin serif absolute left-2 top-2 px-2 text-lg">N° {i + 1}</span>
                </div>
                <p className="mt-2 truncate text-[1.05rem]">{p.name}</p>
                <p className="tnum text-sm text-ink/70">{num(p.units)} unidades vendidas</p>
              </Link>
            ))}
            {!s.top_products.length && <p className="col-span-3 py-10 text-sm text-ink/50">Ainda sem vendas no período.</p>}
          </div>
        </section>
      </div>

      {/* Canais + reposição */}
      <section className="grid items-center gap-x-8 gap-y-5 border-t border-ink py-6 xl:grid-cols-[auto_1fr] min-[1700px]:grid-cols-[auto_1fr_auto]">
        <h2 className="display text-[2.4rem] leading-none">Vendas por canal</h2>
        <div className="grid gap-6 sm:grid-cols-3 sm:divide-x sm:divide-ink">
          {(["online", "store", "whatsapp"] as const).map((k) => {
            const pct = Math.round((Number(s.channels.find((c) => c.channel === k)?.total ?? 0) / channelTotal) * 100);
            const Icon = icons[k];
            return (
              <div key={k} className="sm:pl-6 sm:first:pl-0">
                <div className="flex items-center gap-3"><Icon className="h-6 w-6" strokeWidth={1.4} /><span className="flex-1 whitespace-nowrap">{CHANNEL[k]}</span><span className="figure text-2xl">{pct}%</span></div>
                <div className="mt-2 h-2.5 bg-ink/15"><div className="h-full bg-blue" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
        <Link href="/admin/estoque?filtro=baixo" className="flex items-center gap-4 xl:col-span-2 min-[1700px]:col-span-1">
          <span className="glass-lime eyebrow flex h-12 items-center gap-3 px-5"><Box className="h-5 w-5" strokeWidth={1.5} /> Reposição prioritária · {lowCount ?? 0} {lowCount === 1 ? "peça" : "peças"}</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* Ritmo de vendas */}
      <section className="glass bevel mt-2 p-5">
        <div className="mb-2 flex items-end justify-between"><h2 className="display text-2xl">Ritmo de vendas</h2><Link href="/admin/relatorios" className="link">Abrir relatórios <ArrowRight className="h-4 w-4" /></Link></div>
        <AreaChart data={s.daily.map((d) => ({ label: dateShort(d.day + "T12:00:00"), value: Number(d.total) }))} />
      </section>
    </>
  );
}

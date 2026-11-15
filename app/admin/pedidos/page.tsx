import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { PageHead, Tabs } from "@/components/admin/bits";
import { Empty, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { brl, CHANNEL, dateTime, PAYMENT, STATUS } from "@/lib/format";

export const metadata: Metadata = { title: "Pedidos" };

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ status?: string; canal?: string; q?: string }> }) {
  const f = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("orders")
    .select("id, number, status, channel, payment_method, total, created_at, customers!inner(name, email), order_items(quantity)")
    .order("created_at", { ascending: false }).limit(200);
  if (f.status) query = query.eq("status", f.status);
  if (f.canal) query = query.eq("channel", f.canal);
  if (f.q) {
    const n = Number(f.q.replace(/\D/g, ""));
    query = n && /^#?\d+$/.test(f.q.trim()) ? query.eq("number", n) : query.ilike("customers.name", `%${f.q.replace(/[%_,()]/g, " ").trim()}%`);
  }
  const [{ data: orders }, { data: all }] = await Promise.all([query, supabase.from("orders").select("status")]);
  const counts: Record<string, number> = {};
  (all ?? []).forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
  const qs = (patch: Record<string, string | undefined>) => {
    const next = Object.entries({ ...f, ...patch }).filter(([, v]) => v) as [string, string][];
    return `/admin/pedidos${next.length ? `?${new URLSearchParams(next)}` : ""}`;
  };

  return (
    <>
      <PageHead eyebrow="Pedidos / todos os canais" title="A fila do dia.">
        <a href={`/api/export/orders${f.status ? `?status=${f.status}` : ""}`} className="btn btn-ghost h-11"><Download className="h-4 w-4" /> Exportar CSV</a>
        <Link href="/admin/pedidos/novo" className="btn btn-blue h-11"><Plus className="h-5 w-5" /> Nova venda</Link>
      </PageHead>
      <Tabs current={f.status ?? "all"} items={[
        { key: "all", label: "Todos", href: qs({ status: undefined }), count: all?.length ?? 0 },
        ...Object.entries(STATUS).map(([k, v]) => ({ key: k, label: v.label, href: qs({ status: k }), count: counts[k] ?? 0 })),
      ]} />
      <div className="flex flex-wrap items-center gap-3 py-4">
        <form className="flex gap-2">
          {f.status && <input type="hidden" name="status" value={f.status} />}
          <input name="q" defaultValue={f.q} placeholder="Nº do pedido ou cliente" className="input h-10 w-64" aria-label="Buscar pedido" />
          <button className="btn btn-ink btn-sm h-10">Buscar</button>
        </form>
        <div className="ml-auto flex gap-1 text-sm">
          {[["", "Todos os canais"], ...Object.entries(CHANNEL)].map(([k, l]) => (
            <Link key={k} href={qs({ canal: k || undefined })} className={`border px-3 py-1.5 ${(f.canal ?? "") === k ? "border-ink bg-ink text-paper" : "border-ink/40 bg-white/40"}`}>{l}</Link>
          ))}
        </div>
      </div>
      {orders?.length ? (
        <div className="scroll-x">
          <table className="table">
            <thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Canal</th><th>Pagamento</th><th>Peças</th><th className="text-right">Valor</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => {
                const c = o.customers as unknown as { name: string; email: string };
                return (
                  <tr key={o.id}>
                    <td className="tnum font-bold"><Link href={`/admin/pedidos/${o.id}`} className="hover:text-blue">#{o.number}</Link></td>
                    <td className="tnum whitespace-nowrap text-ink/70">{dateTime(o.created_at)}</td>
                    <td><p>{c.name}</p><p className="text-xs text-ink/50">{c.email}</p></td>
                    <td>{CHANNEL[o.channel]}</td>
                    <td>{PAYMENT[o.payment_method]}</td>
                    <td className="tnum">{(o.order_items as { quantity: number }[]).reduce((a, i) => a + i.quantity, 0)}</td>
                    <td className="tnum whitespace-nowrap text-right font-bold">{brl(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <Empty title="Nenhum pedido neste filtro." />}
    </>
  );
}

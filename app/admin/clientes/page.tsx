import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/admin/bits";
import { Kpi } from "@/components/admin/charts";
import { Empty } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { brl, dateShort, num } from "@/lib/format";

export const metadata: Metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ q?: string; ordem?: string }> }) {
  const f = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("customer_stats").select("*").limit(300);
  if (f.q) { const t = f.q.replace(/[%_,()]/g, " ").trim(); query = query.or(`name.ilike.%${t}%,email.ilike.%${t}%`); }
  query = f.ordem === "recentes" ? query.order("created_at", { ascending: false }) : query.order("total_spent", { ascending: false });
  const { data } = await query;
  const list = data ?? [];
  const buyers = list.filter((c) => c.orders_count > 0);
  const revenue = buyers.reduce((a, c) => a + Number(c.total_spent), 0);

  return (
    <>
      <PageHead eyebrow="Clientes / relacionamento" title="Quem veste.">
        <form className="flex gap-2"><input name="q" defaultValue={f.q} placeholder="Nome ou e-mail" aria-label="Buscar cliente" className="input h-11 w-60" /></form>
        <Link href={f.ordem === "recentes" ? "/admin/clientes" : "/admin/clientes?ordem=recentes"} className="btn btn-ghost h-11">{f.ordem === "recentes" ? "Ordenar por valor" : "Ordenar por recentes"}</Link>
      </PageHead>
      <section className="rule mb-4 grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-ink">
        <Kpi label="Clientes" value={num(list.length)} />
        <Kpi label="Recorrentes" value={`${buyers.length ? Math.round((buyers.filter((c) => c.orders_count > 1).length / buyers.length) * 100) : 0}%`} />
        <Kpi label="Valor médio por cliente" value={brl(buyers.length ? revenue / buyers.length : 0)} />
        <Kpi label="VIP" value={num(list.filter((c) => (c.tags as string[]).includes("VIP")).length)} />
      </section>
      {list.length ? (
        <div className="scroll-x">
          <table className="table">
            <thead><tr><th>Cliente</th><th>Contato</th><th>Etiquetas</th><th className="text-right">Pedidos</th><th className="text-right">Total gasto</th><th>Último pedido</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/admin/clientes/${c.id}`} className="flex items-center gap-3 font-bold hover:text-blue">
                    <span className="chrome-fill grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-ink">{c.name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}</span>{c.name}</Link></td>
                  <td><p>{c.email}</p><p className="text-xs text-ink/50">{c.phone}</p></td>
                  <td>{(c.tags as string[]).map((t) => <span key={t} className="badge badge-lime mr-1">{t}</span>)}</td>
                  <td className="tnum text-right">{c.orders_count}</td>
                  <td className="tnum text-right font-bold">{brl(c.total_spent)}</td>
                  <td className="tnum text-ink/70">{c.last_order_at ? dateShort(c.last_order_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty title="Nenhum cliente encontrado." />}
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/admin/bits";
import { Kpi } from "@/components/admin/charts";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { brl, CHANNEL, dateLong, dateTime } from "@/lib/format";
import { saveCustomer } from "../../actions";

export default async function Cliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: c }, { data: orders }] = await Promise.all([
    supabase.from("customer_stats").select("*").eq("id", id).maybeSingle(),
    supabase.from("orders").select("id, number, status, channel, total, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
  ]);
  if (!c) notFound();
  const a = (c.address ?? {}) as Record<string, string>;
  return (
    <>
      <p className="eyebrow"><Link href="/admin/clientes" className="hover:text-blue">Clientes</Link> / desde {dateLong(c.created_at)}</p>
      <h1 className="serif mb-2 text-[clamp(3rem,6.5vw,5.6rem)]">{c.name}</h1>
      <section className="rule mb-5 grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-ink">
        <Kpi label="Total gasto" value={brl(c.total_spent)} />
        <Kpi label="Pedidos" value={String(c.orders_count)} />
        <Kpi label="Ticket médio" value={brl(c.orders_count ? c.total_spent / c.orders_count : 0)} />
        <Kpi label="Último pedido" value={c.last_order_at ? dateLong(c.last_order_at).split(" de ").slice(0, 2).join(" ") : "—"} />
      </section>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Histórico de pedidos">
          <table className="table">
            <thead><tr><th>Pedido</th><th>Data</th><th>Canal</th><th className="text-right">Valor</th><th>Status</th></tr></thead>
            <tbody>
              {(orders ?? []).map((o) => (
                <tr key={o.id}>
                  <td className="tnum font-bold"><Link href={`/admin/pedidos/${o.id}`} className="hover:text-blue">#{o.number}</Link></td>
                  <td className="tnum text-ink/70">{dateTime(o.created_at)}</td><td>{CHANNEL[o.channel]}</td>
                  <td className="tnum text-right">{brl(o.total)}</td><td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Ficha">
          <ActionForm action={saveCustomer} className="space-y-3">
            <input type="hidden" name="id" value={c.id} />
            <label className="field"><span>Nome</span><input name="name" required defaultValue={c.name} className="input" /></label>
            <label className="field"><span>WhatsApp</span><input name="phone" defaultValue={c.phone} className="input" /></label>
            <label className="field"><span>Etiquetas (separadas por vírgula)</span><input name="tags" defaultValue={(c.tags as string[]).join(", ")} placeholder="VIP, atacado" className="input" /></label>
            <label className="field"><span>Anotações internas</span><textarea name="notes" rows={4} defaultValue={c.notes} placeholder="Medidas, preferências, datas importantes…" className="input" /></label>
            <Submit className="btn btn-ink">Salvar ficha</Submit>
          </ActionForm>
          <div className="stitch-t mt-5 pt-4 text-sm">
            <p>{c.email}</p>{c.cpf && <p className="text-ink/60">CPF {c.cpf}</p>}
            {a.street && <p className="mt-2 text-ink/70">{a.street}, {a.number} {a.complement}<br />{a.district} · {a.city}/{a.state} · {a.cep}</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}

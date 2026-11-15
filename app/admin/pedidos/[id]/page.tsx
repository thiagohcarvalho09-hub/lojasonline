import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ProductImage } from "@/components/art";
import { Barcode, StatusBadge } from "@/components/ui";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Panel } from "@/components/admin/bits";
import { PrintButton } from "@/components/admin/print-button";
import { createClient } from "@/lib/supabase/server";
import { brl, CHANNEL, dateTime, PAYMENT } from "@/lib/format";
import { saveOrderNotes, updateOrderStatus } from "../../actions";

const NEXT: Record<string, { status: string; label: string }[]> = {
  pending: [{ status: "paid", label: "Confirmar pagamento" }],
  paid: [{ status: "processing", label: "Iniciar separação" }, { status: "shipped", label: "Marcar como enviado" }],
  processing: [{ status: "shipped", label: "Marcar como enviado" }],
  shipped: [{ status: "delivered", label: "Marcar como entregue" }],
  delivered: [],
};

export default async function Pedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: o } = await supabase.from("orders")
    .select("*, customers(id, name, email, phone, cpf), order_items(*, products(art, tone, images)), order_events(*)")
    .eq("id", id).maybeSingle();
  if (!o) notFound();
  const c = o.customers as { id: string; name: string; email: string; phone: string; cpf: string } | null;
  const a = (o.shipping_address ?? {}) as Record<string, string>;
  const closed = o.status === "cancelled" || o.status === "refunded";
  const events = [...(o.order_events as { id: string; message: string; created_at: string }[])].sort((x, y) => y.created_at.localeCompare(x.created_at));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow"><Link href="/admin/pedidos" className="hover:text-blue">Pedidos</Link> / {CHANNEL[o.channel]} / {dateTime(o.created_at)}</p>
          <h1 className="figure mt-1 flex items-center gap-4 text-[clamp(3rem,7vw,5.5rem)]">#{o.number} <StatusBadge status={o.status} /></h1>
        </div>
        <div className="flex gap-3 pb-2 print:hidden">
          <PrintButton />
          <Link href={`/pedido/${o.public_token}`} target="_blank" className="btn btn-ghost h-11">Página do cliente <ExternalLink className="h-4 w-4" /></Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Panel title="Peças">
            <table className="table">
              <thead><tr><th colSpan={2}>Peça</th><th>Qtd</th><th className="text-right">Unitário</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {(o.order_items as { id: string; name: string; variant_label: string; quantity: number; unit_price: number; total: number; products: { art: string; tone: string; images: string[] } | null }[]).map((i) => (
                  <tr key={i.id}>
                    <td className="w-14"><div className="h-16 w-13 overflow-hidden bg-stone">{i.products && <ProductImage product={i.products} className="h-full w-full" />}</div></td>
                    <td><p className="font-bold">{i.name}</p><p className="text-sm text-ink/60">{i.variant_label}</p></td>
                    <td className="tnum">{i.quantity}</td>
                    <td className="tnum text-right">{brl(i.unit_price)}</td>
                    <td className="tnum text-right font-bold">{brl(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto mt-4 max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tnum">{brl(o.subtotal)}</dd></div>
              {Number(o.discount) > 0 && <div className="flex justify-between"><dt>Desconto {o.coupon_code && <span className="badge badge-lime ml-1">{o.coupon_code}</span>}</dt><dd className="tnum">− {brl(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Frete</dt><dd className="tnum">{Number(o.shipping) ? brl(o.shipping) : "Grátis"}</dd></div>
              <div className="flex items-baseline justify-between border-t border-ink pt-2"><dt className="eyebrow">Total · {PAYMENT[o.payment_method]}</dt><dd className="figure text-3xl">{brl(o.total)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Histórico">
            <ol>
              {events.map((e) => (
                <li key={e.id} className="stitch-b flex gap-4 py-2.5 text-sm"><span className="tnum w-32 shrink-0 text-ink/60">{dateTime(e.created_at)}</span><span>{e.message}</span></li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-5">
          {!closed && (
            <section className="glass-dark p-5 print:hidden">
              <h2 className="display text-2xl">Próximo passo</h2>
              <ActionForm action={updateOrderStatus} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={o.id} />
                <label className="block text-sm"><span className="eyebrow mb-1 block text-paper/60">Código de rastreio</span>
                  <input name="tracking" defaultValue={o.tracking_code ?? ""} placeholder="BR000000000SP" className="h-11 w-full border border-paper/30 bg-white/10 px-3 font-mono text-paper placeholder:text-paper/30 focus:border-lime focus:outline-none" /></label>
                <label className="block text-sm"><span className="eyebrow mb-1 block text-paper/60">Nota no histórico (opcional)</span>
                  <input name="note" className="h-11 w-full border border-paper/30 bg-white/10 px-3 text-paper focus:border-lime focus:outline-none" /></label>
                <div className="flex flex-wrap gap-2">
                  {(NEXT[o.status] ?? []).map((n) => <Submit key={n.status} name="status" value={n.status} className="btn btn-lime">{n.label}</Submit>)}
                  {!NEXT[o.status]?.length && <p className="text-sm text-paper/70">Pedido concluído.</p>}
                </div>
              </ActionForm>
              <ActionForm action={updateOrderStatus} className="mt-4 border-t border-paper/20 pt-4" confirm="Encerrar este pedido e devolver as peças ao estoque?">
                <input type="hidden" name="id" value={o.id} />
                <div className="flex gap-2">
                  <Submit name="status" value="cancelled" className="btn btn-sm border border-paper/40 text-paper hover:bg-paper hover:text-ink">Cancelar pedido</Submit>
                  {o.paid_at && <Submit name="status" value="refunded" className="btn btn-sm border border-paper/40 text-paper hover:bg-paper hover:text-ink">Estornar</Submit>}
                </div>
              </ActionForm>
            </section>
          )}

          <Panel title="Cliente" action={c && <Link href={`/admin/clientes/${c.id}`} className="link">Ver ficha</Link>}>
            {c ? <div className="text-sm leading-relaxed"><p className="text-base font-bold">{c.name}</p><p>{c.email}</p><p>{c.phone}</p>{c.cpf && <p className="text-ink/60">CPF {c.cpf}</p>}</div> : <p className="text-sm text-ink/60">Cliente removido.</p>}
            {a.street && <div className="stitch-t mt-4 pt-4 text-sm"><p className="eyebrow mb-1">Entrega</p><p>{a.street}, {a.number} {a.complement}</p><p>{a.district} · {a.city}/{a.state}</p><p className="font-mono">{a.cep}</p></div>}
            {o.tracking_code && <p className="mt-3 text-sm">Rastreio: <b className="font-mono">{o.tracking_code}</b></p>}
            <Barcode value={o.id} className="mt-4 h-8 w-full opacity-70" />
          </Panel>

          <Panel title="Observações" className="print:hidden">
            <ActionForm action={saveOrderNotes}>
              <input type="hidden" name="id" value={o.id} />
              <textarea name="notes" rows={3} defaultValue={o.notes} className="input" aria-label="Observações internas" />
              <Submit className="btn btn-ink btn-sm mt-3">Salvar</Submit>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}

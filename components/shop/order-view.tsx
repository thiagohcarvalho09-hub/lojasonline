import { Check } from "lucide-react";
import { ProductImage } from "@/components/art";
import { Barcode, StatusBadge } from "@/components/ui";
import { brl, dateTime, PAYMENT, STATUS, STATUS_FLOW } from "@/lib/format";

export type PublicOrder = {
  number: number; token: string; status: string; payment_method: string; subtotal: number; discount: number;
  shipping: number; total: number; coupon_code: string | null; tracking_code: string | null; created_at: string;
  customer_name: string; address: Record<string, string>;
  items: { name: string; label: string; quantity: number; total: number; art: string | null; tone: string | null; image: string | null }[];
  events: { status: string | null; message: string; created_at: string }[];
};

export function OrderView({ order: o, pixKey }: { order: PublicOrder; pixKey: string }) {
  const closed = o.status === "cancelled" || o.status === "refunded";
  const step = STATUS_FLOW.indexOf(o.status);
  const a = o.address ?? {};
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="glass bevel p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="figure text-5xl">#{o.number}</p>
            <StatusBadge status={o.status} />
          </div>
          {!closed && (
            <ol className="mt-8 grid grid-cols-5 gap-1" aria-label="Andamento do pedido">
              {STATUS_FLOW.map((s, i) => (
                <li key={s} aria-current={i === step ? "step" : undefined}>
                  <div className={`h-2 ${i <= step ? "bg-blue" : "bg-ink/15"}`} />
                  <p className={`mt-2 flex items-center gap-1 text-xs ${i <= step ? "font-bold" : "text-ink/50"}`}>
                    {i <= step && <Check className="h-3 w-3" />}{STATUS[s].label.replace("Aguardando pagamento", "Recebido")}
                  </p>
                </li>
              ))}
            </ol>
          )}
          {o.status === "pending" && (
            <div className="glass-lime mt-6 p-4 text-sm">
              <p className="eyebrow mb-1">Pagamento · {PAYMENT[o.payment_method]}</p>
              {o.payment_method === "pix"
                ? pixKey ? <>Faça um Pix de <b>{brl(o.total)}</b> para a chave <b className="font-mono">{pixKey}</b> e informe o pedido <b>#{o.number}</b> na descrição.</>
                  : <>Você receberá a chave Pix por e-mail ou WhatsApp em instantes.</>
                : <>Enviaremos o link de pagamento do cartão por e-mail ou WhatsApp em instantes.</>}
            </div>
          )}
          {o.tracking_code && <p className="mt-6 text-sm">Código de rastreio: <b className="font-mono tracking-widest">{o.tracking_code}</b></p>}
        </div>

        <h2 className="display mt-10 text-3xl">Histórico</h2>
        <ol className="mt-3">
          {[...o.events].reverse().map((e, i) => (
            <li key={i} className="stitch-b flex gap-4 py-3 text-sm">
              <span className="tnum w-32 shrink-0 text-ink/60">{dateTime(e.created_at)}</span><span>{e.message}</span>
            </li>
          ))}
        </ol>
      </div>

      <aside className="glass p-6">
        <h2 className="display text-3xl">Peças</h2>
        <ul className="mt-3">
          {o.items.map((it, i) => (
            <li key={i} className="stitch-b flex gap-3 py-3">
              <div className="h-20 w-16 shrink-0 overflow-hidden bg-stone">{it.art && <ProductImage product={{ art: it.art, tone: it.tone ?? "#cfcac0", image: it.image }} className="h-full w-full" />}</div>
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{it.name}</p><p className="text-sm text-ink/60">{it.label} · {it.quantity}×</p></div>
              <p className="tnum font-bold">{brl(it.total)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tnum">{brl(o.subtotal)}</dd></div>
          {Number(o.discount) > 0 && <div className="flex justify-between"><dt>Desconto {o.coupon_code && `(${o.coupon_code})`}</dt><dd className="tnum">− {brl(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Frete</dt><dd className="tnum">{Number(o.shipping) ? brl(o.shipping) : "Grátis"}</dd></div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-ink pt-4"><span className="eyebrow">Total</span><span className="figure text-4xl">{brl(o.total)}</span></div>
        {a.street && (
          <div className="mt-6 text-sm">
            <p className="eyebrow mb-1">Entrega</p>
            <p>{o.customer_name}</p>
            <p className="text-ink/70">{a.street}, {a.number} {a.complement} · {a.district}<br />{a.city}/{a.state} · {a.cep}</p>
          </div>
        )}
        <Barcode value={o.token} className="mt-6 h-8 w-full opacity-70" />
      </aside>
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Lock, QrCode } from "lucide-react";
import { useCart } from "@/components/shop/cart";
import { ProductImage } from "@/components/art";
import { Barcode } from "@/components/ui";
import { brl } from "@/lib/format";

type Coupon = { valid: boolean; message: string; code?: string; discount?: number; free_shipping?: boolean };

const maskCep = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
const maskPhone = (v: string) => v.replace(/\D/g, "").slice(0, 11).replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
const maskCpf = (v: string) => v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export function CheckoutForm({ flat, freeOver }: { flat: number; freeOver: number }) {
  const { lines, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [addr, setAddr] = useState({ cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const discount = coupon?.valid ? coupon.discount ?? 0 : 0;
  const shipping = coupon?.free_shipping || subtotal - discount >= freeOver ? 0 : flat;
  const total = subtotal - discount + shipping;

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const d = await fetch(`https://viacep.com.br/ws/${digits}/json/`).then((r) => r.json());
      if (!d.erro) setAddr((a) => ({ ...a, street: d.logradouro ?? a.street, district: d.bairro ?? a.district, city: d.localidade ?? a.city, state: d.uf ?? a.state }));
    } catch { /* preenchimento manual */ }
  }

  async function applyCoupon() {
    const r = await fetch("/api/coupon", { method: "POST", body: JSON.stringify({ code, subtotal }) }).then((x) => x.json());
    setCoupon(r);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        customer: { name: fd.get("name"), email: fd.get("email"), phone, cpf },
        address: addr, payment_method: method, notes: fd.get("notes"),
        coupon: coupon?.valid ? coupon.code : "",
        items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.qty })),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Não foi possível concluir o pedido."); setBusy(false); return; }
    clear();
    router.push(`/pedido/${data.token}?novo=1`);
  }

  if (ready && lines.length === 0 && !busy) {
    return (
      <div className="py-24 text-center">
        <h1 className="serif text-6xl">Sua sacola está vazia.</h1>
        <Link href="/loja" className="btn btn-ink mt-8">Voltar à loja</Link>
      </div>
    );
  }

  const set = (k: keyof typeof addr) => (e: React.ChangeEvent<HTMLInputElement>) => setAddr({ ...addr, [k]: e.target.value });

  return (
    <form onSubmit={submit} className="grid gap-10 pt-8 md:pt-12 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <p className="eyebrow">Checkout / 3 passos</p>
        <h1 className="serif text-[clamp(3rem,7vw,5.5rem)]">Quase seu.</h1>

        <section className="mt-8">
          <h2 className="display rule pb-2 text-3xl"><span className="serif mr-3 normal-case">01</span>Identificação</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="field sm:col-span-2"><span>Nome completo</span><input name="name" required minLength={2} autoComplete="name" className="input" /></label>
            <label className="field"><span>E-mail</span><input name="email" type="email" required autoComplete="email" className="input" /></label>
            <label className="field"><span>WhatsApp</span><input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" className="input" /></label>
            <label className="field"><span>CPF (para a nota fiscal)</span><input value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" className="input" /></label>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="display rule pb-2 text-3xl"><span className="serif mr-3 normal-case">02</span>Entrega</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-6">
            <label className="field sm:col-span-2"><span>CEP</span><input required value={addr.cep} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" className="input"
              onChange={(e) => { const v = maskCep(e.target.value); setAddr({ ...addr, cep: v }); lookupCep(v); }} /></label>
            <label className="field sm:col-span-4"><span>Rua</span><input required value={addr.street} onChange={set("street")} autoComplete="address-line1" className="input" /></label>
            <label className="field sm:col-span-2"><span>Número</span><input required value={addr.number} onChange={set("number")} className="input" /></label>
            <label className="field sm:col-span-4"><span>Complemento</span><input value={addr.complement} onChange={set("complement")} autoComplete="address-line2" className="input" /></label>
            <label className="field sm:col-span-2"><span>Bairro</span><input required value={addr.district} onChange={set("district")} className="input" /></label>
            <label className="field sm:col-span-3"><span>Cidade</span><input required value={addr.city} onChange={set("city")} autoComplete="address-level2" className="input" /></label>
            <label className="field sm:col-span-1"><span>UF</span><input required maxLength={2} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value.toUpperCase() })} autoComplete="address-level1" className="input" /></label>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="display rule pb-2 text-3xl"><span className="serif mr-3 normal-case">03</span>Pagamento</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Forma de pagamento">
            {([["pix", QrCode, "Pix", "Chave enviada na confirmação. Aprovação em minutos."], ["card", CreditCard, "Cartão de crédito", "Você recebe um link de pagamento seguro. Até 6× sem juros."]] as const).map(([k, Icon, t, d]) => (
              <button key={k} type="button" role="radio" aria-checked={method === k} onClick={() => setMethod(k)}
                className={`p-5 text-left transition-all ${method === k ? "glass-dark" : "glass hover:-translate-y-0.5"}`}>
                <Icon className="h-6 w-6" strokeWidth={1.4} />
                <p className="display mt-4 text-2xl">{t}</p>
                <p className={`mt-1 text-sm ${method === k ? "text-paper/70" : "text-ink/60"}`}>{d}</p>
              </button>
            ))}
          </div>
          <label className="field mt-5"><span>Observações do pedido (opcional)</span><textarea name="notes" rows={2} maxLength={500} className="input" placeholder="Embrulhar para presente, horário de entrega…" /></label>
        </section>
      </div>

      {/* Resumo: o tíquete da compra */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="glass bevel p-6">
          <div className="flex items-baseline justify-between"><h2 className="display text-3xl">Resumo</h2><span className="eyebrow text-ash">{lines.reduce((a, l) => a + l.qty, 0)} peças</span></div>
          <ul className="mt-4">
            {lines.map((l) => (
              <li key={l.variantId} className="stitch-b flex gap-3 py-3">
                <div className="h-20 w-16 shrink-0 overflow-hidden"><ProductImage product={l} className="h-full w-full" /></div>
                <div className="min-w-0 flex-1"><p className="truncate font-bold">{l.name}</p><p className="text-sm text-ink/60">{l.label} · {l.qty}×</p></div>
                <p className="tnum font-bold">{brl(l.price * l.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Cupom" aria-label="Cupom de desconto" className="input font-mono uppercase tracking-widest" />
            <button type="button" onClick={applyCoupon} className="btn btn-ghost" disabled={!code}>Aplicar</button>
          </div>
          {coupon && <p className={`mt-2 text-sm font-bold ${coupon.valid ? "" : "text-rouge"}`}>{coupon.valid && <span className="badge badge-lime mr-2">{coupon.code}</span>}{coupon.message}</p>}
          <dl className="mt-5 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tnum">{brl(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between"><dt>Desconto</dt><dd className="tnum">− {brl(discount)}</dd></div>}
            <div className="flex justify-between"><dt>Frete</dt><dd className="tnum">{shipping ? brl(shipping) : "Grátis"}</dd></div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-ink pt-4"><span className="eyebrow">Total</span><span className="figure text-5xl">{brl(total)}</span></div>
          {error && <p role="alert" className="mt-4 border border-rouge bg-rouge/10 p-3 text-sm font-bold text-rouge">{error}</p>}
          <button className="btn btn-blue mt-5 h-13 w-full text-base" disabled={busy || !ready}><Lock className="h-4 w-4" /> {busy ? "Enviando…" : "Confirmar pedido"}</button>
          <p className="mt-3 text-center text-xs text-ink/50">O valor final é conferido no servidor antes da confirmação.</p>
          <Barcode value={String(total)} className="mt-5 h-7 w-full opacity-70" />
        </div>
      </aside>
    </form>
  );
}

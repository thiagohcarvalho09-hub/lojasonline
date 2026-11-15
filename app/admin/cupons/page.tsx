import type { Metadata } from "next";
import { PageHead, Panel } from "@/components/admin/bits";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Barcode, Empty } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { brl, dateLong } from "@/lib/format";
import { saveCoupon, toggleCoupon } from "../actions";

export const metadata: Metadata = { title: "Cupons" };

export default async function Cupons() {
  const supabase = await createClient();
  const { data: coupons } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  return (
    <>
      <PageHead eyebrow="Cupons / promoções" title="Convites." />
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {(coupons ?? []).map((c) => {
            const expired = c.ends_at && new Date(c.ends_at) < new Date();
            const spent = c.max_uses && c.used_count >= c.max_uses;
            return (
              <article key={c.id} className={`glass bevel relative p-5 ${c.is_active && !expired && !spent ? "" : "opacity-60"}`}>
                <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-paper ring-1 ring-ink/20" aria-hidden />
                <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-paper ring-1 ring-ink/20" aria-hidden />
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-lg font-bold tracking-[.2em]">{c.code}</p>
                  <span className={`badge ${expired || spent ? "badge-red" : c.is_active ? "badge-lime" : "badge-stone"}`}>{expired ? "Expirado" : spent ? "Esgotado" : c.is_active ? "Ativo" : "Pausado"}</span>
                </div>
                <p className="figure mt-3 text-5xl">{c.type === "percent" ? `${Number(c.value)}%` : c.type === "fixed" ? brl(c.value).replace(",00", "") : "Frete grátis"}</p>
                <p className="mt-1 text-sm text-ink/70">
                  {Number(c.min_subtotal) > 0 ? `Acima de ${brl(c.min_subtotal)}` : "Sem pedido mínimo"}{c.ends_at && ` · até ${dateLong(c.ends_at)}`}
                </p>
                <div className="stitch-t mt-4 flex items-center justify-between pt-3 text-sm">
                  <span className="tnum"><b>{c.used_count}</b>{c.max_uses ? ` de ${c.max_uses}` : ""} usos</span>
                  <div className="flex gap-3">
                    <ActionForm action={toggleCoupon}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={String(!c.is_active)} /><Submit className="underline">{c.is_active ? "Pausar" : "Ativar"}</Submit></ActionForm>
                    <ActionForm action={toggleCoupon} confirm={`Excluir o cupom ${c.code}?`}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delete" value="1" /><Submit className="text-rouge underline">Excluir</Submit></ActionForm>
                  </div>
                </div>
                <Barcode value={c.code} className="mt-3 h-5 w-full opacity-60" />
              </article>
            );
          })}
          {!coupons?.length && <div className="sm:col-span-2"><Empty title="Nenhum cupom criado." /></div>}
        </div>
        <Panel title="Novo cupom" className="self-start">
          <ActionForm action={saveCoupon} className="space-y-3">
            <label className="field"><span>Código</span><input name="code" required placeholder="VERAO15" className="input font-mono uppercase tracking-widest" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="field"><span>Tipo</span><select name="type" className="input"><option value="percent">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option><option value="free_shipping">Frete grátis</option></select></label>
              <label className="field"><span>Valor</span><input name="value" inputMode="decimal" placeholder="15" className="input tnum" /></label>
              <label className="field"><span>Pedido mínimo (R$)</span><input name="min_subtotal" inputMode="decimal" placeholder="0" className="input tnum" /></label>
              <label className="field"><span>Limite de usos</span><input name="max_uses" type="number" min={1} placeholder="Ilimitado" className="input" /></label>
            </div>
            <label className="field"><span>Válido até (opcional)</span><input name="ends_at" type="date" className="input" /></label>
            <Submit className="btn btn-blue w-full">Criar cupom</Submit>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}

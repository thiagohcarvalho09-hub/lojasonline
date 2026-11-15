import type { Metadata } from "next";
import { PageHead, Panel } from "@/components/admin/bits";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { getViewer } from "@/lib/supabase/server";
import { getSettings } from "@/lib/shop";
import { dateLong } from "@/lib/format";
import { saveSettings, setRole } from "../actions";

export const metadata: Metadata = { title: "Configurações" };
const ROLE: Record<string, string> = { owner: "Proprietária", staff: "Equipe", customer: "Sem acesso" };

export default async function Configuracoes() {
  const { supabase, profile, user } = await getViewer();
  const [s, { data: team }, { count: subs }] = await Promise.all([
    getSettings(),
    supabase.from("profiles").select("id, full_name, email, role, created_at").order("created_at"),
    supabase.from("newsletter_subscribers").select("email", { count: "exact", head: true }),
  ]);
  const money = (n: number) => Number(n).toFixed(2).replace(".", ",");
  return (
    <>
      <PageHead eyebrow="Configurações / loja" title="Os bastidores." />
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <ActionForm action={saveSettings} className="space-y-5">
          <Panel title="Vitrine">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field"><span>Nome da loja</span><input name="name" defaultValue={s.name} className="input" /></label>
              <label className="field"><span>Assinatura</span><input name="tagline" defaultValue={s.tagline} className="input" /></label>
              <label className="field"><span>Título da campanha</span><input name="hero_title" defaultValue={s.hero_title} className="input" /></label>
              <label className="field"><span>Temporada</span><input name="season" defaultValue={s.season} className="input" /></label>
              <label className="field sm:col-span-2"><span>Subtítulo da campanha</span><input name="hero_subtitle" defaultValue={s.hero_subtitle} className="input" /></label>
              <label className="field sm:col-span-2"><span>Faixa de avisos (separe as frases com “·”)</span><input name="announcement" defaultValue={s.announcement} className="input" /></label>
            </div>
          </Panel>
          <Panel title="Entrega & estoque">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="field"><span>Frete fixo (R$)</span><input name="shipping_flat" inputMode="decimal" defaultValue={money(s.shipping_flat)} className="input tnum" /></label>
              <label className="field"><span>Frete grátis acima de (R$)</span><input name="free_shipping_over" inputMode="decimal" defaultValue={money(s.free_shipping_over)} className="input tnum" /></label>
              <label className="field"><span>Alerta de estoque baixo (un.)</span><input name="low_stock_threshold" type="number" min={0} defaultValue={s.low_stock_threshold} className="input" /></label>
            </div>
          </Panel>
          <Panel title="Pagamento & contato">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field"><span>Chave Pix (mostrada ao cliente no pedido)</span><input name="pix_key" defaultValue={s.pix_key} className="input font-mono text-sm" /></label>
              <label className="field"><span>WhatsApp</span><input name="whatsapp" defaultValue={s.whatsapp} placeholder="5511900000000" className="input" /></label>
              <label className="field"><span>E-mail de contato</span><input name="contact_email" type="email" defaultValue={s.contact_email} className="input" /></label>
              <label className="field"><span>Instagram</span><input name="instagram" defaultValue={s.instagram} placeholder="@atelier" className="input" /></label>
            </div>
          </Panel>
          <Submit className="btn btn-blue">Salvar configurações</Submit>
        </ActionForm>

        <div className="space-y-5">
          <Panel title="Equipe">
            <ul>
              {(team ?? []).map((m) => (
                <li key={m.id} className="stitch-b flex items-center gap-3 py-3 text-sm">
                  <div className="min-w-0 flex-1"><p className="truncate font-bold">{m.full_name || m.email}</p><p className="truncate text-xs text-ink/55">{m.email} · desde {dateLong(m.created_at)}</p></div>
                  <span className={`badge ${m.role === "owner" ? "badge-ink" : m.role === "staff" ? "badge-lime" : "badge-stone"}`}>{ROLE[m.role]}</span>
                  {profile?.role === "owner" && m.role !== "owner" && m.id !== user?.id && (
                    <ActionForm action={setRole}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="role" value={m.role === "staff" ? "customer" : "staff"} /><Submit className="underline">{m.role === "staff" ? "Remover" : "Liberar acesso"}</Submit></ActionForm>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink/55">Novos membros criam a conta em /login; a proprietária libera o acesso ao painel aqui.</p>
          </Panel>
          <section className="glass-dark p-5">
            <p className="eyebrow text-lime">Carta do ateliê</p>
            <p className="figure mt-2 text-6xl">{subs ?? 0}</p>
            <p className="text-sm text-paper/70">assinantes da newsletter</p>
          </section>
        </div>
      </div>
    </>
  );
}

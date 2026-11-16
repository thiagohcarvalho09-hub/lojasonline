import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Mail, MessageCircle, Plus } from "lucide-react";
import { PageHead, Panel } from "@/components/admin/bits";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Empty } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { Supplier } from "@/lib/types";
import { deleteSupplier, saveSupplier } from "../actions";

export const metadata: Metadata = { title: "Fornecedores" };

/** Cadastro único de fornecedores: reaproveitado nas peças, com prazo e política de troca. */
export default async function Fornecedores({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: links }] = await Promise.all([
    supabase.from("suppliers").select("*").order("name"),
    supabase.from("product_suppliers").select("supplier_id"),
  ]);
  const suppliers = (data ?? []) as Supplier[];
  const pieces = new Map<string, number>();
  for (const l of links ?? []) if (l.supplier_id) pieces.set(l.supplier_id, (pieces.get(l.supplier_id) ?? 0) + 1);
  const editing = id ? suppliers.find((s) => s.id === id) ?? null : null;

  return (
    <>
      <PageHead eyebrow="Fornecedores / dropshipping" title="Quem envia.">
        <Link href="/admin/compras" className="btn btn-ghost h-11">Pedidos ao fornecedor</Link>
        {editing && <Link href="/admin/fornecedores" className="btn btn-blue h-11"><Plus className="h-5 w-5" /> Novo fornecedor</Link>}
      </PageHead>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {suppliers.map((s) => (
            <article key={s.id} className={`glass bevel p-5 ${s.is_active ? "" : "opacity-60"} ${editing?.id === s.id ? "ring-2 ring-blue" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="display text-2xl">{s.name}</h2>
                <span className={`badge ${s.is_active ? "badge-lime" : "badge-stone"}`}>{s.is_active ? "Ativo" : "Pausado"}</span>
              </div>
              {s.contact_name && <p className="mt-1 text-sm text-ink/70">{s.contact_name}</p>}
              <p className="mt-3 text-sm"><b>Prazo:</b> {s.lead_time_days} dias úteis · <b>{pieces.get(s.id) ?? 0}</b> peças</p>
              {s.return_policy && <p className="mt-1 text-sm text-ink/70"><b>Troca:</b> {s.return_policy}</p>}
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {s.website && <a href={s.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline"><ExternalLink className="h-3.5 w-3.5" /> Site</a>}
                {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-1 underline"><Mail className="h-3.5 w-3.5" /> {s.email}</a>}
                {s.whatsapp && <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>}
              </div>
              <div className="stitch-t mt-4 flex gap-4 pt-3 text-sm">
                <Link href={`/admin/fornecedores?id=${s.id}`} className="underline">Editar</Link>
                <ActionForm action={deleteSupplier} confirm={`Excluir o fornecedor ${s.name}? As peças ficam sem fornecedor.`}>
                  <input type="hidden" name="id" value={s.id} /><Submit className="text-rouge underline">Excluir</Submit>
                </ActionForm>
              </div>
            </article>
          ))}
          {!suppliers.length && <div className="sm:col-span-2"><Empty title="Nenhum fornecedor cadastrado." /></div>}
        </div>

        <Panel title={editing ? `Editar ${editing.name}` : "Novo fornecedor"} className="self-start">
          <ActionForm key={editing?.id ?? "novo"} action={saveSupplier} className="space-y-3">
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <label className="field"><span>Nome</span><input name="name" required defaultValue={editing?.name} className="input" /></label>
            <label className="field"><span>Contato (pessoa)</span><input name="contact_name" defaultValue={editing?.contact_name} className="input" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="field"><span>E-mail</span><input name="email" type="email" defaultValue={editing?.email} className="input" /></label>
              <label className="field"><span>WhatsApp</span><input name="whatsapp" inputMode="tel" defaultValue={editing?.whatsapp} placeholder="(11) 90000-0000" className="input" /></label>
            </div>
            <label className="field"><span>Site ou loja do fornecedor</span><input name="website" type="url" defaultValue={editing?.website} placeholder="https://" className="input" /></label>
            <label className="field"><span>Prazo de envio dele (dias úteis)</span><input name="lead_time_days" type="number" min={0} max={120} defaultValue={editing?.lead_time_days ?? 7} className="input tnum" /></label>
            <label className="field"><span>Política de troca e devolução</span><textarea name="return_policy" rows={2} defaultValue={editing?.return_policy} placeholder="Ex.: aceita troca em 7 dias; frete reverso por conta da loja" className="input" /></label>
            <label className="field"><span>Observações</span><textarea name="notes" rows={2} defaultValue={editing?.notes} className="input" /></label>
            <label className="field"><span>Situação</span>
              <select name="is_active" defaultValue={editing && !editing.is_active ? "off" : "on"} className="input"><option value="on">Ativo</option><option value="off">Pausado</option></select></label>
            <Submit className="btn btn-blue w-full">{editing ? "Salvar alterações" : "Cadastrar fornecedor"}</Submit>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}

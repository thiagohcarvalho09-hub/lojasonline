import type { Metadata } from "next";
import { PageHead, Panel } from "@/components/admin/bits";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { ProductImage } from "@/components/art";
import { createClient } from "@/lib/supabase/server";
import { deleteCategory, deleteCollection, saveCategory, saveCollection } from "../actions";
import type { Collection } from "@/lib/types";

export const metadata: Metadata = { title: "Coleções" };

function CollectionFields({ c }: { c?: Collection }) {
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <label className="field sm:col-span-3"><span>Nome</span><input name="name" required defaultValue={c?.name} className="input" /></label>
      <label className="field sm:col-span-2"><span>Temporada</span><input name="season" defaultValue={c?.season} placeholder="SS27" className="input" /></label>
      <label className="field"><span>Ordem</span><input name="position" type="number" defaultValue={c?.position ?? 0} className="input" /></label>
      <label className="field sm:col-span-6"><span>Texto editorial</span><textarea name="description" rows={2} defaultValue={c?.description} className="input" /></label>
      <label className="field sm:col-span-4"><span>Imagem de capa (URL, opcional)</span><input name="image_url" type="url" defaultValue={c?.image_url ?? ""} className="input" /></label>
      <label className="field sm:col-span-2"><span>Cor de fundo</span><input name="tone" type="color" defaultValue={c?.tone ?? "#cfcac0"} className="h-11 w-full cursor-pointer border border-ink bg-transparent p-1" /></label>
      <label className="flex items-center gap-2 sm:col-span-3"><input type="checkbox" name="is_active" defaultChecked={c?.is_active ?? true} className="h-4 w-4 accent-[#1546ff]" /> Visível na loja</label>
      <label className="flex items-center gap-2 sm:col-span-3"><input type="checkbox" name="is_featured" defaultChecked={c?.is_featured} className="h-4 w-4 accent-[#1546ff]" /> Coleção de capa</label>
    </div>
  );
}

export default async function Colecoes() {
  const supabase = await createClient();
  const [{ data: collections }, { data: categories }, { data: products }] = await Promise.all([
    supabase.from("collections").select("*").order("position"),
    supabase.from("categories").select("*").order("position"),
    supabase.from("products").select("id, collection_id, category_id, art, tone, images").order("wish_count", { ascending: false }),
  ]);
  return (
    <>
      <PageHead eyebrow="Coleções / editorial" title="Capítulos." />
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {(collections as Collection[] ?? []).map((c, i) => {
            const pieces = (products ?? []).filter((p) => p.collection_id === c.id);
            return (
              <details key={c.id} className="glass bevel group">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-4 [&::-webkit-details-marker]:hidden">
                  <div className="flex h-20 w-32 shrink-0 overflow-hidden" style={{ background: c.tone }}>
                    {pieces.slice(0, 2).map((p) => <ProductImage key={p.id} product={p} className="h-full w-1/2" />)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow text-ash">{c.season} · N° {String(i + 1).padStart(2, "0")}</p>
                    <p className="display truncate text-3xl">{c.name}</p>
                    <p className="text-sm text-ink/60">{pieces.length} peças</p>
                  </div>
                  {c.is_featured && <span className="badge badge-ink">Capa</span>}
                  <span className={`badge ${c.is_active ? "badge-lime" : "badge-stone"}`}>{c.is_active ? "No ar" : "Oculta"}</span>
                  <span className="serif text-2xl transition-transform group-open:rotate-90">→</span>
                </summary>
                <div className="stitch-t p-4">
                  <ActionForm action={saveCollection}><CollectionFields c={c} /><Submit className="btn btn-ink btn-sm mt-4">Salvar coleção</Submit></ActionForm>
                  <ActionForm action={deleteCollection} confirm={`Excluir a coleção “${c.name}”? As peças continuam no catálogo.`} className="mt-2">
                    <input type="hidden" name="id" value={c.id} /><Submit className="text-sm text-rouge underline">Excluir coleção</Submit>
                  </ActionForm>
                </div>
              </details>
            );
          })}
        </div>
        <div className="space-y-5">
          <Panel title="Nova coleção"><ActionForm action={saveCollection}><CollectionFields /><Submit className="btn btn-blue mt-4">Criar coleção</Submit></ActionForm></Panel>
          <Panel title="Categorias">
            <ul>
              {(categories ?? []).map((c) => (
                <li key={c.id} className="stitch-b flex items-center justify-between py-2">
                  <span>{c.name} <span className="tnum text-sm text-ink/50">· {(products ?? []).filter((p) => p.category_id === c.id).length}</span></span>
                  <ActionForm action={deleteCategory} confirm={`Excluir a categoria “${c.name}”?`}><input type="hidden" name="id" value={c.id} /><Submit className="text-sm text-ink/60 underline hover:text-rouge">Excluir</Submit></ActionForm>
                </li>
              ))}
            </ul>
            <ActionForm action={saveCategory} className="mt-4"><div className="flex gap-2"><input name="name" required placeholder="Nova categoria" aria-label="Nova categoria" className="input" /><Submit className="btn btn-ink">Adicionar</Submit></div></ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}

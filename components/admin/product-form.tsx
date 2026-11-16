"use client";
import { useState } from "react";
import Link from "next/link";
import { ExternalLink, ImagePlus, Link2, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { FULFILLMENT, type Fulfillment } from "@/lib/fulfillment";
import { ART_KEYS, ProductArt } from "@/components/art";
import { CareLabel } from "@/components/ui";
import { ActionForm, Submit } from "./action-form";
import { deleteProduct, saveProduct } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";

type Row = { id?: string; size: string; color: string; color_hex: string; sku: string; stock: number; supplier_sku: string; available: boolean };
type Opt = { id: string; name: string };

const TONES = ["#cfcac0", "#c9c5bd", "#c3c7cb", "#d6d0c4", "#bdb8b3", "#dcd8cf", "#2a2a2d"];
const money = (n: number | null | undefined) => (n == null ? "" : Number(n).toFixed(2).replace(".", ","));

export function ProductForm({ product, categories, collections, suppliers }: { product: Product | null; categories: Opt[]; collections: Opt[]; suppliers: Opt[] }) {
  const supplierSku = new Map((product?.admin_variants ?? []).map((v) => [v.id, v.variant_suppliers?.supplier_sku ?? ""]));
  const [rows, setRows] = useState<Row[]>(
    product?.product_variants?.map((v) => ({ id: v.id, size: v.size, color: v.color, color_hex: v.color_hex, sku: v.sku ?? "", stock: v.stock, supplier_sku: supplierSku.get(v.id) ?? "", available: v.available !== false }))
      ?? [{ size: "Único", color: "Preto", color_hex: "#0b0b0c", sku: "", stock: 0, supplier_sku: "", available: true }],
  );
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [art, setArt] = useState(product?.art ?? "blazer");
  const [tone, setTone] = useState(product?.tone ?? TONES[0]);
  const [material, setMaterial] = useState(product?.material ?? "");
  const [care, setCare] = useState(product?.care ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [mode, setMode] = useState<Fulfillment>(product?.fulfillment ?? "stock");
  const [supplierUrl, setSupplierUrl] = useState(product?.product_suppliers?.supplier_url ?? "");
  const [imageUrl, setImageUrl] = useState("");
  const onDemand = mode !== "stock";

  function addImageUrl() {
    const url = imageUrl.trim();
    if (!/^https:\/\/\S+$/i.test(url)) { setUploadError("Cole um link de imagem que comece com https://"); return; }
    setUploadError("");
    if (!images.includes(url)) setImages([...images, url]);
    setImageUrl("");
  }

  const patch = (i: number, p: Partial<Row>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...p } : r)));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) { setUploadError("Banco não conectado: não é possível enviar fotos."); return; }
    setUploading(true); setUploadError("");
    const supabase = createClient();
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, 6)) {
      if (file.size > 5 * 1024 * 1024) { setUploadError("Cada foto pode ter até 5 MB."); continue; }
      const path = `${crypto.randomUUID()}.${(file.name.split(".").pop() ?? "jpg").toLowerCase()}`;
      const { error } = await supabase.storage.from("produtos").upload(path, file, { cacheControl: "31536000", contentType: file.type });
      if (error) { setUploadError("Falha no envio: " + error.message); continue; }
      added.push(supabase.storage.from("produtos").getPublicUrl(path).data.publicUrl);
    }
    setImages((cur) => [...cur, ...added]);
    setUploading(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <ActionForm action={saveProduct} className="space-y-5">
        <input type="hidden" name="id" value={product?.id ?? ""} />
        <input type="hidden" name="variants" value={JSON.stringify(rows)} />
        <input type="hidden" name="images" value={JSON.stringify(images)} />
        <input type="hidden" name="art" value={art} />
        <input type="hidden" name="tone" value={tone} />

        <section className="glass bevel grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="display text-2xl sm:col-span-2">Identidade</h2>
          <label className="field sm:col-span-2"><span>Nome da peça</span><input name="name" required defaultValue={product?.name} className="input" /></label>
          <label className="field sm:col-span-2"><span>Descrição</span><textarea name="description" rows={4} defaultValue={product?.description} className="input" /></label>
          <label className="field"><span>Categoria</span>
            <select name="category_id" defaultValue={product?.category_id ?? ""} className="input"><option value="">Sem categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="field"><span>Coleção</span>
            <select name="collection_id" defaultValue={product?.collection_id ?? ""} className="input"><option value="">Sem coleção</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="field"><span>Endereço na loja (slug)</span><input name="slug" defaultValue={product?.slug} placeholder="gerado a partir do nome" className="input font-mono text-sm" /></label>
          <label className="field"><span>Tags (separadas por vírgula)</span><input name="tags" defaultValue={product?.tags.join(", ")} className="input" /></label>
        </section>

        <section className="glass bevel grid gap-4 p-5 sm:grid-cols-4">
          <h2 className="display text-2xl sm:col-span-4">Preço</h2>
          <label className="field"><span>Preço (R$)</span><input name="price" required inputMode="decimal" defaultValue={money(product?.price)} className="input tnum" /></label>
          <label className="field"><span>Preço “de”</span><input name="compare_at_price" inputMode="decimal" defaultValue={money(product?.compare_at_price)} className="input tnum" /></label>
          <label className="field"><span>Custo</span><input name="cost" inputMode="decimal" defaultValue={money(product?.product_costs?.cost)} className="input tnum" /></label>
          <label className="field"><span>SKU base</span><input name="sku" defaultValue={product?.sku ?? ""} className="input font-mono text-sm" /></label>
        </section>

        <section className="glass bevel grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="display text-2xl sm:col-span-2">Modelo de venda</h2>
          <input type="hidden" name="fulfillment" value={mode} />
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3" role="radiogroup" aria-label="Modelo de venda">
            {(Object.keys(FULFILLMENT) as Fulfillment[]).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)}
                className={`border p-3 text-left transition-colors ${mode === k ? "border-ink bg-ink text-paper" : "border-ink/40 bg-white/40 hover:border-ink"}`}>
                <span className="block font-bold">{FULFILLMENT[k].label}</span>
                <span className={`mt-1 block text-xs ${mode === k ? "text-paper/70" : "text-ink/60"}`}>{FULFILLMENT[k].hint}</span>
              </button>
            ))}
          </div>
          <label className="field"><span>Prazo extra de envio (dias úteis)</span>
            <input name="lead_time_days" type="number" min={0} max={120} defaultValue={product?.lead_time_days ?? (onDemand ? 7 : 0)} className="input tnum" /></label>
          <p className="self-end pb-3 text-xs text-ink/55">Aparece na página da peça como “Envio em até N dias úteis”. Use 0 para não mostrar.</p>
          {onDemand && <>
            <h3 className="eyebrow sm:col-span-2">Fornecedor <span className="font-normal normal-case tracking-normal text-ink/55">— só a equipe vê</span></h3>
            <label className="field"><span>Fornecedor</span>
              <select name="supplier_id" defaultValue={product?.product_suppliers?.supplier_id ?? ""} className="input">
                <option value="">{suppliers.length ? "Escolha o fornecedor" : "Nenhum fornecedor cadastrado"}</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <Link href="/admin/fornecedores" target="_blank" className="mt-1 text-xs underline">Cadastrar ou editar fornecedores</Link></label>
            <label className="field"><span>Código geral da peça no fornecedor</span><input name="supplier_sku" defaultValue={product?.product_suppliers?.supplier_sku} className="input font-mono text-sm" /></label>
            <label className="field sm:col-span-2"><span>Link da peça no fornecedor</span>
              <div className="flex gap-2"><input name="supplier_url" type="url" value={supplierUrl} onChange={(e) => setSupplierUrl(e.target.value)} placeholder="https://" className="input flex-1" />
                {/^https?:\/\//.test(supplierUrl) && <a href={supplierUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm self-center" aria-label="Abrir link do fornecedor"><ExternalLink className="h-4 w-4" /></a>}</div></label>
            <label className="field sm:col-span-2"><span>Observações para o pedido ao fornecedor</span><textarea name="supplier_notes" rows={2} defaultValue={product?.product_suppliers?.notes} className="input" /></label>
          </>}
        </section>

        <section className="glass bevel p-5">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="display text-2xl">Grade — tamanhos e cores</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRows([...rows, { ...(rows.at(-1) ?? { color: "Preto", color_hex: "#0b0b0c" }), id: undefined, size: "", sku: "", stock: 0, supplier_sku: "", available: true } as Row])}><Plus className="h-4 w-4" /> Variação</button>
          </div>
          <div className="scroll-x">
            <table className="table">
              <thead><tr><th>Tamanho</th><th>Cor</th><th>Tom</th><th>SKU</th>{onDemand && <th>Cód. fornecedor</th>}<th>Estoque</th><th title="Desmarque quando o tamanho/cor acabar (ex.: esgotou no fornecedor). Some da vitrine e o checkout recusa.">Disponível</th><th /></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id ?? `n${i}`}>
                    <td><input value={r.size} onChange={(e) => patch(i, { size: e.target.value })} aria-label="Tamanho" className="input h-9 w-20" /></td>
                    <td><input value={r.color} onChange={(e) => patch(i, { color: e.target.value })} aria-label="Cor" className="input h-9 w-28" /></td>
                    <td><input type="color" value={r.color_hex} onChange={(e) => patch(i, { color_hex: e.target.value })} aria-label="Tom da cor" className="h-9 w-10 cursor-pointer border border-ink bg-transparent p-0.5" /></td>
                    <td><input value={r.sku} onChange={(e) => patch(i, { sku: e.target.value })} aria-label="SKU" className="input h-9 w-40 font-mono text-xs" /></td>
                    {onDemand && <td><input value={r.supplier_sku} onChange={(e) => patch(i, { supplier_sku: e.target.value })} aria-label="Código no fornecedor" placeholder="cód. deste tamanho/cor" className="input h-9 w-40 font-mono text-xs" /></td>}
                    <td>{onDemand
                      ? <span className="text-xs text-ink/55" title="Esta peça vende sem estoque">Não controla</span>
                      : r.id
                      ? <span className="tnum font-bold" title="Ajuste pela tela de Estoque">{r.stock} un.</span>
                      : <input type="number" min={0} value={r.stock} onChange={(e) => patch(i, { stock: Number(e.target.value) })} aria-label="Estoque inicial" className="input h-9 w-20" />}</td>
                    <td className="text-center"><input type="checkbox" checked={r.available} onChange={(e) => patch(i, { available: e.target.checked })} aria-label={`${r.size} ${r.color} disponível`} className="h-5 w-5 accent-[#1546ff]" /></td>
                    <td><button type="button" onClick={() => setRows(rows.filter((_, k) => k !== i))} aria-label="Remover variação" disabled={rows.length === 1} className="disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-ink/55">{onDemand ? "Peças em dropshipping ou sob encomenda vendem sem estoque: o estoque não é conferido nem baixado nas vendas. Quando um tamanho esgotar no fornecedor, desmarque “Disponível”: ele some da vitrine. " : "Desmarque “Disponível” para tirar um tamanho/cor da vitrine sem apagá-lo. "}O estoque de variações já salvas é movimentado em <Link href="/admin/estoque" className="underline">Estoque</Link>, para manter o histórico de entradas e saídas.</p>
        </section>

        <section className="glass bevel grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="display text-2xl sm:col-span-2">Etiqueta</h2>
          <label className="field"><span>Composição</span><input name="material" value={material} onChange={(e) => setMaterial(e.target.value)} className="input" /></label>
          <label className="field"><span>Cuidados</span><input name="care" value={care} onChange={(e) => setCare(e.target.value)} className="input" /></label>
          <label className="field"><span>Status</span>
            <select name="status" defaultValue={product?.status ?? "active"} className="input"><option value="active">Ativo — visível na loja</option><option value="draft">Rascunho</option><option value="archived">Arquivado</option></select></label>
          <label className="flex items-center gap-3 self-end pb-3"><input type="checkbox" name="is_featured" defaultChecked={product?.is_featured} className="h-5 w-5 accent-[#1546ff]" /> Destacar na vitrine</label>
        </section>

        <div className="flex gap-3"><Submit className="btn btn-blue">{product ? "Salvar alterações" : "Criar peça"}</Submit><Link href="/admin/produtos" className="btn btn-ghost">Cancelar</Link></div>
      </ActionForm>

      <div className="space-y-5">
        <section className="glass bevel p-5">
          <h2 className="display text-2xl">Imagens</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {images.map((src) => (
              <div key={src} className="group relative aspect-[4/5] overflow-hidden bg-stone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((s) => s !== src))} aria-label="Remover foto" className="glass absolute right-1 top-1 grid h-7 w-7 place-items-center"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <label className="stitch grid aspect-[4/5] cursor-pointer place-items-center bg-white/40 text-center text-xs hover:bg-white/70">
              <span><ImagePlus className="mx-auto mb-1 h-6 w-6" strokeWidth={1.3} />{uploading ? "Enviando…" : "Enviar fotos"}</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={uploading} />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }}
              placeholder="Ou cole o link de uma foto (ex.: do fornecedor)" aria-label="Link da foto" className="input h-10 flex-1 text-sm" />
            <button type="button" onClick={addImageUrl} className="btn btn-ghost btn-sm"><Link2 className="h-4 w-4" /> Adicionar</button>
          </div>
          {uploadError && <p role="alert" className="mt-2 text-sm font-bold text-rouge">{uploadError}</p>}
          <p className="mt-2 text-xs text-ink/55">Lembre de salvar a peça depois de enviar. Sem fotos, a loja usa a ilustração de estúdio abaixo.</p>
        </section>

        <section className="glass bevel p-5">
          <h2 className="display text-2xl">Ilustração de estúdio</h2>
          <div className="mt-3 grid grid-cols-[9rem_1fr] gap-4">
            <ProductArt art={art} tone={tone} color={rows[0]?.color_hex} className="aspect-[4/5] w-full" />
            <div>
              <p className="eyebrow mb-2">Silhueta</p>
              <div className="flex flex-wrap gap-1">
                {ART_KEYS.map((k) => <button key={k} type="button" onClick={() => setArt(k)} aria-pressed={art === k} className={`border px-2 py-1 text-xs ${art === k ? "border-ink bg-ink text-paper" : "border-ink/40 bg-white/40"}`}>{k}</button>)}
              </div>
              <p className="eyebrow mb-2 mt-4">Fundo</p>
              <div className="flex gap-1.5">
                {TONES.map((t) => <button key={t} type="button" onClick={() => setTone(t)} aria-label={`Fundo ${t}`} aria-pressed={tone === t} className={`h-7 w-7 border-2 ${tone === t ? "border-blue" : "border-ink/30"}`} style={{ background: t }} />)}
              </div>
            </div>
          </div>
        </section>

        <CareLabel material={material} care={care} sku={product?.sku} />

        {product && (
          <ActionForm action={deleteProduct} confirm={`Excluir “${product.name}” definitivamente?`} className="stitch p-5">
            <input type="hidden" name="id" value={product.id} />
            <p className="text-sm text-ink/70">Excluir remove a peça e sua grade. Pedidos antigos mantêm o registro do item.</p>
            <Submit className="btn btn-sm mt-3 border border-rouge text-rouge hover:bg-rouge hover:text-paper">Excluir peça</Submit>
          </ActionForm>
        )}
      </div>
    </div>
  );
}

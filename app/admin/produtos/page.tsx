import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHead, Tabs } from "@/components/admin/bits";
import { ProductImage } from "@/components/art";
import { Empty } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_PRODUCT_SELECT } from "@/lib/shop";
import { brl } from "@/lib/format";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Produtos" };
const LABEL: Record<string, string> = { active: "Ativo", draft: "Rascunho", archived: "Arquivado" };

export default async function Produtos({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const f = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("products").select(ADMIN_PRODUCT_SELECT).order("created_at", { ascending: false });
  if (f.status) query = query.eq("status", f.status);
  if (f.q) query = query.ilike("name", `%${f.q.replace(/[%_,()]/g, " ").trim()}%`);
  const { data } = await query;
  const products = (data ?? []) as unknown as Product[];

  return (
    <>
      <PageHead eyebrow="Produtos / catálogo" title="O acervo.">
        <form className="flex gap-2"><input name="q" defaultValue={f.q} placeholder="Buscar peça" aria-label="Buscar peça" className="input h-11 w-52" /></form>
        <Link href="/admin/produtos/novo" className="btn btn-blue h-11"><Plus className="h-5 w-5" /> Novo produto</Link>
      </PageHead>
      <Tabs current={f.status ?? "all"} items={[{ key: "all", label: "Todos", href: "/admin/produtos" }, ...Object.entries(LABEL).map(([k, l]) => ({ key: k, label: l, href: `/admin/produtos?status=${k}` }))]} />
      {products.length ? (
        <div className="scroll-x mt-4">
          <table className="table">
            <thead><tr><th colSpan={2}>Peça</th><th>Categoria</th><th>Coleção</th><th className="text-right">Preço</th><th className="text-right">Margem</th><th className="text-right">Estoque</th><th>Variações</th><th>Status</th></tr></thead>
            <tbody>
              {products.map((p) => {
                const stock = (p.product_variants ?? []).reduce((a, v) => a + v.stock, 0);
                const cost = Number(p.product_costs?.cost ?? 0);
                const margin = cost && p.price > 0 ? Math.round((1 - cost / p.price) * 100) : null;
                return (
                  <tr key={p.id}>
                    <td className="w-14"><Link href={`/admin/produtos/${p.id}`} className="block h-16 w-13 overflow-hidden"><ProductImage product={p} className="h-full w-full" /></Link></td>
                    <td><Link href={`/admin/produtos/${p.id}`} className="font-bold hover:text-blue">{p.name}</Link><p className="font-mono text-xs text-ink/50">{p.sku}</p></td>
                    <td>{p.categories?.name ?? "—"}</td>
                    <td>{p.collections?.name ?? "—"}</td>
                    <td className="tnum text-right">{brl(p.price)}</td>
                    <td className="tnum text-right">{margin !== null ? `${margin}%` : "—"}</td>
                    <td className="tnum text-right font-bold">{stock === 0 ? <span className="badge badge-red">Esgotado</span> : stock}</td>
                    <td className="tnum">{p.product_variants?.length ?? 0}</td>
                    <td><span className={`badge ${p.status === "active" ? "badge-lime" : "badge-stone"}`}>{LABEL[p.status]}</span>{p.is_featured && <span className="badge badge-ink ml-1">Destaque</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="mt-4"><Empty title="Nenhuma peça cadastrada."><Link href="/admin/produtos/novo" className="btn btn-ink mt-2">Cadastrar a primeira</Link></Empty></div>}
    </>
  );
}

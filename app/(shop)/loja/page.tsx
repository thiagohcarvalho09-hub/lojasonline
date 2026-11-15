import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/shop/product-card";
import { Empty } from "@/components/ui";
import { getCatalog, getCategories, getCollections, type CatalogFilters } from "@/lib/shop";

export const metadata: Metadata = { title: "Loja" };

const SIZES = ["PP", "P", "M", "G", "GG", "34", "36", "38", "40", "42", "Único"];
const ORDER = [["", "Novidades"], ["desejados", "Mais desejados"], ["menor", "Menor preço"], ["maior", "Maior preço"]];

export default async function Loja({ searchParams }: { searchParams: Promise<CatalogFilters> }) {
  const f = await searchParams;
  const [products, categories, collections] = await Promise.all([getCatalog(f), getCategories(), getCollections()]);
  const href = (patch: Partial<CatalogFilters>) => {
    const next = { ...f, ...patch } as Record<string, string | undefined>;
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return qs ? `/loja?${qs}` : "/loja";
  };
  const chip = (on: boolean) => `inline-flex h-9 items-center border px-3 text-sm transition-colors ${on ? "border-ink bg-ink text-paper" : "border-ink/50 bg-white/40 hover:border-ink"}`;
  const active = categories.find((c) => c.slug === f.categoria)?.name ?? collections.find((c) => c.slug === f.colecao)?.name;

  return (
    <div className="pt-8 md:pt-12">
      <p className="eyebrow">Loja {f.q ? `/ busca “${f.q}”` : active ? `/ ${active}` : "/ todas as peças"}</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="serif text-[clamp(3rem,8vw,6.5rem)]">{f.promo ? "Sale." : active ? `${active}.` : "O guarda-roupa."}</h1>
        <p className="tnum pb-3 text-sm">{products.length} {products.length === 1 ? "peça" : "peças"}</p>
      </div>

      <div className="glass sticky top-[4.6rem] z-30 mt-6 space-y-3 p-4 max-lg:top-[7rem]">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="eyebrow mr-2 shrink-0">Categoria</span>
          <Link href={href({ categoria: undefined })} className={chip(!f.categoria)}>Todas</Link>
          {categories.map((c) => <Link key={c.slug} href={href({ categoria: c.slug })} className={`${chip(f.categoria === c.slug)} shrink-0`}>{c.name}</Link>)}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
            <span className="eyebrow mr-2 shrink-0">Tamanho</span>
            {SIZES.map((s) => <Link key={s} href={href({ tamanho: f.tamanho === s ? undefined : s })} className={`${chip(f.tamanho === s)} min-w-9 shrink-0 justify-center px-2`}>{s}</Link>)}
          </div>
          <div className="flex items-center gap-2">
            <span className="eyebrow mr-2">Ordenar</span>
            {ORDER.map(([k, l]) => <Link key={k} href={href({ ordem: k || undefined })} className={chip((f.ordem ?? "") === k)}>{l}</Link>)}
          </div>
          {Object.values(f).some(Boolean) && <Link href="/loja" className="link ml-auto">Limpar filtros</Link>}
        </div>
      </div>

      <div className="mt-8">
        {products.length ? <ProductGrid products={products} /> : <Empty title="Nenhuma peça por aqui.">Tente remover algum filtro ou buscar por outro termo.</Empty>}
      </div>
    </div>
  );
}

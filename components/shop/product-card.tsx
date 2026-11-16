import Link from "next/link";
import type { Product } from "@/lib/types";
import { brl } from "@/lib/format";
import { availableOf, isNew, stockOf } from "@/lib/shop";
import { sellsWithoutStock } from "@/lib/fulfillment";
import { ProductImage } from "@/components/art";
import { WishButton } from "./wish-button";

export function ProductCard({ product: p, index }: { product: Product; index?: number }) {
  const stock = stockOf(p);
  const soldOut = !availableOf(p);
  const colors = [...new Map((p.product_variants ?? []).map((v) => [v.color, v.color_hex])).entries()];
  const off = p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
  return (
    <article className="group relative">
      <Link href={`/produto/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-stone" aria-label={p.name}>
        <ProductImage product={p} className={`h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06] ${soldOut ? "opacity-60 grayscale" : ""}`} />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute left-0 top-3 flex flex-col items-start gap-1">
          {soldOut ? <span className="badge badge-ink">Esgotado</span>
            : <>
              {off > 0 && <span className="badge badge-lime tnum">−{off}%</span>}
              {isNew(p) && <span className="badge badge-ink">Novo</span>}
              {p.fulfillment === "preorder" && <span className="badge glass-thin">Sob encomenda</span>}
              {!sellsWithoutStock(p) && stock <= 3 && <span className="badge glass-thin">Últimas {stock}</span>}
            </>}
        </div>
        {index !== undefined && <span className="serif absolute bottom-2 left-3 text-xl text-ink/70">N° {String(index + 1).padStart(2, "0")}</span>}
        <span className="glass absolute inset-x-3 bottom-3 translate-y-4 py-2.5 text-center text-sm font-bold opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
          Ver peça →
        </span>
      </Link>
      <div className="absolute right-2 top-2"><WishButton productId={p.id} /></div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[1.05rem] leading-tight"><Link href={`/produto/${p.slug}`}>{p.name}</Link></h3>
          <p className="mt-0.5 text-sm text-ink/60">{p.categories?.name ?? p.collections?.name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="tnum font-bold">{brl(p.price)}</p>
          {off > 0 && <p className="tnum text-xs text-ink/50 line-through">{brl(p.compare_at_price)}</p>}
        </div>
      </div>
      <div className="mt-2 flex gap-1.5" aria-label="Cores disponíveis">
        {colors.slice(0, 5).map(([name, hex]) => <span key={name} title={name} className="h-3 w-3 rounded-full ring-1 ring-ink/40 ring-offset-1 ring-offset-paper" style={{ background: hex }} />)}
      </div>
    </article>
  );
}

export function ProductGrid({ products, numbered = false }: { products: Product[]; numbered?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 min-[1700px]:grid-cols-5 min-[2100px]:grid-cols-6">
      {products.map((p, i) => <ProductCard key={p.id} product={p} index={numbered ? i : undefined} />)}
    </div>
  );
}

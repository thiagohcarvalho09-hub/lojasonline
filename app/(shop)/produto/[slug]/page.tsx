import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { ProductView } from "@/components/shop/product-view";
import { ProductGrid } from "@/components/shop/product-card";
import { ReviewForm } from "@/components/shop/review-form";
import { CareLabel, SectionHead } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCatalog, getSettings, PRODUCT_SELECT } from "@/lib/shop";
import { dateLong } from "@/lib/format";
import type { Product } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("status", "active").maybeSingle();
  return { supabase, product: data as unknown as Product | null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await load((await params).slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: Props) {
  const { supabase, product } = await load((await params).slug);
  if (!product) notFound();
  const [settings, { data: reviews }, related] = await Promise.all([
    getSettings(),
    supabase.from("reviews").select("id, author, rating, comment, created_at").eq("product_id", product.id).eq("approved", true).order("created_at", { ascending: false }),
    getCatalog({ categoria: product.categories?.slug }, 5),
  ]);
  const avg = reviews?.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <div className="pt-6 md:pt-10">
      <nav className="eyebrow mb-6 text-ash" aria-label="Trilha">
        <Link href="/loja" className="hover:text-ink">Loja</Link> / {product.categories && <Link href={`/loja?categoria=${product.categories.slug}`} className="hover:text-ink">{product.categories.name}</Link>} / <span className="text-ink">{product.name}</span>
      </nav>
      <ProductView product={product} freeOver={settings.free_shipping_over} />

      <section className="mt-20 grid gap-10 border-t border-ink pt-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="display text-4xl">Ficha da peça</h2>
          <div className="mt-5"><CareLabel material={product.material} care={product.care} sku={product.sku} /></div>
        </div>
        <div>
          <div className="flex items-end justify-between">
            <h2 className="display text-4xl">Avaliações</h2>
            {avg > 0 && <p className="flex items-center gap-2"><span className="figure text-3xl">{avg.toFixed(1).replace(".", ",")}</span><Star className="h-5 w-5 fill-ink" /><span className="text-sm text-ink/60">({reviews!.length})</span></p>}
          </div>
          <ul className="mt-4">
            {(reviews ?? []).map((r) => (
              <li key={r.id} className="stitch-b py-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{r.author}</p>
                  <p className="flex" aria-label={`${r.rating} de 5`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-ink" : "opacity-30"}`} />)}</p>
                </div>
                <p className="serif mt-1 text-2xl leading-snug">“{r.comment}”</p>
                <p className="mt-1 text-xs text-ink/50">{dateLong(r.created_at)}</p>
              </li>
            ))}
            {!reviews?.length && <li className="py-4 text-ink/60">Esta peça ainda não tem avaliações. Seja a primeira.</li>}
          </ul>
          <div className="mt-6"><ReviewForm productId={product.id} /></div>
        </div>
      </section>

      <section className="mt-20">
        <SectionHead eyebrow="Combina com" title="Complete o look" />
        <div className="rule mb-6" />
        <ProductGrid products={related.filter((r) => r.id !== product.id).slice(0, 4)} />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/art";
import { getCatalog, getCollections } from "@/lib/shop";

export const metadata: Metadata = { title: "Coleções" };

export default async function Colecoes() {
  const [collections, products] = await Promise.all([getCollections(), getCatalog({ ordem: "desejados" }, 100)]);
  return (
    <div className="pt-8 md:pt-12">
      <p className="eyebrow">Editorial / coleções</p>
      <h1 className="serif text-[clamp(3rem,8vw,6.5rem)]">Capítulos.</h1>
      <div className="mt-8 space-y-6">
        {collections.map((c, i) => {
          const pieces = products.filter((p) => p.collections?.slug === c.slug);
          return (
            <Link key={c.id} href={`/colecoes/${c.slug}`} className="group relative grid overflow-hidden md:grid-cols-[1fr_1.2fr]" style={{ background: c.tone }}>
              <div className="relative z-10 flex flex-col justify-between p-8 md:p-12">
                <p className="eyebrow">{c.season} · Capítulo {String(i + 1).padStart(2, "0")}</p>
                <div>
                  <h2 className="display mt-10 text-[clamp(3.2rem,7vw,6.5rem)]">{c.name}</h2>
                  <p className="serif mt-3 max-w-md text-2xl">{c.description}</p>
                  <span className="link mt-6">Ver {pieces.length} peças →</span>
                </div>
              </div>
              <div className="grid min-h-72 grid-cols-3">
                {pieces.slice(0, 3).map((p) => <ProductImage key={p.id} product={p} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

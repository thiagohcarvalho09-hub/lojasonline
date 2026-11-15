import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/shop/product-card";
import { Empty, Marquee } from "@/components/ui";
import { getCatalog, getCollections } from "@/lib/shop";

export default async function Colecao({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [collections, products] = await Promise.all([getCollections(), getCatalog({ colecao: slug })]);
  const c = collections.find((x) => x.slug === slug);
  if (!c) notFound();
  return (
    <div className="pt-8 md:pt-12">
      <p className="eyebrow">Coleção / {c.season}</p>
      <h1 className="display text-[clamp(4rem,12vw,10rem)]">{c.name}</h1>
      <p className="serif mt-2 max-w-3xl text-[clamp(1.6rem,3vw,2.6rem)]">{c.description}</p>
      <Marquee className="eyebrow -mx-4 my-8 border-y border-ink py-2 md:-mx-8" items={[c.name, c.season, `${products.length} peças`]} />
      {products.length ? <ProductGrid products={products} numbered /> : <Empty title="Coleção em preparação." />}
    </div>
  );
}

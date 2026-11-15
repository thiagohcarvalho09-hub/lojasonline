import Link from "next/link";
import { ArrowRight, Gem, RefreshCcw, Truck } from "lucide-react";
import { ProductArt, ProductImage } from "@/components/art";
import { ChromeBlob, Marquee, SectionHead } from "@/components/ui";
import { ProductCard, ProductGrid } from "@/components/shop/product-card";
import { getCatalog, getCategories, getCollections, getSettings } from "@/lib/shop";
import { brl } from "@/lib/format";

export default async function Home() {
  const [settings, wanted, latest, collections, categories] = await Promise.all([
    getSettings(), getCatalog({ ordem: "desejados" }, 8), getCatalog({}, 8), getCollections(), getCategories(),
  ]);
  const hero = wanted[0];
  const second = wanted[1];
  const lead = collections.find((c) => c.is_featured) ?? collections[0];

  return (
    <>
      {/* ───── Abertura ───── */}
      <section className="pt-8 md:pt-12">
        <p className="eyebrow">{settings.tagline} / {settings.season}</p>
        <h1 className="serif rise mt-1 text-[clamp(3.4rem,10vw,8.5rem)]">O próximo movimento.</h1>

        <div className="relative mt-6 grid min-h-[30rem] overflow-hidden bg-stone md:grid-cols-[1.05fr_1fr]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_10%,rgba(255,255,255,.75),transparent_55%)]" />
          <div className="relative z-10 flex flex-col justify-center p-8 md:p-14">
            <h2 className="display text-[clamp(4rem,9vw,8rem)]">{settings.hero_title}</h2>
            <p className="serif mt-2 text-[clamp(1.8rem,3.4vw,3rem)]">{settings.hero_subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={lead ? `/colecoes/${lead.slug}` : "/loja"} className="btn btn-ink">Ver coleção <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/loja" className="link">Todas as peças <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="relative min-h-[22rem]">
            {hero && <ProductImage product={hero} className="absolute inset-0 h-full w-full" />}
            {second && (
              <Link href={`/produto/${second.slug}`} className="glass bevel sheen absolute bottom-6 left-4 hidden w-40 p-2 sm:block md:-left-12" style={{ animation: "var(--animate-float)" }}>
                <ProductArt art={second.art} tone={second.tone} className="aspect-[4/5] w-full" />
                <p className="mt-2 truncate text-sm font-bold">{second.name}</p>
                <p className="tnum text-sm">{brl(second.price)}</p>
              </Link>
            )}
            {hero && (
              <Link href={`/produto/${hero.slug}`} className="glass hangtag absolute right-4 top-6 py-2.5 pr-4 text-sm">
                <span className="eyebrow block text-[.6rem]">Look N° 01</span>
                <span className="font-bold">{hero.name}</span> · <span className="tnum">{brl(hero.price)}</span>
              </Link>
            )}
            <ChromeBlob className="absolute -bottom-4 right-6 w-40 drop-shadow-[0_18px_18px_rgba(0,0,0,.35)] md:w-56" />
          </div>
        </div>
      </section>

      <Marquee className="display -mx-4 mt-10 border-y border-ink py-3 text-3xl md:-mx-8" items={[settings.hero_title, settings.season, "Alfaiataria", "Metal líquido", "Couro estruturado"]} />

      {/* ───── Mais desejados ───── */}
      <section className="mt-16">
        <SectionHead eyebrow="Ranking da semana" title="Mais desejados" action={<Link href="/loja?ordem=desejados" className="link">Ver ranking completo <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="rule mb-6" />
        <ProductGrid products={wanted.slice(0, 4)} numbered />
      </section>

      {/* ───── Coleções ───── */}
      <section className="mt-24">
        <SectionHead eyebrow="Editorial" title="Coleções" action={<Link href="/colecoes" className="link">Todas as coleções <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-4 md:grid-cols-12">
          {collections.slice(0, 3).map((c, i) => {
            const piece = [...wanted, ...latest].find((p) => p.collections?.slug === c.slug);
            return (
              <Link key={c.id} href={`/colecoes/${c.slug}`} className={`group relative block min-h-[26rem] overflow-hidden ${i === 0 ? "md:col-span-6" : "md:col-span-3"}`} style={{ background: c.tone }}>
                {c.image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  : piece && <ProductImage product={piece} className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105" />}
                <div className="glass absolute inset-x-4 bottom-4 p-5">
                  <p className="eyebrow">{c.season} · N° {String(i + 1).padStart(2, "0")}</p>
                  <h3 className="display mt-1 text-4xl">{c.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ink/70">{c.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───── Categorias ───── */}
      <section className="mt-24">
        <div className="rule" />
        <ul>
          {categories.map((c, i) => (
            <li key={c.slug} className="rule">
              <Link href={`/loja?categoria=${c.slug}`} className="group flex items-baseline justify-between py-3 transition-colors hover:bg-ink hover:px-4 hover:text-paper">
                <span className="display text-[clamp(2.2rem,6vw,4.5rem)]">{c.name}</span>
                <span className="serif text-2xl opacity-50 group-hover:opacity-100">{String(i + 1).padStart(2, "0")} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───── Novidades ───── */}
      <section className="mt-24">
        <SectionHead eyebrow="Acabou de chegar" title="Novidades" action={<Link href="/loja" className="link">Ver tudo <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="rule mb-6" />
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0">
          {latest.slice(0, 4).map((p) => <div key={p.id} className="w-[62vw] shrink-0 snap-start md:w-auto"><ProductCard product={p} /></div>)}
        </div>
      </section>

      {/* ───── Serviços ───── */}
      <section className="mt-24 grid gap-4 md:grid-cols-3">
        {[
          { icon: Truck, t: "Frete grátis", d: `Em compras acima de ${brl(settings.free_shipping_over)} para todo o Brasil.` },
          { icon: RefreshCcw, t: "Troca em 30 dias", d: "Não serviu? A primeira troca é por nossa conta." },
          { icon: Gem, t: "Feito em pequenas séries", d: "Cada peça é numerada e acompanha etiqueta de origem." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="glass bevel p-7">
            <Icon className="h-6 w-6" strokeWidth={1.4} />
            <h3 className="display mt-5 text-3xl">{t}</h3>
            <p className="mt-2 text-sm text-ink/70">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}

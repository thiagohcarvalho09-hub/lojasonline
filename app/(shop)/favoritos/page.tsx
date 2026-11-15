"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/shop/cart";
import { ProductImage } from "@/components/art";
import { WishButton } from "@/components/shop/wish-button";
import { brl } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function Favoritos() {
  const { wishes, ready } = useCart();
  const [loaded, setLoaded] = useState<Product[] | null>(null);
  const key = wishes.join(",");
  useEffect(() => {
    if (!ready || !key) return;
    let live = true;
    fetch(`/api/products?ids=${key}`).then((r) => r.json()).then((d) => live && setLoaded(d.products ?? []));
    return () => { live = false; };
  }, [key, ready]);
  const products = (loaded ?? []).filter((p) => wishes.includes(p.id));
  const waiting = !ready || (key !== "" && loaded === null);

  return (
    <div className="pt-8 md:pt-12">
      <p className="eyebrow">Lista de desejos</p>
      <h1 className="serif text-[clamp(3rem,8vw,6.5rem)]">Guardadas para depois.</h1>
      <div className="rule mt-6" />
      {waiting ? <p className="py-16 text-ink/60">Carregando…</p> : products.length === 0 ? (
        <div className="py-16"><p className="serif text-3xl text-ink/60">Nenhuma peça guardada ainda.</p><Link href="/loja" className="btn btn-ink mt-6">Explorar a loja</Link></div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {products.map((p) => (
            <article key={p.id} className="relative">
              <Link href={`/produto/${p.slug}`} className="block aspect-[4/5] overflow-hidden"><ProductImage product={p} className="h-full w-full" /></Link>
              <div className="absolute right-2 top-2"><WishButton productId={p.id} /></div>
              <h3 className="mt-3 truncate">{p.name}</h3>
              <p className="tnum font-bold">{brl(p.price)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

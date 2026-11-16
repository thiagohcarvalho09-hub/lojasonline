"use client";
import { useMemo, useState } from "react";
import { Check, Clock, Ruler, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "@/lib/types";
import { brl } from "@/lib/format";
import { leadTimeText, sellable, sellsWithoutStock } from "@/lib/fulfillment";
import { ProductArt } from "@/components/art";
import { QtyStepper, useCart } from "./cart";
import { WishButton } from "./wish-button";

export function ProductView({ product: p, freeOver }: { product: Product; freeOver: number }) {
  const variants = useMemo(() => p.product_variants ?? [], [p.product_variants]);
  const colors = useMemo(() => [...new Map(variants.map((v) => [v.color, v.color_hex])).entries()], [variants]);
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))], [variants]);
  const onDemand = sellsWithoutStock(p);
  const firstAvailable = variants.find((v) => sellable(p, v.stock) > 0) ?? variants[0];
  const [color, setColor] = useState(firstAvailable?.color ?? "");
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : "");
  const [qty, setQty] = useState(1);
  const [shot, setShot] = useState(0);
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  const variant = variants.find((v) => v.color === color && v.size === size);
  const price = Number(variant?.price_override ?? p.price);
  const hex = colors.find(([c]) => c === color)?.[1] ?? "#0b0b0c";
  const stockFor = (s: string) => sellable(p, variants.find((v) => v.color === color && v.size === s)?.stock ?? 0);
  const canBuy = variant ? sellable(p, variant.stock) : 0;
  const lead = leadTimeText(p);
  const off = p.compare_at_price && p.compare_at_price > price ? Math.round((1 - price / p.compare_at_price) * 100) : 0;
  const shots = p.images.length ? p.images : ["art", "art-detail"];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      {/* Galeria */}
      <div className="grid gap-3 md:grid-cols-[5rem_1fr]">
        <div className="no-scrollbar order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col">
          {shots.map((s, i) => (
            <button key={i} onClick={() => setShot(i)} aria-label={`Imagem ${i + 1}`} className={`h-24 w-20 shrink-0 overflow-hidden border-2 ${shot === i ? "border-ink" : "border-transparent opacity-70"}`}>
              {s.startsWith("art")
                ? <ProductArt art={p.art} tone={i ? "#e4e0d7" : p.tone} color={hex} className="h-full w-full" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={s} alt="" className="h-full w-full object-cover" />}
            </button>
          ))}
        </div>
        <div className="relative order-1 aspect-[4/5] overflow-hidden bg-stone md:order-2">
          {shots[shot]?.startsWith("art")
            ? <ProductArt art={p.art} tone={shot ? "#e4e0d7" : p.tone} color={hex} className={`h-full w-full transition-transform duration-700 ${shot ? "scale-[1.6]" : ""}`} />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={shots[shot]} alt={p.name} className="h-full w-full object-cover" />}
          <span className="glass hangtag absolute left-4 top-4 py-2 pr-4 text-sm">
            <span className="eyebrow block text-[.6rem]">{p.collections?.season ?? "Atelier"}</span>
            <span className="font-bold">{p.collections?.name ?? p.categories?.name}</span>
          </span>
          <span className="serif absolute bottom-3 right-4 text-2xl text-ink/60">{String(shot + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Compra */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow text-ash">{p.categories?.name} {p.sku && `· ${p.sku}`}</p>
        <h1 className="display mt-2 text-[clamp(2.8rem,5vw,4.6rem)]">{p.name}</h1>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="figure text-5xl">{brl(price)}</span>
          {off > 0 && <><span className="tnum text-lg text-ink/50 line-through">{brl(p.compare_at_price)}</span><span className="badge badge-lime tnum">−{off}%</span></>}
        </div>
        <p className="mt-1 text-sm text-ink/60">ou 6× de {brl(price / 6)} sem juros · 5% off no Pix</p>
        <p className="stitch-t mt-6 pt-6 leading-relaxed text-ink/80">{p.description}</p>

        {colors.length > 0 && (
          <fieldset className="mt-6">
            <legend className="eyebrow mb-2">Cor — <span className="font-normal normal-case tracking-normal">{color}</span></legend>
            <div className="flex gap-2">
              {colors.map(([c, h]) => (
                <button key={c} type="button" onClick={() => { setColor(c); setAdded(false); }} aria-label={c} aria-pressed={c === color}
                  className={`grid h-10 w-10 place-items-center rounded-full border-2 ${c === color ? "border-ink" : "border-transparent"}`}>
                  <span className="h-7 w-7 rounded-full ring-1 ring-ink/30" style={{ background: h, boxShadow: "inset 0 2px 3px rgba(255,255,255,.45)" }} />
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="mt-6">
          <legend className="eyebrow mb-2 flex w-full items-center justify-between">Tamanho <span className="flex items-center gap-1 font-normal normal-case tracking-normal text-ink/60"><Ruler className="h-3.5 w-3.5" /> Veste normal</span></legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const out = stockFor(s) === 0;
              return (
                <button key={s} type="button" disabled={out} onClick={() => { setSize(s); setQty(1); setAdded(false); }} aria-pressed={s === size}
                  className={`relative h-11 min-w-12 border px-3 text-sm font-bold transition-colors ${s === size ? "border-ink bg-ink text-paper" : "border-ink/60 bg-white/40 hover:border-ink"} ${out ? "cursor-not-allowed text-ink/30 line-through" : ""}`}>
                  {s}
                </button>
              );
            })}
          </div>
          {!onDemand && variant && variant.stock > 0 && variant.stock <= 3 && <p className="mt-2 text-sm font-bold text-rouge">Restam apenas {variant.stock} nesta combinação.</p>}
        </fieldset>

        <div className="mt-8 flex gap-3">
          <QtyStepper value={qty} max={Math.max(1, canBuy || 1)} onChange={(n) => setQty(Math.max(1, n))} />
          <button
            className="btn btn-blue flex-1" disabled={!variant || canBuy === 0}
            onClick={() => {
              if (!variant) return;
              add({ variantId: variant.id, productId: p.id, slug: p.slug, name: p.name, label: [variant.size, variant.color].filter(Boolean).join(" · "), price, qty, max: canBuy, art: p.art, tone: p.tone, image: p.images[0] ?? null });
              setAdded(true);
            }}
          >
            {added ? <><Check className="h-4 w-4" /> Adicionado</> : !size ? "Escolha o tamanho" : variant && canBuy === 0 ? "Esgotado" : "Adicionar à sacola"}
          </button>
        </div>
        <div className="mt-3"><WishButton productId={p.id} label /></div>

        <ul className="glass-thin mt-6 space-y-2 p-4 text-sm">
          {lead && <li className="flex items-center gap-2 font-bold"><Clock className="h-4 w-4" strokeWidth={1.5} /> {lead}</li>}
          <li className="flex items-center gap-2"><Truck className="h-4 w-4" strokeWidth={1.5} /> Frete grátis acima de {brl(freeOver)}</li>
          <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> Primeira troca gratuita em até 30 dias</li>
        </ul>
      </div>
    </div>
  );
}

"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import type { CartLine } from "@/lib/types";
import { brl } from "@/lib/format";
import { ProductImage } from "@/components/art";

type Ctx = {
  lines: CartLine[]; count: number; subtotal: number; open: boolean; ready: boolean;
  setOpen: (v: boolean) => void; add: (l: CartLine) => void; setQty: (id: string, q: number) => void; clear: () => void;
  wishes: string[]; toggleWish: (productId: string) => boolean;
};
const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
};

const read = <T,>(k: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return fallback; }
};
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } };

export function CartProvider({ children, freeOver, shippingFlat }: { children: ReactNode; freeOver: number; shippingFlat: number }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishes, setWishes] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrata do localStorage após montar
  useEffect(() => { setLines(read("atelier.cart", [])); setWishes(read("atelier.wish", [])); setReady(true); }, []);
  useEffect(() => { if (ready) write("atelier.cart", lines); }, [lines, ready]);
  useEffect(() => { if (ready) write("atelier.wish", wishes); }, [wishes, ready]);

  const add = useCallback((l: CartLine) => {
    setLines((cur) => {
      const i = cur.findIndex((x) => x.variantId === l.variantId);
      if (i < 0) return [...cur, { ...l, qty: Math.min(l.qty, l.max) }];
      const next = [...cur];
      next[i] = { ...next[i], max: l.max, qty: Math.min(next[i].qty + l.qty, l.max) };
      return next;
    });
    setOpen(true);
  }, []);
  const setQty = useCallback((id: string, q: number) => {
    setLines((cur) => cur.flatMap((x) => (x.variantId !== id ? [x] : q <= 0 ? [] : [{ ...x, qty: Math.min(q, x.max) }])));
  }, []);
  const clear = useCallback(() => setLines([]), []);
  const toggleWish = useCallback((id: string) => {
    const has = wishes.includes(id);
    setWishes(has ? wishes.filter((w) => w !== id) : [...wishes, id]);
    fetch("/api/wish", { method: "POST", body: JSON.stringify({ product: id, delta: has ? -1 : 1 }) }).catch(() => {});
    return !has;
  }, [wishes]);

  const value = useMemo<Ctx>(() => ({
    lines, open, ready, setOpen, add, setQty, clear, wishes, toggleWish,
    count: lines.reduce((a, l) => a + l.qty, 0),
    subtotal: lines.reduce((a, l) => a + l.qty * l.price, 0),
  }), [lines, open, ready, add, setQty, clear, wishes, toggleWish]);

  return (
    <CartCtx.Provider value={value}>
      {children}
      <CartDrawer freeOver={freeOver} shippingFlat={shippingFlat} />
    </CartCtx.Provider>
  );
}

export function CartButton() {
  const { count, setOpen, ready } = useCart();
  return (
    <button onClick={() => setOpen(true)} className="relative flex h-11 items-center gap-2 px-3 font-bold" aria-label={`Abrir sacola, ${count} itens`}>
      <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />
      <span className="hidden sm:inline">Sacola</span>
      {ready && count > 0 && <span className="figure grid h-5 min-w-5 place-items-center bg-lime px-1 text-xs">{count}</span>}
    </button>
  );
}

export function QtyStepper({ value, max, onChange, small }: { value: number; max: number; onChange: (n: number) => void; small?: boolean }) {
  const s = small ? "h-8 w-8" : "h-11 w-11";
  return (
    <div className="inline-flex items-center border border-ink bg-white/40">
      <button type="button" className={`${s} grid place-items-center hover:bg-ink hover:text-paper`} onClick={() => onChange(value - 1)} aria-label="Diminuir"><Minus className="h-3.5 w-3.5" /></button>
      <span className="tnum w-8 text-center text-sm font-bold">{value}</span>
      <button type="button" className={`${s} grid place-items-center hover:bg-ink hover:text-paper disabled:opacity-30`} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Aumentar"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function CartDrawer({ freeOver, shippingFlat }: { freeOver: number; shippingFlat: number }) {
  const { lines, open, setOpen, setQty, subtotal } = useCart();
  const missing = Math.max(0, freeOver - subtotal);
  const pct = Math.min(100, (subtotal / freeOver) * 100);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
      <aside role="dialog" aria-label="Sacola" className={`glass absolute right-0 top-0 flex h-full w-full max-w-md flex-col transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${open ? "translate-x-0" : "translate-x-full"}`}>
        <header className="rule flex items-center justify-between px-6 py-5">
          <h2 className="display text-4xl">Sacola</h2>
          <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center hover:bg-ink hover:text-paper" aria-label="Fechar sacola"><X className="h-5 w-5" /></button>
        </header>
        <div className="px-6 py-4">
          <p className="text-sm">{missing > 0 ? <>Faltam <b>{brl(missing)}</b> para o frete grátis.</> : <b>Você ganhou frete grátis.</b>}</p>
          <div className="tape mt-2 h-3 bg-white/50"><div className="h-full bg-blue transition-all duration-500" style={{ width: `${pct}%` }} /></div>
        </div>
        <ul className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 && <li className="serif py-16 text-center text-3xl text-ink/60">Sua sacola está vazia.</li>}
          {lines.map((l) => (
            <li key={l.variantId} className="stitch-b flex gap-4 py-4">
              <Link href={`/produto/${l.slug}`} onClick={() => setOpen(false)} className="block h-28 w-22 shrink-0 overflow-hidden"><ProductImage product={l} className="h-full w-full" /></Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate font-bold">{l.name}</p>
                <p className="text-sm text-ink/60">{l.label}</p>
                <div className="mt-auto flex items-center justify-between">
                  <QtyStepper small value={l.qty} max={l.max} onChange={(n) => setQty(l.variantId, n)} />
                  <span className="tnum font-bold">{brl(l.price * l.qty)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <footer className="border-t border-ink px-6 py-5">
          <div className="flex justify-between text-sm"><span>Frete estimado</span><span className="tnum">{missing > 0 ? brl(shippingFlat) : "Grátis"}</span></div>
          <div className="mt-1 flex items-baseline justify-between"><span className="eyebrow">Subtotal</span><span className="figure text-4xl">{brl(subtotal)}</span></div>
          <Link href="/checkout" onClick={() => setOpen(false)} aria-disabled={!lines.length} className={`btn btn-blue mt-4 w-full ${lines.length ? "" : "pointer-events-none opacity-40"}`}>Finalizar compra →</Link>
        </footer>
      </aside>
    </div>
  );
}

"use client";
import { Heart } from "lucide-react";
import { useCart } from "./cart";

export function WishButton({ productId, label = false }: { productId: string; label?: boolean }) {
  const { wishes, toggleWish } = useCart();
  const on = wishes.includes(productId);
  return (
    <button
      type="button" onClick={() => toggleWish(productId)} aria-pressed={on}
      aria-label={on ? "Remover dos desejos" : "Adicionar aos desejos"}
      className={label ? "btn btn-ghost w-full" : "glass grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-110"}
    >
      <Heart className={`h-4 w-4 transition-colors ${on ? "fill-blue stroke-blue" : ""}`} strokeWidth={1.7} />
      {label && (on ? "Na sua lista de desejos" : "Adicionar aos desejos")}
    </button>
  );
}

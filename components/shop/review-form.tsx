"use client";
import { useState } from "react";
import { Star } from "lucide-react";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  if (state === "ok") return <p className="glass-lime p-4 font-bold">Obrigada! Sua avaliação será publicada após a moderação.</p>;
  return (
    <form
      className="glass space-y-3 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        const fd = new FormData(e.currentTarget);
        const r = await fetch("/api/review", { method: "POST", body: JSON.stringify({ product_id: productId, rating, author: fd.get("author"), comment: fd.get("comment") }) });
        setState(r.ok ? "ok" : "err");
      }}
    >
      <p className="eyebrow">Avalie esta peça</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Nota">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} estrelas`} onClick={() => setRating(n)}>
            <Star className={`h-6 w-6 ${n <= rating ? "fill-ink" : ""}`} strokeWidth={1.4} />
          </button>
        ))}
      </div>
      <input name="author" required minLength={2} maxLength={60} placeholder="Seu nome" className="input" aria-label="Seu nome" />
      <textarea name="comment" required minLength={3} maxLength={1000} rows={3} placeholder="Como é o caimento, o tecido, o acabamento?" className="input" aria-label="Comentário" />
      <button className="btn btn-ink" disabled={state === "busy"}>Enviar avaliação</button>
      {state === "err" && <p className="text-sm text-rouge">Não foi possível enviar. Tente novamente.</p>}
    </form>
  );
}

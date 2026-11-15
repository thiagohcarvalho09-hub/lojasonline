"use client";
import { useState } from "react";

export function Newsletter() {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  return (
    <form
      className="flex"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        const email = new FormData(e.currentTarget).get("email");
        const r = await fetch("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) });
        setState(r.ok ? "ok" : "err");
      }}
    >
      {state === "ok" ? <p className="glass-lime px-4 py-3 text-sm font-bold text-ink">Inscrição feita. Até breve.</p> : (
        <>
          <input name="email" type="email" required placeholder="seu@email.com" aria-label="E-mail" className="h-11 min-w-0 flex-1 border border-paper/40 bg-white/10 px-3 text-paper placeholder:text-paper/40 backdrop-blur focus:border-lime focus:outline-none" />
          <button disabled={state === "busy"} className="btn btn-lime">Assinar</button>
        </>
      )}
      {state === "err" && <p className="ml-3 self-center text-sm text-lime">Não foi possível assinar.</p>}
    </form>
  );
}

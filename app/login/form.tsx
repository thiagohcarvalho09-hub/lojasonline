"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp } from "./actions";

export function LoginForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inBusy] = useActionState(signIn, null);
  const [upState, upAction, upBusy] = useActionState(signUp, null);
  const state = mode === "in" ? inState : upState;
  const busy = inBusy || upBusy;
  return (
    <div className="glass bevel p-8">
      <div className="mb-6 grid grid-cols-2 border border-ink" role="tablist">
        {([["in", "Entrar"], ["up", "Criar conta"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={`h-11 font-bold ${mode === k ? "bg-ink text-paper" : ""}`}>{l}</button>
        ))}
      </div>
      <h2 className="serif text-5xl">{mode === "in" ? "Bem-vinda de volta." : "Abra seu ateliê."}</h2>
      <form action={mode === "in" ? inAction : upAction} className="mt-6 space-y-4">
        {mode === "up" && <label className="field"><span>Nome</span><input name="name" required className="input" autoComplete="name" /></label>}
        <label className="field"><span>E-mail</span><input name="email" type="email" required className="input" autoComplete="email" /></label>
        <label className="field"><span>Senha</span><input name="password" type="password" required minLength={mode === "up" ? 8 : 1} className="input" autoComplete={mode === "in" ? "current-password" : "new-password"} /></label>
        {state?.error && <p role="alert" className="border border-rouge bg-rouge/10 p-3 text-sm font-bold text-rouge">{state.error}</p>}
        {state?.ok && <p role="status" className="glass-lime p-3 text-sm font-bold">{state.ok}</p>}
        <button className="btn btn-blue w-full" disabled={busy}>{busy ? "Aguarde…" : mode === "in" ? "Entrar no painel" : "Criar conta"}</button>
      </form>
      {mode === "up" && <p className="mt-4 text-xs text-ink/60">A primeira conta criada torna-se proprietária da loja. As seguintes só acessam o painel quando a proprietária as promove à equipe.</p>}
      <Link href="/" className="link mt-6">← Voltar à loja</Link>
    </div>
  );
}

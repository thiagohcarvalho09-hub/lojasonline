"use client";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export type ActionState = { error?: string; ok?: string } | null;
type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/** Formulário ligado a uma server action, com retorno de erro/sucesso no lugar. */
export function ActionForm({ action, children, className, confirm }: { action: Action; children: ReactNode; className?: string; confirm?: string }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      {children}
      {state?.error && <p role="alert" className="mt-3 border border-rouge bg-rouge/10 p-3 text-sm font-bold text-rouge">{state.error}</p>}
      {state?.ok && <p role="status" className="glass-lime mt-3 p-3 text-sm font-bold">{state.ok}</p>}
    </form>
  );
}

export function Submit({ children, className = "btn btn-ink", name, value }: { children: ReactNode; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} name={name} value={value}>{pending ? "Salvando…" : children}</button>;
}

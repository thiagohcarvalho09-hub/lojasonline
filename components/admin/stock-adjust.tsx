"use client";
import { useActionState } from "react";
import { adjustStock } from "@/app/admin/actions";

export function StockAdjust({ variant }: { variant: string }) {
  const [state, action, busy] = useActionState(adjustStock, null);
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="variant" value={variant} />
      <input name="qty" type="number" min={1} required placeholder="Qtd" aria-label="Quantidade" className="input h-9 w-16 px-2" />
      <input name="note" placeholder="Motivo" aria-label="Motivo" className="input h-9 w-28 px-2 max-md:hidden" />
      <button name="mode" value="in" disabled={busy} className="btn btn-sm btn-ink h-9" title="Entrada / reposição">+ Entrada</button>
      <button name="mode" value="out" disabled={busy} className="btn btn-sm btn-ghost h-9" title="Baixa / perda">− Baixa</button>
      {state?.error && <span role="alert" className="ml-1 text-xs font-bold text-rouge">{state.error}</span>}
      {state?.ok && <span role="status" className="ml-1 text-xs font-bold text-blue">✓</span>}
    </form>
  );
}

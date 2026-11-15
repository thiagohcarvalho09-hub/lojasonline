import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { PageHead, Tabs } from "@/components/admin/bits";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Empty } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { dateLong } from "@/lib/format";
import { moderateReview } from "../actions";

export const metadata: Metadata = { title: "Avaliações" };

export default async function Avaliacoes({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("*, products(id, name)").order("created_at", { ascending: false }).limit(300);
  const all = data ?? [];
  const pending = all.filter((r) => !r.approved);
  const list = ver === "publicadas" ? all.filter((r) => r.approved) : pending;
  return (
    <>
      <PageHead eyebrow="Avaliações / moderação" title="O que dizem." />
      <Tabs current={ver ?? "pendentes"} items={[
        { key: "pendentes", label: "Aguardando moderação", href: "/admin/avaliacoes", count: pending.length },
        { key: "publicadas", label: "Publicadas", href: "/admin/avaliacoes?ver=publicadas", count: all.length - pending.length },
      ]} />
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((r) => {
          const p = r.products as { id: string; name: string } | null;
          return (
            <article key={r.id} className="glass bevel flex flex-col p-5">
              <div className="flex items-center justify-between">
                <p className="flex" aria-label={`${r.rating} de 5`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-ink" : "opacity-25"}`} />)}</p>
                <span className="text-xs text-ink/55">{dateLong(r.created_at)}</span>
              </div>
              <p className="serif mt-3 flex-1 text-2xl leading-snug">“{r.comment}”</p>
              <p className="mt-3 text-sm"><b>{r.author}</b> sobre {p ? <Link href={`/admin/produtos/${p.id}`} className="underline">{p.name}</Link> : "peça removida"}</p>
              <div className="stitch-t mt-4 flex gap-2 pt-3">
                <ActionForm action={moderateReview}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="op" value={r.approved ? "hide" : "approve"} /><Submit className={`btn btn-sm ${r.approved ? "btn-ghost" : "btn-lime"}`}>{r.approved ? "Ocultar" : "Publicar"}</Submit></ActionForm>
                <ActionForm action={moderateReview} confirm="Excluir esta avaliação?"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="op" value="delete" /><Submit className="btn btn-sm btn-ghost">Excluir</Submit></ActionForm>
              </div>
            </article>
          );
        })}
      </div>
      {!list.length && <Empty title={ver ? "Nenhuma avaliação publicada." : "Nada para moderar."} />}
    </>
  );
}

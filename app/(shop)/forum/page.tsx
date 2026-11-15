import type { Metadata } from "next";
import Link from "next/link";
import { Lock, MessageSquare, Pin } from "lucide-react";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Empty } from "@/components/ui";
import { getTopics } from "@/lib/forum";
import { getViewer } from "@/lib/supabase/server";
import { FORUM_CATEGORIES, timeAgo } from "@/lib/format";
import { createTopic } from "./actions";

export const metadata: Metadata = { title: "Fórum" };

export default async function Forum({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const [topics, { user }] = await Promise.all([getTopics(80, categoria), getViewer()]);
  const chip = (on: boolean) => `inline-flex h-9 shrink-0 items-center border px-3 text-sm ${on ? "border-ink bg-ink text-paper" : "border-ink/50 bg-white/40 hover:border-ink"}`;
  return (
    <div className="pt-8 md:pt-12">
      <p className="eyebrow">Fórum / comunidade</p>
      <h1 className="serif text-[clamp(3rem,8vw,6.5rem)]">Quem veste, conversa.</h1>
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section>
          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
            <Link href="/forum" className={chip(!categoria)}>Tudo</Link>
            {FORUM_CATEGORIES.map((c) => <Link key={c} href={`/forum?categoria=${encodeURIComponent(c)}`} className={chip(categoria === c)}>{c}</Link>)}
          </div>
          <div className="rule" />
          <ol>
            {topics.map((t) => (
              <li key={t.id} className="rule">
                <Link href={`/forum/${t.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-6 py-5 transition-colors hover:bg-white/50 hover:px-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`badge ${t.pinned ? "badge-lime" : "badge-stone"}`}>{t.pinned && <Pin className="mr-1 h-3 w-3" />}{t.category}</span>
                      {t.locked && <span className="badge badge-ink"><Lock className="mr-1 h-3 w-3" />Fechado</span>}
                      <span className="text-ink/55">{t.author_name}{t.author_staff && " · Equipe"} · {timeAgo(t.last_activity_at)}</span>
                    </p>
                    <h2 className="mt-2 text-2xl font-bold leading-tight group-hover:text-blue">{t.title}</h2>
                    <p className="mt-1 line-clamp-1 text-ink/65">{t.body}</p>
                  </div>
                  <p className="text-right"><span className="figure block text-4xl">{t.replies_count}</span><span className="flex items-center gap-1 text-xs text-ink/55"><MessageSquare className="h-3.5 w-3.5" /> respostas</span></p>
                </Link>
              </li>
            ))}
          </ol>
          {!topics.length && <div className="mt-6"><Empty title="Nenhuma conversa aqui ainda.">Abra o primeiro tópico desta categoria.</Empty></div>}
        </section>

        <aside id="novo" className="scroll-mt-32">
          <div className="glass bevel p-6 xl:sticky xl:top-28">
            <h2 className="display text-3xl">Novo tópico</h2>
            {user ? (
              <ActionForm action={createTopic} className="mt-4 space-y-3">
                <label className="field"><span>Categoria</span><select name="category" defaultValue={categoria ?? "Styling"} className="input">{FORUM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
                <label className="field"><span>Título</span><input name="title" required minLength={4} maxLength={140} className="input" placeholder="Qual é a dúvida ou a ideia?" /></label>
                <label className="field"><span>Mensagem</span><textarea name="body" required minLength={4} maxLength={5000} rows={6} className="input" /></label>
                <Submit className="btn btn-blue w-full">Publicar tópico</Submit>
              </ActionForm>
            ) : (
              <>
                <p className="mt-3 text-ink/70">Para abrir tópicos e responder, entre com a sua conta. Ler é livre.</p>
                <Link href="/login" className="btn btn-ink mt-5 w-full">Entrar ou criar conta</Link>
              </>
            )}
            <p className="stitch-t mt-5 pt-4 text-xs text-ink/55">Seja gentil, fale de moda e evite dados pessoais. A equipe modera as conversas.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

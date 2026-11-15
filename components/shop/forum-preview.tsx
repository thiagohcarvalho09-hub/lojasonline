import Link from "next/link";
import { ArrowRight, MessageSquare, Pin } from "lucide-react";
import { getTopics } from "@/lib/forum";
import { timeAgo } from "@/lib/format";

/** Coluna da direita na vitrine: as conversas mais recentes do fórum. */
export async function ForumPreview() {
  const topics = await getTopics(6);
  const replies = topics.reduce((a, t) => a + t.replies_count, 0);
  return (
    <aside className="mt-16 xl:mt-12" aria-label="Prévia do fórum">
      <div className="glass bevel xl:sticky xl:top-28">
        <header className="border-b border-ink p-5">
          <p className="eyebrow flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-blue" /> Ao vivo no ateliê</p>
          <h2 className="display mt-2 text-5xl">Fórum</h2>
          <p className="serif mt-1 text-2xl">Quem veste, conversa.</p>
          <p className="tnum mt-3 text-xs text-ink/60">{topics.length} conversas recentes · {replies} respostas</p>
        </header>
        <ol>
          {topics.map((t, i) => (
            <li key={t.id} className="stitch-b">
              <Link href={`/forum/${t.id}`} className="group block px-5 py-3.5 transition-colors hover:bg-white/60">
                <div className="flex items-center justify-between gap-2">
                  <span className={`badge ${t.pinned ? "badge-lime" : "badge-stone"} text-[.7rem]`}>{t.pinned && <Pin className="mr-1 h-3 w-3" />}{t.category}</span>
                  <span className="serif text-lg text-ink/40">N° {String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="mt-2 font-bold leading-snug group-hover:text-blue">{t.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink/65">{t.body}</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-ink/55">
                  <span className="chrome-fill grid h-5 w-5 place-items-center rounded-full text-[.6rem] font-black text-ink">{t.author_name[0]}</span>
                  {t.author_name}{t.author_staff && <span className="badge badge-ink h-4 px-1 text-[.6rem]">Equipe</span>}
                  <span className="ml-auto flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {t.replies_count}</span>
                  <span>{timeAgo(t.last_activity_at)}</span>
                </p>
              </Link>
            </li>
          ))}
          {!topics.length && <li className="px-5 py-8 text-sm text-ink/60">Nenhuma conversa ainda. Abra a primeira.</li>}
        </ol>
        <footer className="grid grid-cols-2 gap-2 p-4">
          <Link href="/forum" className="btn btn-ink btn-sm">Abrir fórum <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/forum#novo" className="btn btn-ghost btn-sm">Criar tópico</Link>
        </footer>
      </div>
    </aside>
  );
}

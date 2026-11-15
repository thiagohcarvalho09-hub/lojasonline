import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Pin } from "lucide-react";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { getViewer } from "@/lib/supabase/server";
import { dateTime } from "@/lib/format";
import type { Reply, Topic } from "@/lib/forum";
import { createReply, moderate } from "../actions";

type Props = { params: Promise<{ id: string }> };
export const metadata: Metadata = { title: "Fórum" };

function Author({ name, staff, at }: { name: string; staff: boolean; at: string }) {
  return (
    <p className="flex items-center gap-2 text-sm">
      <span className="chrome-fill grid h-8 w-8 place-items-center rounded-full text-xs font-black text-ink">{name[0]}</span>
      <b>{name}</b>{staff && <span className="badge badge-ink h-5 text-[.65rem]">Equipe</span>}<span className="text-ink/55">· {dateTime(at)}</span>
    </p>
  );
}

export default async function TopicPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user, profile } = await getViewer();
  const [{ data: t }, { data: r }] = await Promise.all([
    supabase.from("forum_topics").select("*").eq("id", id).maybeSingle(),
    supabase.from("forum_replies").select("*").eq("topic_id", id).order("created_at"),
  ]);
  if (!t) notFound();
  const topic = t as Topic, replies = (r ?? []) as Reply[];
  const staff = profile?.role === "owner" || profile?.role === "staff";
  const mod = (op: string, label: string, value?: string, target = topic.id, confirm?: string) => (
    <ActionForm action={moderate} confirm={confirm}><input type="hidden" name="id" value={target} /><input type="hidden" name="op" value={op} />{value && <input type="hidden" name="value" value={value} />}<Submit className="text-sm underline hover:text-blue">{label}</Submit></ActionForm>
  );

  return (
    <div className="mx-auto max-w-4xl pt-8 md:pt-12">
      <p className="eyebrow"><Link href="/forum" className="hover:text-blue">Fórum</Link> / {topic.category}</p>
      <h1 className="display mt-2 text-[clamp(2.6rem,5vw,4.5rem)]">{topic.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {topic.pinned && <span className="badge badge-lime"><Pin className="mr-1 h-3 w-3" />Fixado</span>}
        {topic.locked && <span className="badge badge-ink"><Lock className="mr-1 h-3 w-3" />Fechado</span>}
      </div>

      <article className="glass bevel mt-6 p-6">
        <Author name={topic.author_name} staff={topic.author_staff} at={topic.created_at} />
        <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{topic.body}</p>
        {(staff || user?.id === topic.author_id) && (
          <div className="stitch-t mt-5 flex flex-wrap gap-4 pt-3">
            {staff && mod("pin", topic.pinned ? "Desafixar" : "Fixar no topo", String(!topic.pinned))}
            {staff && mod("lock", topic.locked ? "Reabrir" : "Fechar para respostas", String(!topic.locked))}
            {mod("delete", "Excluir tópico", undefined, topic.id, "Excluir este tópico e todas as respostas?")}
          </div>
        )}
      </article>

      <h2 className="display mt-10 text-3xl">{replies.length} {replies.length === 1 ? "resposta" : "respostas"}</h2>
      <ol className="mt-2">
        {replies.map((x, i) => (
          <li key={x.id} className="stitch-b grid grid-cols-[2.5rem_1fr] gap-3 py-5">
            <span className="serif text-2xl text-ink/40">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <Author name={x.author_name} staff={x.author_staff} at={x.created_at} />
              <p className="mt-2 whitespace-pre-line leading-relaxed">{x.body}</p>
              {(staff || user?.id === x.author_id) && <div className="mt-2">{mod("delete-reply", "Excluir", undefined, x.id, "Excluir esta resposta?")}</div>}
            </div>
          </li>
        ))}
      </ol>

      <section className="glass mt-8 p-6">
        {topic.locked && !staff ? <p className="text-ink/70">Este tópico está fechado para novas respostas.</p>
          : user ? (
            <ActionForm action={createReply} className="space-y-3">
              <input type="hidden" name="topic_id" value={topic.id} />
              <label className="field"><span>Sua resposta</span><textarea name="body" required minLength={2} maxLength={5000} rows={4} className="input" /></label>
              <Submit className="btn btn-blue">Responder</Submit>
            </ActionForm>
          ) : <div className="flex flex-wrap items-center justify-between gap-4"><p className="text-ink/70">Entre com a sua conta para responder.</p><Link href="/login" className="btn btn-ink">Entrar ou criar conta</Link></div>}
      </section>
    </div>
  );
}

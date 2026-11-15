"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/components/admin/action-form";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const fail = (m: string): ActionState => ({
  error: m.includes("row-level security") ? "Entre na sua conta para participar do fórum."
    : m.includes("forum_topics") && m.includes("does not exist") ? "O fórum ainda não foi ativado no banco." : m,
});

// A autoria é carimbada pelo banco a partir da sessão; aqui só validamos o texto.
export async function createTopic(_: ActionState, fd: FormData): Promise<ActionState> {
  const title = str(fd, "title"), body = str(fd, "body");
  if (title.length < 4) return { error: "Dê um título ao tópico." };
  if (body.length < 4) return { error: "Escreva a sua mensagem." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("forum_topics").insert({ title, body, category: str(fd, "category") || "Geral" }).select("id").single();
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  redirect(`/forum/${data.id}`);
}

export async function createReply(_: ActionState, fd: FormData): Promise<ActionState> {
  const body = str(fd, "body");
  if (body.length < 2) return { error: "Escreva a sua resposta." };
  const supabase = await createClient();
  const { error } = await supabase.from("forum_replies").insert({ topic_id: str(fd, "topic_id"), body });
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: "Resposta publicada." };
}

export async function moderate(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const id = str(fd, "id"), op = str(fd, "op");
  const res = op === "delete-reply" ? await supabase.from("forum_replies").delete().eq("id", id)
    : op === "delete" ? await supabase.from("forum_topics").delete().eq("id", id)
    : await supabase.from("forum_topics").update(op === "pin" ? { pinned: str(fd, "value") === "true" } : { locked: str(fd, "value") === "true" }).eq("id", id);
  if (res.error) return fail(res.error.message);
  revalidatePath("/", "layout");
  if (op === "delete") redirect("/forum");
  return null;
}

import { createClient } from "@/lib/supabase/server";

export type Topic = {
  id: string; title: string; body: string; category: string; author_id: string | null; author_name: string; author_staff: boolean;
  pinned: boolean; locked: boolean; replies_count: number; last_activity_at: string; created_at: string;
};
export type Reply = { id: string; topic_id: string; body: string; author_id: string | null; author_name: string; author_staff: boolean; created_at: string };

/** Tópicos mais recentes; devolve lista vazia se o fórum ainda não foi criado no banco. */
export async function getTopics(limit = 50, category?: string): Promise<Topic[]> {
  const supabase = await createClient();
  let q = supabase.from("forum_topics").select("*").order("pinned", { ascending: false }).order("last_activity_at", { ascending: false }).limit(limit);
  if (category) q = q.eq("category", category);
  const { data } = await q;
  return (data ?? []) as Topic[];
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ?? "";
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Cliente do Supabase da requisição. Sem as variáveis de ambiente a plataforma não abre: não há dados de exemplo. */
export async function createClient(): Promise<SupabaseClient> {
  if (!isConfigured) throw new Error("Banco não conectado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Em Server Components os cookies são somente leitura; o proxy renova a sessão.
        }
      },
    },
  });
}

/** Usuário logado + papel na loja (owner | staff | customer). */
export async function getViewer() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", data.user.id)
    .maybeSingle();
  return { supabase, user: data.user, profile };
}

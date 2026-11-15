"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; ok?: string } | null;

export async function signIn(_: AuthState, fd: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
  if (error) return { error: error.message === "Email not confirmed" ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha incorretos." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  redirect(profile?.role === "owner" || profile?.role === "staff" ? "/admin" : "/");
}

export async function signUp(_: AuthState, fd: FormData): Promise<AuthState> {
  const password = String(fd.get("password"));
  if (password.length < 8) return { error: "A senha precisa ter ao menos 8 caracteres." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(fd.get("email")), password, options: { data: { full_name: String(fd.get("name") ?? "") } },
  });
  if (error) return { error: error.message };
  if (!data.session) return { ok: "Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre." };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

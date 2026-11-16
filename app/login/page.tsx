import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./form";
import { Barcode, ChromeBlob, Logo } from "@/components/ui";
import { ProductArt } from "@/components/art";
import { getViewer } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Entrar" };

export default async function Login() {
  // Quem já está conectado não vê o formulário de novo: equipe vai ao painel, cliente vê a própria conta.
  const { user, profile } = await getViewer();
  if (user && (profile?.role === "owner" || profile?.role === "staff")) redirect("/admin");
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-ink text-paper lg:block">
        <ProductArt art="blazer" tone="#2a2a2d" color="#050505" className="absolute inset-0 h-full w-full opacity-80" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Logo light />
          <div>
            <p className="eyebrow text-lime">Painel da loja</p>
            <h1 className="serif mt-2 text-8xl">O próximo movimento.</h1>
            <Barcode value="atelier-workspace" className="mt-8 h-8 w-48 text-paper/60" />
          </div>
        </div>
        <ChromeBlob className="absolute -right-10 top-1/3 w-72 drop-shadow-2xl" />
      </section>
      <section className="grid place-items-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          {user ? (
            <div className="glass bevel p-8">
              <h2 className="serif text-5xl">Você já está conectada.</h2>
              <p className="mt-4 text-ink/70">Conta: <strong>{user.email}</strong>. Ela ainda não faz parte da equipe, por isso o painel não abre. A proprietária libera o acesso em Configurações → Equipe.</p>
              <div className="mt-6 flex gap-3"><Link href="/" className="btn btn-ink">Ir para a loja</Link><form action={signOut}><button className="btn btn-ghost">Sair e trocar de conta</button></form></div>
            </div>
          ) : <LoginForm />}
        </div>
      </section>
    </main>
  );
}

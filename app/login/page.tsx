import type { Metadata } from "next";
import { LoginForm } from "./form";
import { Barcode, ChromeBlob, Logo } from "@/components/ui";
import { ProductArt } from "@/components/art";
import { Setup } from "@/components/setup";
import { isConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Entrar" };

export default function Login() {
  if (!isConfigured) return <Setup />;
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
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

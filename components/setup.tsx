import { Logo } from "@/components/ui";

export function Setup() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="glass bevel max-w-xl p-10">
        <Logo />
        <h1 className="serif mt-8 text-5xl">Falta conectar o banco.</h1>
        <p className="mt-4 text-ink/70">
          Defina <code className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> nas variáveis de ambiente e aplique as
          migrações da pasta <code className="font-mono text-sm">supabase/migrations</code>.
        </p>
      </div>
    </main>
  );
}

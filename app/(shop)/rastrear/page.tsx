import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Rastrear pedido" };

async function track(formData: FormData) {
  "use server";
  const number = Number(String(formData.get("number")).replace(/\D/g, ""));
  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();
  const { data } = await supabase.rpc("order_public", { p_number: number || 0, p_email: email });
  redirect(data?.token ? `/pedido/${data.token}` : "/rastrear?erro=1");
}

export default async function Rastrear({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <div className="mx-auto max-w-xl pt-12 md:pt-20">
      <p className="eyebrow">Atendimento</p>
      <h1 className="serif text-[clamp(3rem,7vw,5.5rem)]">Onde está meu pedido?</h1>
      <form action={track} className="glass bevel mt-8 space-y-4 p-6 md:p-8">
        <label className="field"><span>Número do pedido</span><input name="number" required inputMode="numeric" placeholder="#10428" className="input font-mono" /></label>
        <label className="field"><span>E-mail usado na compra</span><input name="email" type="email" required className="input" /></label>
        {erro && <p role="alert" className="border border-rouge bg-rouge/10 p-3 text-sm font-bold text-rouge">Não encontramos um pedido com esses dados. Confira o número e o e-mail.</p>}
        <button className="btn btn-ink w-full">Rastrear →</button>
      </form>
    </div>
  );
}

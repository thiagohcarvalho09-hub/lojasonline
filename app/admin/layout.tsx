import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/shell";
import { getViewer } from "@/lib/supabase/server";
import { getSettings } from "@/lib/shop";
import { signOut } from "@/app/login/actions";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · ATELIER workspace" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (profile?.role !== "owner" && profile?.role !== "staff") {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="glass bevel max-w-lg p-10">
          <h1 className="serif text-5xl">Acesso restrito à equipe.</h1>
          <p className="mt-4 text-ink/70">Sua conta ({user.email}) ainda não faz parte da equipe. Peça à proprietária da loja para liberar seu acesso em Configurações → Equipe.</p>
          <div className="mt-6 flex gap-3"><Link href="/" className="btn btn-ink">Ir para a loja</Link><form action={signOut}><button className="btn btn-ghost">Sair</button></form></div>
        </div>
      </main>
    );
  }
  const settings = await getSettings();
  const [pending, low, reviews] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("product_variants").select("id, products!inner(fulfillment)", { count: "exact", head: true }).eq("products.fulfillment", "stock").lte("stock", settings.low_stock_threshold),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
  ]);
  return (
    <AdminShell user={{ name: profile.full_name || user.email || "Equipe", role: profile.role }} alerts={{ pending: pending.count ?? 0, lowStock: low.count ?? 0, reviews: reviews.count ?? 0 }}>
      {children}
    </AdminShell>
  );
}

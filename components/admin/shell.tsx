"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Box, ChevronDown, ExternalLink, Home, LogOut, Menu, Search, Settings, Shirt, ShoppingBag, Star, Tag, Ticket, Users, X } from "lucide-react";
import { DemoBar, Logo } from "@/components/ui";
import { signOut } from "@/app/login/actions";

const NAV = [
  ["/admin", "Visão geral", Home], ["/admin/pedidos", "Pedidos", ShoppingBag], ["/admin/colecoes", "Coleções", Tag],
  ["/admin/produtos", "Produtos", Shirt], ["/admin/clientes", "Clientes", Users], ["/admin/estoque", "Estoque", Box],
  ["/admin/cupons", "Cupons", Ticket], ["/admin/avaliacoes", "Avaliações", Star], ["/admin/relatorios", "Relatórios", BarChart3],
  ["/admin/configuracoes", "Configurações", Settings],
] as const;

export function AdminShell({ children, user, alerts, demo }: { children: React.ReactNode; demo?: boolean; user: { name: string; role: string }; alerts: { pending: number; lowStock: number; reviews: number } }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<"" | "user" | "bell">("");
  const initials = user.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const total = alerts.pending + alerts.lowStock + alerts.reviews;
  const badge: Record<string, number> = { "/admin/pedidos": alerts.pending, "/admin/estoque": alerts.lowStock, "/admin/avaliacoes": alerts.reviews };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[13.5rem_1fr]">
      {/* Barra lateral */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[13.5rem] flex-col bg-ink text-paper transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_40%_at_0%_0%,rgba(255,255,255,.14),transparent)]" />
        <div className="relative px-6 pb-10 pt-5"><Logo light href="/admin" /></div>
        <nav className="relative flex-1 space-y-0.5 overflow-y-auto" aria-label="Painel">
          {NAV.map(([href, label, Icon]) => {
            const on = href === "/admin" ? path === href : path.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={on ? "page" : undefined}
                className={`relative flex h-12 items-center gap-4 pl-7 pr-4 text-[1.02rem] transition-colors ${on ? "bg-white/10 font-bold backdrop-blur" : "text-paper/85 hover:bg-white/5"}`}>
                {on && <span className="absolute left-3 top-2 h-8 w-1 bg-lime" />}
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="flex-1">{label}</span>
                {badge[href] > 0 && <span className="figure grid h-5 min-w-5 place-items-center bg-lime px-1 text-xs text-ink">{badge[href]}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="relative p-4">
          <Link href="/" target="_blank" className="glass-dark flex items-center justify-between px-4 py-3 text-sm">Ver loja online <ExternalLink className="h-4 w-4" /></Link>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      <div className="min-w-0">
        {/* Barra superior */}
        <header className="glass sticky top-0 z-30 flex h-[4.6rem] items-center gap-4 border-x-0 border-t-0 border-b-ink px-4 md:px-8">
          <button className="grid h-10 w-10 place-items-center lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
          <div className="hidden border-r border-ink pr-6 sm:block">
            <p className="text-xs font-bold">Workspace</p>
            <p className="flex h-8 w-44 items-center justify-between border border-ink bg-white/50 px-2 text-sm">Loja Principal <ChevronDown className="h-4 w-4" /></p>
          </div>
          <form action="/admin/busca" className="relative flex-1" role="search">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" strokeWidth={1.6} />
            <input name="q" required className="input h-11 pl-12" placeholder="Buscar peças, pedidos e clientes…" aria-label="Buscar no painel" />
          </form>
          <div className="relative border-l border-ink pl-4">
            <button className="relative grid h-11 w-11 place-items-center" aria-label={`Avisos: ${total}`} aria-expanded={menu === "bell"} onClick={() => setMenu(menu === "bell" ? "" : "bell")}>
              <Bell className="h-6 w-6" strokeWidth={1.5} />
              {total > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-blue ring-2 ring-paper" />}
            </button>
            {menu === "bell" && (
              <div className="glass absolute right-0 top-14 w-72 p-2 text-sm" onClick={() => setMenu("")}>
                <p className="eyebrow p-2">Avisos</p>
                {total === 0 && <p className="p-2 text-ink/60">Tudo em dia.</p>}
                {alerts.pending > 0 && <Link href="/admin/pedidos?status=pending" className="block p-2 hover:bg-white/60"><b>{alerts.pending}</b> pedidos aguardando pagamento</Link>}
                {alerts.lowStock > 0 && <Link href="/admin/estoque?filtro=baixo" className="block p-2 hover:bg-white/60"><b>{alerts.lowStock}</b> variações com estoque baixo</Link>}
                {alerts.reviews > 0 && <Link href="/admin/avaliacoes" className="block p-2 hover:bg-white/60"><b>{alerts.reviews}</b> avaliações para moderar</Link>}
              </div>
            )}
          </div>
          <div className="relative">
            <button className="flex items-center gap-2" aria-expanded={menu === "user"} onClick={() => setMenu(menu === "user" ? "" : "user")} aria-label="Conta">
              <span className="grid h-11 w-13 place-items-center bg-ink text-lg font-bold text-paper">{initials || "AC"}</span><ChevronDown className="h-4 w-4" />
            </button>
            {menu === "user" && (
              <div className="glass absolute right-0 top-14 w-60 p-2 text-sm">
                <p className="p-2"><b>{user.name}</b><br /><span className="text-ink/60">{user.role === "owner" ? "Proprietária" : "Equipe"}</span></p>
                <form action={signOut}><button className="flex w-full items-center gap-2 p-2 text-left hover:bg-white/60"><LogOut className="h-4 w-4" /> Sair</button></form>
              </div>
            )}
          </div>
        </header>
        {demo && <DemoBar />}
        <main className="px-4 pb-16 pt-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

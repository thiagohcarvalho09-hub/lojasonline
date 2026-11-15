"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MessagesSquare, PackageSearch, User, X } from "lucide-react";
import { Barcode, Logo } from "@/components/ui";

const OPEN_EVENT = "atelier:menu";

function Bars({ onClick, expanded, className = "" }: { onClick: () => void; expanded?: boolean; className?: string }) {
  return (
    <button onClick={onClick} aria-label="Abrir menu" aria-expanded={expanded} className={`group grid h-12 w-12 place-items-center ${className}`}>
      <span className="flex w-6 flex-col gap-[5px]" aria-hidden>
        <span className="h-0.5 w-full bg-current transition-all group-hover:w-4" />
        <span className="h-0.5 w-full bg-current" />
        <span className="h-0.5 w-4 bg-current transition-all group-hover:w-full" />
      </span>
    </button>
  );
}

/** Botão de três barras do cabeçalho (telas pequenas). */
export function MenuButton() {
  return <Bars className="-ml-3 lg:hidden" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} />;
}

/** Faixa lateral com o menu de três barras; abre um painel de vidro com toda a navegação. */
export function SideMenu({ categories, staff, season }: { categories: { name: string; slug: string }[]; staff: boolean; season: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // no celular o botão fica no cabeçalho (MenuButton) e avisa por evento
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  const bars = <Bars onClick={() => setOpen(true)} expanded={open} />;
  const item = (href: string, label: string, n: number) => (
    <li key={href} className="border-b border-paper/15">
      <Link href={href} onClick={() => setOpen(false)} className={`group flex items-baseline justify-between py-2.5 transition-all hover:pl-3 hover:text-lime ${path === href ? "text-lime" : ""}`}>
        <span className="display text-4xl">{label}</span>
        <span className="serif text-xl opacity-50 group-hover:opacity-100">{String(n).padStart(2, "0")}</span>
      </Link>
    </li>
  );

  return (
    <>
      {/* faixa fixa (telas grandes) */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-16 flex-col items-center bg-ink py-3 text-paper lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_30%_at_0%_0%,rgba(255,255,255,.16),transparent)]" />
        {bars}
        <p className="eyebrow mt-6 flex-1 text-[.6rem] text-paper/60 [writing-mode:vertical-rl]">Atelier · {season} · moda &amp; acessórios</p>
        <nav className="flex flex-col items-center gap-1" aria-label="Atalhos">
          <Link href="/forum" aria-label="Fórum" className="grid h-11 w-11 place-items-center hover:text-lime"><MessagesSquare className="h-5 w-5" strokeWidth={1.5} /></Link>
          <Link href="/favoritos" aria-label="Lista de desejos" className="grid h-11 w-11 place-items-center hover:text-lime"><Heart className="h-5 w-5" strokeWidth={1.5} /></Link>
          <Link href="/rastrear" aria-label="Rastrear pedido" className="grid h-11 w-11 place-items-center hover:text-lime"><PackageSearch className="h-5 w-5" strokeWidth={1.5} /></Link>
        </nav>
      </aside>

      <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <nav aria-label="Menu" className={`glass-dark absolute inset-y-0 left-0 flex w-full max-w-sm flex-col overflow-y-auto p-6 transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-start justify-between">
            <Logo light sub="moda & acessórios" />
            <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="grid h-10 w-10 place-items-center hover:bg-paper hover:text-ink"><X className="h-5 w-5" /></button>
          </div>
          <ul className="mt-8">
            {[["/", "Início"], ["/loja", "Loja"], ["/colecoes", "Coleções"], ["/forum", "Fórum"], ["/loja?promo=1", "Sale"]].map(([h, l], i) => item(h, l, i + 1))}
          </ul>
          <p className="eyebrow mb-2 mt-8 text-lime">Categorias</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {categories.map((c) => <li key={c.slug}><Link href={`/loja?categoria=${c.slug}`} onClick={() => setOpen(false)} className="hover:text-lime">{c.name}</Link></li>)}
          </ul>
          <ul className="mt-8 space-y-2 border-t border-paper/15 pt-6 text-sm">
            <li><Link href="/favoritos" onClick={() => setOpen(false)} className="flex items-center gap-3 hover:text-lime"><Heart className="h-4 w-4" /> Lista de desejos</Link></li>
            <li><Link href="/rastrear" onClick={() => setOpen(false)} className="flex items-center gap-3 hover:text-lime"><PackageSearch className="h-4 w-4" /> Rastrear pedido</Link></li>
            <li><Link href={staff ? "/admin" : "/login"} onClick={() => setOpen(false)} className="flex items-center gap-3 hover:text-lime"><User className="h-4 w-4" /> {staff ? "Painel da loja" : "Entrar ou criar conta"}</Link></li>
          </ul>
          <div className="mt-auto pt-8"><Barcode value={`menu-${season}`} className="h-7 w-36 text-paper/50" /><p className="mt-1 font-mono text-[.6rem] tracking-[.3em] text-paper/40">{season} · N° 0001</p></div>
        </nav>
      </div>
    </>
  );
}

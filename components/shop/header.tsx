import Link from "next/link";
import { Heart, Search, User } from "lucide-react";
import { Logo, Marquee } from "@/components/ui";
import { CartButton } from "./cart";
import type { Settings } from "@/lib/types";

export function ShopHeader({ settings, categories, staff }: { settings: Settings; categories: { name: string; slug: string }[]; staff: boolean }) {
  return (
    <>
      {settings.announcement && (
        <Marquee items={settings.announcement.split("·").map((s) => s.trim()).filter(Boolean)} className="eyebrow bg-ink py-2 text-paper" />
      )}
      <header className="sticky top-0 z-40">
        <div className="glass border-x-0 border-t-0">
          <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-3 md:px-8">
            <Logo sub="moda & acessórios" />
            <nav className="ml-4 hidden items-center gap-6 text-[.95rem] lg:flex" aria-label="Principal">
              <Link href="/loja" className="font-bold hover:text-blue">Loja</Link>
              <Link href="/colecoes" className="hover:text-blue">Coleções</Link>
              {categories.slice(0, 4).map((c) => <Link key={c.slug} href={`/loja?categoria=${c.slug}`} className="hover:text-blue">{c.name}</Link>)}
              <Link href="/loja?promo=1" className="bg-lime px-2 py-0.5 font-bold">Sale</Link>
            </nav>
            <form action="/loja" className="relative ml-auto hidden w-64 md:block" role="search">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" strokeWidth={1.7} />
              <input name="q" className="input pl-9" placeholder="Buscar peças…" aria-label="Buscar peças" />
            </form>
            <div className="ml-auto flex items-center md:ml-0">
              <Link href="/favoritos" className="grid h-11 w-11 place-items-center" aria-label="Lista de desejos"><Heart className="h-5 w-5" strokeWidth={1.6} /></Link>
              <Link href={staff ? "/admin" : "/login"} className="grid h-11 w-11 place-items-center" aria-label={staff ? "Painel da loja" : "Entrar"}><User className="h-5 w-5" strokeWidth={1.6} /></Link>
              <CartButton />
            </div>
          </div>
          <nav className="no-scrollbar flex gap-5 overflow-x-auto px-4 pb-3 text-sm lg:hidden" aria-label="Categorias">
            <Link href="/loja" className="shrink-0 font-bold">Loja</Link>
            <Link href="/colecoes" className="shrink-0">Coleções</Link>
            {categories.map((c) => <Link key={c.slug} href={`/loja?categoria=${c.slug}`} className="shrink-0">{c.name}</Link>)}
          </nav>
        </div>
      </header>
    </>
  );
}

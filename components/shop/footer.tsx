import Link from "next/link";
import { Barcode, Logo } from "@/components/ui";
import { Newsletter } from "./newsletter";
import type { Settings } from "@/lib/types";

export function ShopFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-paper">
      <div className="selvedge opacity-0" />
      <div className="grid gap-12 px-4 py-16 md:grid-cols-[1.3fr_1fr_1fr_1.4fr] md:px-8 2xl:px-12">
        <div>
          <Logo light sub="moda & acessórios" />
          <p className="mt-5 max-w-xs text-sm text-paper/60">Alfaiataria, couro e metal líquido. Desenhado e produzido em pequenas séries.</p>
          <Barcode value={settings.name + settings.season} className="mt-6 h-8 w-40 text-paper/70" />
          <p className="mt-1 font-mono text-[.65rem] tracking-[.3em] text-paper/50">{settings.season} · N° 0001</p>
        </div>
        <nav className="space-y-2 text-sm" aria-label="Loja">
          <p className="eyebrow mb-4 text-lime">Loja</p>
          <Link className="block hover:text-lime" href="/loja">Todas as peças</Link>
          <Link className="block hover:text-lime" href="/colecoes">Coleções</Link>
          <Link className="block hover:text-lime" href="/loja?promo=1">Sale</Link>
          <Link className="block hover:text-lime" href="/favoritos">Lista de desejos</Link>
        </nav>
        <nav className="space-y-2 text-sm" aria-label="Atendimento">
          <p className="eyebrow mb-4 text-lime">Atendimento</p>
          <Link className="block hover:text-lime" href="/forum">Fórum do ateliê</Link>
          <Link className="block hover:text-lime" href="/rastrear">Rastrear pedido</Link>
          {settings.whatsapp && <a className="block hover:text-lime" href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}>WhatsApp</a>}
          {settings.contact_email && <a className="block hover:text-lime" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>}
          {settings.instagram && <a className="block hover:text-lime" href={`https://instagram.com/${settings.instagram.replace("@", "")}`}>Instagram</a>}
          <Link className="block hover:text-lime" href="/login">Área da equipe</Link>
        </nav>
        <div>
          <p className="eyebrow mb-4 text-lime">Carta do ateliê</p>
          <p className="serif mb-4 text-3xl">Receba o próximo movimento antes de todo mundo.</p>
          <Newsletter />
        </div>
      </div>
      <p className="display select-none whitespace-nowrap px-4 text-[21vw] leading-[.8] text-paper/[.06]" aria-hidden>ATELIER</p>
    </footer>
  );
}

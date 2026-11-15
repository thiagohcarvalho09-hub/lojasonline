import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { PERIODS } from "@/lib/format";

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="serif rise text-[clamp(3rem,6.5vw,5.6rem)]">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3 pb-2">{children}</div>
    </div>
  );
}

/** Seletor de período: um <details> que funciona sem JavaScript. */
export function PeriodPicker({ base, current }: { base: string; current: string }) {
  return (
    <details className="relative">
      <summary className="input flex h-11 w-56 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <CalendarDays className="h-5 w-5" strokeWidth={1.5} /><span className="flex-1">{PERIODS[current]}</span><span aria-hidden>⌄</span>
      </summary>
      <div className="glass absolute right-0 z-20 mt-1 w-56 p-1">
        {Object.entries(PERIODS).map(([k, l]) => (
          <Link key={k} href={`${base}?periodo=${k}`} className={`block px-3 py-2 text-sm hover:bg-white/70 ${k === current ? "font-bold" : ""}`}>{l}</Link>
        ))}
      </div>
    </details>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glass bevel p-5 ${className}`}>
      {title && <div className="mb-4 flex items-end justify-between gap-3"><h2 className="display text-2xl">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

export function Tabs({ items, current }: { items: { href: string; label: string; count?: number; key: string }[]; current: string }) {
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-ink" aria-label="Filtros">
      {items.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === current ? "page" : undefined}
          className={`flex h-10 shrink-0 items-center gap-2 px-4 text-sm ${t.key === current ? "bg-ink font-bold text-paper" : "hover:bg-white/50"}`}>
          {t.label}{t.count !== undefined && <span className={`tnum text-xs ${t.key === current ? "text-lime" : "text-ink/50"}`}>{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

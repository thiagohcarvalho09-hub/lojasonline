import Link from "next/link";
import type { ReactNode } from "react";
import { STATUS } from "@/lib/format";

export function Logo({ sub = "workspace", light = false, href = "/" }: { sub?: string; light?: boolean; href?: string }) {
  return (
    <Link href={href} className={`inline-block leading-none ${light ? "text-paper" : "text-ink"}`} aria-label="Atelier — início">
      <span className="display block text-[2rem] tracking-tight">ATELIER <span className="font-sans font-light">/</span></span>
      <span className="serif -mt-1 block text-[1.55rem]">{sub}</span>
    </Link>
  );
}

/** Código de barras de etiqueta, gerado de forma determinística a partir do texto. */
export function Barcode({ value, className = "" }: { value: string; className?: string }) {
  const bars: number[] = [];
  let seed = 0;
  for (const ch of value) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  for (let i = 0; i < 38; i++) { seed = (seed * 1103515245 + 12345) >>> 0; bars.push(1 + (seed >>> 16) % 3); }
  let x = 0;
  return (
    <svg viewBox={`0 0 ${bars.reduce((a, b) => a + b + 1, 0)} 24`} preserveAspectRatio="none" className={className} aria-hidden>
      {bars.map((w, i) => { const r = <rect key={i} x={x} width={w} height="24" fill="currentColor" />; x += w + 1; return r; })}
    </svg>
  );
}

export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-hidden>
      <div className="marquee">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {row.map((t, i) => <span key={i} className="flex items-center gap-6 px-3"><span>{t}</span><span className="text-[.6em]">✦</span></span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "stone" };
  return <span className={`badge badge-${s.tone}`}>{s.label}</span>;
}

export function SectionHead({ title, action, eyebrow }: { title: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1 text-ash">{eyebrow}</p>}
        <h2 className="display text-[2.4rem]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Escultura de metal líquido — o cromado das joias da coleção. */
export function ChromeBlob({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden>
      <defs>
        <linearGradient id="cb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" /><stop offset=".28" stopColor="#b4b8be" /><stop offset=".5" stopColor="#3f4247" />
          <stop offset=".62" stopColor="#f1f2f4" /><stop offset=".85" stopColor="#8d9198" /><stop offset="1" stopColor="#fff" />
        </linearGradient>
      </defs>
      <path d="M22 96C10 54 58 20 96 34c26 10 30-18 62-10 30 8 34 46 12 62-18 14-6 30-30 44-28 16-70 10-96-6-12-8-18-16-22-28Z" fill="url(#cb)" />
      <path d="M70 84c8-18 34-24 50-12 12 10 4 30-14 36-20 6-42-6-36-24Z" fill="#0b0b0c" fillOpacity=".7" />
      <path d="M36 80c4-22 26-36 50-34" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".9" />
    </svg>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="stitch glass-thin px-6 py-14 text-center">
      <p className="serif text-3xl">{title}</p>
      {children && <div className="mx-auto mt-3 max-w-md text-sm text-ink/70">{children}</div>}
    </div>
  );
}

/** Etiqueta de composição, como a costurada por dentro da peça. */
export function CareLabel({ material, care, sku }: { material: string; care: string; sku?: string | null }) {
  return (
    <div className="stitch glass-thin relative max-w-xs p-4 text-[.8rem] leading-relaxed">
      <p className="eyebrow mb-2">Composição & cuidados</p>
      <p>{material || "—"}</p>
      <p className="text-ink/70">{care}</p>
      <div className="mt-3 flex items-center gap-3 text-ink/80" aria-hidden>
        {["M4 7h16l-2 12H6Z", "M4 19 12 5l8 14Z", "M5 5h14v14H5Z", "M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0"].map((d, i) => (
          <svg key={i} viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4"><path d={d} /></svg>
        ))}
      </div>
      {sku && <div className="mt-3"><Barcode value={sku} className="h-6 w-full" /><p className="mt-1 font-mono text-[.65rem] tracking-widest">{sku}</p></div>}
    </div>
  );
}

/** Faixa exibida enquanto o Supabase não está conectado. */
export function DemoBar() {
  return (
    <p role="status" className="glass-lime eyebrow border-x-0 px-4 py-2 text-center text-[.62rem]">
      Modo demonstração · dados de exemplo · nada é salvo até o banco ser conectado
    </p>
  );
}

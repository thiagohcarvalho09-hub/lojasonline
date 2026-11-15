/* Fotografia de estúdio desenhada em SVG: cada peça sobre fundo infinito e bloco de pedra.
   Usada quando o produto ainda não tem foto enviada. */
import type { ReactNode } from "react";

const INK = "#0b0b0c";

const shapes: Record<string, (c: string, id: string) => ReactNode> = {
  blazer: (c) => (
    <g>
      <path d="M122 150 172 112l28 46 28-46 50 38 34 118-30 10-4 152H122l-4-152-30-10Z" fill={c} />
      <path d="M172 112 200 250l28-138M200 250v180" stroke="#fff" strokeOpacity=".22" strokeWidth="2" fill="none" />
      <path d="m172 112-22 66 34 20M228 112l22 66-34 20" stroke="#fff" strokeOpacity=".18" strokeWidth="2" fill="none" />
      <circle cx="200" cy="290" r="4" fill="#fff" fillOpacity=".5" /><circle cx="200" cy="330" r="4" fill="#fff" fillOpacity=".5" />
      <path d="M138 345h34M228 345h34" stroke="#fff" strokeOpacity=".2" strokeWidth="2" />
    </g>
  ),
  coat: (c) => (
    <g>
      <path d="M126 120 174 88l26 40 26-40 48 32 32 140-28 8-2 222H124l-2-222-28-8Z" fill={c} />
      <path d="M174 88 200 230l26-142M200 230v220" stroke="#fff" strokeOpacity=".22" strokeWidth="2" fill="none" />
      <path d="M124 300h152" stroke="#fff" strokeOpacity=".3" strokeWidth="6" />
      <rect x="190" y="292" width="20" height="16" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" />
    </g>
  ),
  bag: (c, id) => (
    <g>
      <path d="M150 258c0-120 100-120 100-120" stroke={c} strokeWidth="9" fill="none" transform="translate(0 0)" />
      <path d="M150 262c0-124 100-124 100-4" stroke={c} strokeWidth="9" fill="none" />
      <path d="M112 258h176l22 162H90Z" fill={c} />
      <path d="M112 258h176l-60 96a34 34 0 0 1-56 0Z" fill="#fff" fillOpacity=".1" />
      <rect x="189" y="338" width="22" height="26" rx="3" fill={`url(#chrome-${id})`} />
    </g>
  ),
  sunglasses: (c, id) => (
    <g>
      <path d="M70 250q130-30 260 0" stroke={c} strokeWidth="10" fill="none" />
      <rect x="62" y="236" width="128" height="92" rx="34" fill={c} />
      <rect x="210" y="236" width="128" height="92" rx="34" fill={c} />
      <rect x="78" y="250" width="96" height="64" rx="24" fill={`url(#lens-${id})`} />
      <rect x="226" y="250" width="96" height="64" rx="24" fill={`url(#lens-${id})`} />
      <path d="M92 262q16-10 34-6M240 262q16-10 34-6" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  earring: (_c, id) => (
    <g>
      <path d="M150 150c-48 80-58 150 0 182 58-32 48-102 0-182Z" fill={`url(#chrome-${id})`} />
      <path d="M262 190c-40 68-48 126 0 152 48-26 40-84 0-152Z" fill={`url(#chrome-${id})`} />
      <path d="M134 250c-6 30 0 50 14 62M250 270c-5 24 0 40 10 50" stroke="#fff" strokeOpacity=".8" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="150" cy="140" r="7" fill="none" stroke={`url(#chrome-${id})`} strokeWidth="3" />
      <circle cx="262" cy="180" r="7" fill="none" stroke={`url(#chrome-${id})`} strokeWidth="3" />
    </g>
  ),
  cuff: (_c, id) => (
    <g>
      <path d="M96 300c0-70 208-90 208-6 0 30-30 20-40 44-14 34-60 50-104 40-40-10-64-40-64-78Z" fill={`url(#chrome-${id})`} />
      <ellipse cx="200" cy="296" rx="72" ry="30" fill={INK} fillOpacity=".78" />
      <path d="M112 300c10-34 70-48 120-44" stroke="#fff" strokeOpacity=".85" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  ),
  ring: (_c, id) => (
    <g fill="none" stroke={`url(#chrome-${id})`} strokeWidth="22">
      <ellipse cx="172" cy="330" rx="62" ry="40" />
      <ellipse cx="232" cy="318" rx="62" ry="40" />
      <path d="M124 318c10-18 36-28 62-26" stroke="#fff" strokeOpacity=".8" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  dress: (c) => (
    <g>
      <path d="M172 96v40M228 96v40" stroke={c} strokeWidth="5" />
      <path d="M166 132q34 22 68 0l12 76 46 240H108l46-240Z" fill={c} />
      <path d="M176 210q24 10 48 0M222 300l28 148" stroke="#fff" strokeOpacity=".2" strokeWidth="2" fill="none" />
    </g>
  ),
  trousers: (c) => (
    <g>
      <path d="M138 96h124l26 352h-72l-16-240-16 240h-72Z" fill={c} />
      <path d="M138 116h124M168 116l-6 60M232 116l6 60" stroke="#fff" strokeOpacity=".22" strokeWidth="2" fill="none" />
    </g>
  ),
  shirt: (c) => (
    <g>
      <path d="m160 116 40 26 40-26 66 34 22 96-40 12-8-40v212H120V218l-8 40-40-12 22-96Z" fill={c} stroke={INK} strokeOpacity=".12" />
      <path d="m160 116 40 44 40-44M200 160v270" stroke={INK} strokeOpacity=".25" strokeWidth="2" fill="none" />
      {[200, 250, 300, 350].map((y) => <circle key={y} cx="200" cy={y} r="3" fill={INK} fillOpacity=".4" />)}
    </g>
  ),
  heel: (c) => (
    <g>
      <path d="M92 296c40 4 76 30 112 62 30 26 70 36 108 40 14 2 18 20 4 22H206c-30 0-44-22-66-40l-20 0-6 62h-14Z" fill={c} />
      <path d="M100 312l8 110" stroke={c} strokeWidth="7" />
      <path d="M110 306c30 8 60 30 90 56" stroke="#fff" strokeOpacity=".3" strokeWidth="3" fill="none" />
    </g>
  ),
  boot: (c) => (
    <g>
      <path d="M150 90h84l-4 250c40 20 86 26 92 62 2 12-4 20-14 20H150Z" fill={c} />
      <path d="M150 422h60v22h-60z" fill={c} />
      <path d="M164 104l-2 300" stroke="#fff" strokeOpacity=".2" strokeWidth="3" />
    </g>
  ),
  belt: (c, id) => (
    <g>
      <path d="M60 300q140-60 280 0" stroke={c} strokeWidth="26" fill="none" strokeLinecap="round" />
      <path d="M60 300q140 70 280 0" stroke={c} strokeWidth="26" fill="none" strokeLinecap="round" strokeOpacity=".85" />
      <ellipse cx="200" cy="336" rx="34" ry="24" fill="none" stroke={`url(#chrome-${id})`} strokeWidth="9" />
    </g>
  ),
  scarf: (c) => (
    <g>
      <path d="M100 150q80-50 200 0-30 90 10 180-70 60-220 0 40-90 10-180Z" fill={c} />
      <path d="M118 168q70-36 164 0M114 318q90 40 172 0" stroke="#fff" strokeOpacity=".45" strokeWidth="3" fill="none" />
      <path d="M150 190q50 60 100 0M150 290q50-60 100 0" stroke={INK} strokeOpacity=".3" strokeWidth="2" fill="none" />
    </g>
  ),
  skirt: (c) => (
    <g>
      <rect x="146" y="120" width="108" height="20" fill={c} />
      <path d="M146 140h108l22 290H124Z" fill={c} />
      <path d="M200 330v100M166 150l-14 270" stroke="#fff" strokeOpacity=".22" strokeWidth="2" />
    </g>
  ),
  knit: (c) => (
    <g>
      <path d="M168 96h64v36l70 30 26 150-40 10-12-70v230H124V212l-12 70-40-10 26-150 70-30Z" fill={c} stroke={INK} strokeOpacity=".12" />
      {[150, 175, 200, 225, 250].map((x) => <path key={x} d={`M${x} 150v290`} stroke={INK} strokeOpacity=".14" strokeWidth="2" />)}
      <path d="M168 114h64" stroke={INK} strokeOpacity=".2" strokeWidth="2" />
    </g>
  ),
};

export const ART_KEYS = Object.keys(shapes);

export function ProductArt({ art, tone = "#cfcac0", color = INK, className = "" }: { art: string; tone?: string; color?: string; className?: string }) {
  const id = `${art}-${tone.replace("#", "")}-${color.replace("#", "")}`;
  const draw = shapes[art] ?? shapes.blazer;
  const light = /^#(f|e|d)/i.test(color);
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="">
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone} /><stop offset=".72" stopColor={tone} /><stop offset="1" stopColor="#fff" stopOpacity=".55" />
        </linearGradient>
        <radialGradient id={`spot-${id}`} cx=".32" cy=".2" r=".9">
          <stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset=".55" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".18" />
        </radialGradient>
        <linearGradient id={`chrome-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fdfdfd" /><stop offset=".3" stopColor="#b4b8be" /><stop offset=".5" stopColor="#4a4d53" />
          <stop offset=".62" stopColor="#eef0f2" /><stop offset=".85" stopColor="#8d9198" /><stop offset="1" stopColor="#f6f7f8" />
        </linearGradient>
        <linearGradient id={`lens-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a211b" /><stop offset="1" stopColor="#8a7460" stopOpacity=".85" />
        </linearGradient>
        <filter id={`stone-${id}`}><feTurbulence type="fractalNoise" baseFrequency=".035 .09" numOctaves="3" seed="7" /><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .2  0 0 0 0 .2  0 0 0 .35 0" /><feComposite in2="SourceGraphic" operator="in" /></filter>
      </defs>
      <rect width="400" height="500" fill={`url(#bg-${id})`} />
      <rect width="400" height="500" fill={`url(#spot-${id})`} />
      {/* bloco de pedra */}
      <rect y="440" width="400" height="60" fill="#e9e5dc" /><rect y="440" width="400" height="60" filter={`url(#stone-${id})`} />
      <rect y="440" width="400" height="2" fill="#fff" fillOpacity=".8" />
      <ellipse cx="200" cy="442" rx="130" ry="9" fill="#000" fillOpacity=".22" />
      <g stroke={light ? "rgba(11,11,12,.25)" : "none"}>{draw(color, id)}</g>
    </svg>
  );
}

/** Foto enviada pela loja ou, na falta dela, a ilustração de estúdio. */
export function ProductImage({ product, color, className = "" }: { product: { images?: string[] | null; image?: string | null; art: string; tone: string; name?: string }; color?: string; className?: string }) {
  const src = product.image ?? product.images?.[0];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={product.name ?? ""} loading="lazy" className={`object-cover ${className}`} />;
  }
  return <ProductArt art={product.art} tone={product.tone} color={color} className={className} />;
}

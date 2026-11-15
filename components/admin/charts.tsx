import { brl, brlShort } from "@/lib/format";

/** Curva de faturamento diário. */
export function AreaChart({ data, height = 220 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length < 2) return <p className="grid place-items-center text-sm text-ink/50" style={{ height }}>Sem vendas suficientes no período.</p>;
  const W = 800, H = height, padL = 8, padB = 22, padT = 14;
  const max = Math.max(...data.map((d) => d.value), 1);
  const x = (i: number) => padL + (i / (data.length - 1)) * (W - padL * 2);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(" ");
  const peak = data.reduce((a, d, i) => (d.value > data[a].value ? i : a), 0);
  const ticks = [0, Math.floor((data.length - 1) / 2), data.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Faturamento diário; pico de ${brl(data[peak].value)} em ${data[peak].label}`}>
      <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1546ff" stopOpacity=".32" /><stop offset="1" stopColor="#1546ff" stopOpacity="0" /></linearGradient></defs>
      {[0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1={padL} x2={W - padL} y1={y(max * t)} y2={y(max * t)} stroke="#0b0b0c" strokeOpacity=".12" strokeDasharray="3 5" />)}
      <path d={`${line} L${x(data.length - 1)} ${H - padB} L${x(0)} ${H - padB} Z`} fill="url(#area)" />
      <path d={line} fill="none" stroke="#1546ff" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1={padL} x2={W - padL} y1={H - padB} y2={H - padB} stroke="#0b0b0c" />
      <circle cx={x(peak)} cy={y(data[peak].value)} r="5" fill="#dcf24e" stroke="#0b0b0c" strokeWidth="1.5" />
      <text x={Math.min(Math.max(x(peak), 60), W - 60)} y={Math.max(y(data[peak].value) - 10, 11)} textAnchor="middle" fontSize="12" fontWeight="700">{brlShort(data[peak].value)}</text>
      {ticks.map((i) => <text key={i} x={x(i)} y={H - 6} fontSize="11" textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fill="#55524c">{data[i].label}</text>)}
    </svg>
  );
}

/** Barras horizontais com rótulo e valor — ranking de categorias, canais, formas de pagamento. */
export function BarList({ rows, format = brl }: { rows: { label: string; value: number; hint?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className="py-6 text-sm text-ink/50">Sem dados no período.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.label}{r.hint && <span className="ml-2 text-ink/50">{r.hint}</span>}</span>
            <span className="tnum font-bold">{format(r.value)}</span>
          </div>
          <div className="tape mt-1 h-2.5 bg-ink/10"><div className="h-full bg-blue" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function Kpi({ label, value, delta, hint }: { label: string; value: string; delta?: number | null; hint?: string }) {
  return (
    <div className="min-w-0 px-0 py-4 md:px-6 md:first:pl-0">
      <p className="eyebrow">{label}</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <span className="figure text-[clamp(2.4rem,4vw,3.6rem)]">{value}</span>
        {delta != null && Number.isFinite(delta) && (
          <span className={`glass-lime tnum mb-1 px-2 py-0.5 text-sm font-bold ${delta < 0 ? "!bg-none !bg-[#f6d5cf]" : ""}`}>{delta >= 0 ? "+" : "−"}{Math.abs(delta).toFixed(1).replace(".", ",")}% {delta >= 0 ? "↗" : "↘"}</span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-ink/55">{hint}</p>}
    </div>
  );
}

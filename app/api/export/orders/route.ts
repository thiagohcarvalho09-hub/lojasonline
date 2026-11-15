import { createClient } from "@/lib/supabase/server";
import { CHANNEL, PAYMENT, STATUS } from "@/lib/format";

// CSV dos pedidos (separador ";" e BOM para abrir direto no Excel em pt-BR). O RLS limita à equipe.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Não autorizado", { status: 401 });
  const status = new URL(request.url).searchParams.get("status");
  let query = supabase.from("orders")
    .select("number, created_at, status, channel, payment_method, subtotal, discount, shipping, total, coupon_code, tracking_code, customers(name, email, phone)")
    .order("created_at", { ascending: false }).limit(5000);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return new Response("Erro ao exportar", { status: 500 });
  // aspas duplicadas + apóstrofo antes de =,+,-,@ para o Excel não interpretar como fórmula
  const cell = (v: unknown) => `"${String(v ?? "").replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"`;
  const money = (v: unknown) => Number(v ?? 0).toFixed(2).replace(".", ",");
  const rows = [
    ["Pedido", "Data", "Status", "Canal", "Pagamento", "Cliente", "E-mail", "Telefone", "Subtotal", "Desconto", "Frete", "Total", "Cupom", "Rastreio"],
    ...(data ?? []).map((o) => {
      const c = o.customers as unknown as { name: string; email: string; phone: string } | null;
      return [o.number, new Date(o.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), STATUS[o.status]?.label, CHANNEL[o.channel], PAYMENT[o.payment_method],
        c?.name, c?.email, c?.phone, money(o.subtotal), money(o.discount), money(o.shipping), money(o.total), o.coupon_code, o.tracking_code];
    }),
  ];
  return new Response("﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}

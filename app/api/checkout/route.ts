import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Fecha o pedido. Preços, estoque, cupom e frete são conferidos dentro do banco (place_order).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items)) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p: {
      customer: body.customer ?? {},
      address: body.address ?? {},
      items: body.items.map((i: { variant_id: string; quantity: number }) => ({ variant_id: i.variant_id, quantity: i.quantity })),
      coupon: body.coupon ?? "",
      payment_method: body.payment_method ?? "pix",
      notes: body.notes ?? "",
      channel: body.channel,
      mark_paid: body.mark_paid,
    },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 422 });
  return NextResponse.json(data);
}

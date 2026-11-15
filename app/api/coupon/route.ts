import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { code, subtotal } = await request.json().catch(() => ({}));
  if (typeof code !== "string" || !code.trim()) return NextResponse.json({ valid: false, message: "Informe um cupom." });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_coupon", { p_code: code, p_subtotal: Number(subtotal) || 0 });
  if (error) return NextResponse.json({ valid: false, message: "Não foi possível validar o cupom." }, { status: 500 });
  return NextResponse.json(data);
}

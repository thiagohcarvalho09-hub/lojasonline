import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { product, delta } = await request.json().catch(() => ({}));
  if (typeof product !== "string") return NextResponse.json({ ok: false }, { status: 400 });
  const supabase = await createClient();
  await supabase.rpc("bump_wish", { p_product: product, p_delta: delta > 0 ? 1 : -1 });
  return NextResponse.json({ ok: true });
}

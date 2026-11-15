import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").insert({
    product_id: b.product_id, author: String(b.author ?? "").trim(), rating: Number(b.rating), comment: String(b.comment ?? "").trim(), approved: false,
  });
  if (error) return NextResponse.json({ ok: false }, { status: 422 });
  return NextResponse.json({ ok: true });
}

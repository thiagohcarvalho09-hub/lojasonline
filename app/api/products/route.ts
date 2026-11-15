import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT } from "@/lib/shop";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter((s) => UUID.test(s)).slice(0, 60);
  if (!ids.length) return NextResponse.json({ products: [] });
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).in("id", ids).eq("status", "active");
  return NextResponse.json({ products: data ?? [] });
}

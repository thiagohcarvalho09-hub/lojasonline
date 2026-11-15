import type { Metadata } from "next";
import { PageHead } from "@/components/admin/bits";
import { PosForm } from "@/components/admin/pos-form";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT } from "@/lib/shop";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Nova venda" };

export default async function NovaVenda() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("status", "active").order("name");
  return (
    <>
      <PageHead eyebrow="Pedidos / balcão & WhatsApp" title="Nova venda." />
      <PosForm products={(data ?? []) as unknown as Product[]} />
    </>
  );
}

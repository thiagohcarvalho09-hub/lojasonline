import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_PRODUCT_SELECT } from "@/lib/shop";
import type { Product } from "@/lib/types";

export default async function Produto({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: categories }, { data: collections }, { data: suppliers }] = await Promise.all([
    supabase.from("categories").select("id, name").order("position"),
    supabase.from("collections").select("id, name").order("position"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);
  let product: Product | null = null;
  if (id !== "novo") {
    const { data } = await supabase.from("products").select(ADMIN_PRODUCT_SELECT).eq("id", id).maybeSingle();
    if (!data) notFound();
    product = data as unknown as Product;
  }
  return (
    <>
      <p className="eyebrow"><Link href="/admin/produtos" className="hover:text-blue">Produtos</Link> / {product ? "editar" : "novo"}</p>
      <h1 className="serif mb-5 text-[clamp(3rem,6.5vw,5.6rem)]">{product ? product.name : "Nova peça."}</h1>
      {(await searchParams).salvo && <p role="status" className="glass-lime mb-5 p-3 text-sm font-bold">Peça criada. Ela já aparece na loja se estiver ativa.</p>}
      <ProductForm product={product} categories={categories ?? []} collections={collections ?? []} suppliers={suppliers ?? []} />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Panel } from "@/components/admin/bits";
import { StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { brl } from "@/lib/format";

export const metadata: Metadata = { title: "Busca" };

export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").replace(/[%_,()]/g, " ").trim();
  const supabase = await createClient();
  const n = Number(q.replace(/\D/g, "")) || 0;
  const [{ data: products }, { data: customers }, { data: orders }] = q ? await Promise.all([
    supabase.from("products").select("id, name, sku, price").or(`name.ilike.%${q}%,sku.ilike.%${q}%`).limit(10),
    supabase.from("customers").select("id, name, email").or(`name.ilike.%${q}%,email.ilike.%${q}%`).limit(10),
    supabase.from("orders").select("id, number, status, total, customers!inner(name)").or(`number.eq.${n}`).limit(10),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  const byCustomer = q && !orders?.length
    ? (await supabase.from("orders").select("id, number, status, total, customers!inner(name)").ilike("customers.name", `%${q}%`).order("created_at", { ascending: false }).limit(10)).data
    : orders;
  const none = <p className="text-sm text-ink/55">Nada encontrado.</p>;
  return (
    <>
      <PageHead eyebrow={`Busca / “${q}”`} title="Encontrado." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Peças">{products?.length ? <ul>{products.map((p) => <li key={p.id} className="stitch-b py-2"><Link href={`/admin/produtos/${p.id}`} className="flex justify-between gap-3 hover:text-blue"><span className="font-bold">{p.name}</span><span className="tnum">{brl(p.price)}</span></Link></li>)}</ul> : none}</Panel>
        <Panel title="Pedidos">{byCustomer?.length ? <ul>{byCustomer.map((o) => <li key={o.id} className="stitch-b py-2"><Link href={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-3 hover:text-blue"><span><b className="tnum">#{o.number}</b> {(o.customers as unknown as { name: string }).name}</span><StatusBadge status={o.status} /></Link></li>)}</ul> : none}</Panel>
        <Panel title="Clientes">{customers?.length ? <ul>{customers.map((c) => <li key={c.id} className="stitch-b py-2"><Link href={`/admin/clientes/${c.id}`} className="block hover:text-blue"><b>{c.name}</b><br /><span className="text-sm text-ink/60">{c.email}</span></Link></li>)}</ul> : none}</Panel>
      </div>
    </>
  );
}

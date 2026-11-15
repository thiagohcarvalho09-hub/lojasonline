import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderView, type PublicOrder } from "@/components/shop/order-view";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/shop";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };

export default async function Pedido({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ novo?: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const supabase = await createClient();
  const [{ data }, settings, { novo }] = await Promise.all([supabase.rpc("order_public", { p_token: token }), getSettings(), searchParams]);
  if (!data) notFound();
  const order = data as PublicOrder;
  return (
    <div className="pt-8 md:pt-12">
      <p className="eyebrow">{novo ? "Pedido confirmado" : "Acompanhar pedido"}</p>
      <h1 className="serif mb-8 text-[clamp(3rem,7vw,5.5rem)]">{novo ? `Obrigada, ${order.customer_name.split(" ")[0]}.` : "Seu pedido."}</h1>
      <OrderView order={order} pixKey={settings.pix_key} />
    </div>
  );
}

import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { getSettings } from "@/lib/shop";

export const metadata: Metadata = { title: "Checkout" };

export default async function Checkout() {
  const s = await getSettings();
  return <CheckoutForm flat={s.shipping_flat} freeOver={s.free_shipping_over} />;
}

import { DemoBar } from "@/components/ui";
import { ShopHeader } from "@/components/shop/header";
import { ShopFooter } from "@/components/shop/footer";
import { CartProvider } from "@/components/shop/cart";
import { getCategories, getSettings } from "@/lib/shop";
import { getViewer, isConfigured } from "@/lib/supabase/server";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, viewer] = await Promise.all([getSettings(), getCategories(), getViewer()]);
  const staff = viewer.profile?.role === "owner" || viewer.profile?.role === "staff";
  return (
    <CartProvider freeOver={settings.free_shipping_over} shippingFlat={settings.shipping_flat}>
      {!isConfigured && <DemoBar />}
      <ShopHeader settings={settings} categories={categories} staff={staff} />
      <main className="mx-auto max-w-[1400px] px-4 md:px-8">{children}</main>
      <ShopFooter settings={settings} />
    </CartProvider>
  );
}

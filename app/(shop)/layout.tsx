import { ShopHeader } from "@/components/shop/header";
import { SideMenu } from "@/components/shop/side-menu";
import { ShopFooter } from "@/components/shop/footer";
import { CartProvider } from "@/components/shop/cart";
import { getCategories, getSettings } from "@/lib/shop";
import { getViewer } from "@/lib/supabase/server";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, viewer] = await Promise.all([getSettings(), getCategories(), getViewer()]);
  const staff = viewer.profile?.role === "owner" || viewer.profile?.role === "staff";
  const email = viewer.user?.email ?? null;
  return (
    <CartProvider freeOver={settings.free_shipping_over} shippingFlat={settings.shipping_flat}>
      <SideMenu categories={categories} staff={staff} email={email} season={settings.season} />
      <div className="lg:pl-16">
        <ShopHeader settings={settings} categories={categories} staff={staff} signedIn={Boolean(email)} />
        <main className="px-4 md:px-8 2xl:px-12">{children}</main>
        <ShopFooter settings={settings} />
      </div>
    </CartProvider>
  );
}

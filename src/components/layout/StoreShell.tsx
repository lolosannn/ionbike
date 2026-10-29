import { store, whatsappUrl } from "@/config/store";
import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ReviewsSection } from "@/components/layout/ReviewsMarquee";
import { PromosProvider } from "@/components/promos/PromosProvider";
import { Topbar } from "@/components/promos/Promos";
import { WhatsappIcon } from "@/components/icons";
import { Analytics } from "@/components/layout/Analytics";
import { formatPrice } from "@/lib/pricing";
import { isStaticDemo } from "@/lib/catalog";
import { getPromos } from "@/lib/promos";

/** Todo lo que rodea a las páginas de la tienda: barra, header, reseñas, footer y WhatsApp */
export async function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <PromosProvider promos={await getPromos()}>
        {isStaticDemo && (
          <div className="demo-bar">Vista previa · los pagos y pedidos están desactivados</div>
        )}
        <Topbar
          messages={[
            `Envío gratis a todo el país desde ${formatPrice(store.freeShippingFrom)}`,
            `Hasta ${store.installments} cuotas sin interés`,
            "Retirá gratis en Monte Grande",
          ]}
        />
        <Header />
        <main>{children}</main>
        <Analytics active={!isStaticDemo} />
        <ReviewsSection />
        <Footer />
        <a href={whatsappUrl()} className="wa-float" aria-label="Escribinos por WhatsApp" target="_blank" rel="noreferrer">
          <WhatsappIcon />
        </a>
      </PromosProvider>
    </CartProvider>
  );
}

import type { Metadata } from "next";
import { store, whatsappUrl } from "@/config/store";
import { CartProvider } from "@/components/cart/CartProvider";
import { SplashLoader } from "@/components/loader/BikeLoader";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsappIcon } from "@/components/icons";
import { formatPrice } from "@/lib/pricing";
import { isStaticDemo } from "@/lib/catalog";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/barlow-condensed/700-italic.css";
import "@fontsource/barlow-condensed/800-italic.css";
import "@fontsource/barlow-condensed/900-italic.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "./globals.css";


export const metadata: Metadata = {
  title: { default: "IonBikeStore — Bicicletas, repuestos y accesorios", template: "%s | IonBikeStore" },
  description: "Bicicletas MTB, gravel, ruta, dirt jump y e-bikes. Envío a todo el país y retiro en Monte Grande.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SplashLoader />
        <CartProvider>
          {isStaticDemo && (
            <div className="demo-bar">Vista previa · los pagos y pedidos están desactivados</div>
          )}
          <div className="topbar">
            <div className="container">
              <span>Envío gratis a todo el país desde {formatPrice(store.freeShippingFrom)}</span>
              <span>Hasta {store.installments} cuotas sin interés</span>
              <span>Retirá gratis en Monte Grande</span>
            </div>
          </div>
          <Header />
          <main>{children}</main>
          <Footer />
          <a href={whatsappUrl()} className="wa-float" aria-label="Escribinos por WhatsApp" target="_blank" rel="noreferrer">
            <WhatsappIcon />
          </a>
        </CartProvider>
      </body>
    </html>
  );
}

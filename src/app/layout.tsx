import type { Metadata } from "next";
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

// La tienda arma su header y footer en (tienda)/layout.tsx; el panel de administración, en admin/layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

import type { NextConfig } from "next";

// DEMO_STATIC=1 genera la vista previa estática para GitHub Pages: sin base de datos,
// sin checkout real ni webhooks (los archivos *.server.tsx/ts quedan afuera).
const staticDemo = process.env.DEMO_STATIC === "1";
const isDev = process.env.NODE_ENV === "development";

// Política de contenido: solo se cargan recursos propios, salvo los embebidos de Google Maps
// y YouTube. Los scripts inline los necesita Next para hidratar la página.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // El video de la guía de talles puede ser un .mp4 externo (store.sizeGuideVideo)
  "media-src 'self' https:",
  "connect-src 'self'",
  "frame-src https://www.google.com https://maps.google.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  // Sin JavaScript, el checkout redirige a Mercado Pago después de enviar el formulario
  "form-action 'self' https://*.mercadopago.com.ar https://*.mercadopago.com",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Los navegadores solo la toman por HTTPS: en local (http) no tiene efecto
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = staticDemo
  ? {
      output: "export",
      basePath: process.env.PAGES_BASE_PATH || undefined,
      trailingSlash: true,
      images: { unoptimized: true },
      pageExtensions: ["demo.tsx", "tsx", "ts"],
    }
  : {
      output: "standalone",
      pageExtensions: ["server.tsx", "server.ts", "tsx", "ts"],
      poweredByHeader: false,
      experimental: {
        // Los formularios mandan unos pocos KB; un tope bajo corta pedidos gigantes
        serverActions: { bodySizeLimit: "200kb" },
      },
      async headers() {
        return [
          { source: "/:path*", headers: securityHeaders },
          {
            // El link del pedido funciona como contraseña: no se guarda en cachés ni se indexa
            source: "/pedido/:token*",
            headers: [
              { key: "Cache-Control", value: "no-store" },
              { key: "Referrer-Policy", value: "no-referrer" },
              { key: "X-Robots-Tag", value: "noindex, nofollow" },
            ],
          },
          { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
        ];
      },
    };

export default nextConfig;

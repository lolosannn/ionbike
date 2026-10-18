import type { NextConfig } from "next";

// DEMO_STATIC=1 genera la vista previa estática para GitHub Pages: sin base de datos,
// sin checkout real ni webhooks (los archivos *.server.tsx/ts quedan afuera).
const staticDemo = process.env.DEMO_STATIC === "1";

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
    };

export default nextConfig;

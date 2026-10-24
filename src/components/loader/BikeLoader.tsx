"use client";

import { useEffect, useRef } from "react";
import { bikeLoaderHtml, runBikeLoader } from "./bike-loader";

/** Pantalla de carga al abrir el sitio: se muestra antes de que cargue React. */
export function SplashLoader() {
  return (
    <>
      <div id="bike-splash" className="bike-loader bike-splash" aria-hidden="true" dangerouslySetInnerHTML={{ __html: bikeLoaderHtml }} />
      <script
        dangerouslySetInnerHTML={{
          __html: `(${runBikeLoader.toString()})(document.getElementById("bike-splash"),{splash:true});`,
        }}
      />
    </>
  );
}

/** Carga entre páginas (app/loading.tsx). */
export function PageLoader() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return runBikeLoader(ref.current, { splash: false });
  }, []);
  return (
    <div className="bike-loader bike-page-loader" role="status">
      <div ref={ref} dangerouslySetInnerHTML={{ __html: bikeLoaderHtml }} />
    </div>
  );
}

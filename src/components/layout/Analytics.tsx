"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Avisa al servidor de cada página vista (estadísticas propias, sin cookies).
// En la vista previa estática no hay servidor: no se manda nada.
let enabled = false;

function send(data: Record<string, string>) {
  if (!enabled) return;
  const body = JSON.stringify({ ...data, p: window.location.pathname });
  try {
    if (!navigator.sendBeacon?.("/api/v", new Blob([body], { type: "text/plain" }))) {
      fetch("/api/v", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    // Las estadísticas nunca molestan al cliente
  }
}

/** Producto agregado al carrito */
export function trackCart(slug: string) {
  send({ t: "cart", s: slug });
}

export function Analytics({ active }: { active: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    enabled = active;
  }, [active]);
  useEffect(() => {
    if (!active) return;
    enabled = true;
    // El origen solo cuenta en la primera página de la visita
    const first = !sessionStorageGet("ion-v");
    sessionStorageSet("ion-v", "1");
    const utm = new URLSearchParams(window.location.search).get("utm_source") ?? "";
    // f: primera página de la visita (de ahí sale el origen: Google, Instagram, directo…)
    send(first ? { t: "view", f: "1", r: document.referrer, u: utm } : { t: "view" });
  }, [pathname, active]);
  return null;
}

function sessionStorageGet(k: string) {
  try { return sessionStorage.getItem(k); } catch { return null; }
}
function sessionStorageSet(k: string, v: string) {
  try { sessionStorage.setItem(k, v); } catch { /* modo privado */ }
}

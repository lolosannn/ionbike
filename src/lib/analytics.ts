import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

// Estadísticas propias, sin cookies ni servicios de terceros. Cada visitante se cuenta con un hash
// de su IP y navegador que cambia todos los días: sirve para saber cuántas personas distintas
// entraron, pero no permite seguir a nadie ni guarda la IP.
export type EventType = "view" | "cart" | "order" | "paid" | "inquiry" | "booking";

const key = process.env.ADMIN_SECRET || randomBytes(32).toString("hex");
const bots = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python|node-fetch|axios|go-http/i;

const dayKey = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

function device(ua: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

/** Visitante anónimo del pedido actual, o null si es un robot */
export async function currentVisitor() {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  if (!ua || bots.test(ua)) return null;
  const visitor = createHmac("sha256", key).update(`${dayKey()}|${await clientIp()}|${ua}`).digest("base64url").slice(0, 22);
  return { visitor, device: device(ua) };
}

/** "https://l.instagram.com/…" → "instagram.com". Las visitas desde el mismo sitio no son una fuente. */
export function sourceFrom(referrer: string | null | undefined, utm: string | null | undefined, ownHost: string | null) {
  if (utm) return utm.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40) || null;
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^(www|l|lm|m|mobile)\./, "");
    if (!host || (ownHost && host === ownHost.replace(/^www\./, "").split(":")[0])) return null;
    return host.slice(0, 60);
  } catch {
    return null;
  }
}

/** Registra un evento. Nunca corta lo que se esté haciendo si falla. */
export async function track(type: EventType, data: { path?: string; source?: string | null; productId?: string | null; value?: number } = {}) {
  try {
    const v = await currentVisitor();
    // Los pagos llegan por webhook (sin navegador): se registran igual
    if (!v && type !== "paid") return;
    await db.analyticsEvent.create({
      data: {
        type,
        visitor: v?.visitor ?? "servidor",
        device: v?.device ?? null,
        path: data.path?.slice(0, 300) ?? null,
        source: data.source ?? null,
        productId: data.productId ?? null,
        value: data.value ?? null,
      },
    });
  } catch (e) {
    console.error("No se pudo registrar la estadística", e);
  }
}

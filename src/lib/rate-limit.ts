import { headers } from "next/headers";

// Límite de pedidos por IP en memoria. Alcanza para un único servidor (docker compose);
// si algún día corre en varias instancias, hay que pasarlo a Redis o a la base de datos.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

/** Suma un intento y devuelve false si la clave pasó el tope en la ventana. */
export function hit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= max;
}

/**
 * IP del cliente. En producción la app está detrás de Caddy (docker-compose.yml), que pisa
 * X-Forwarded-For con la IP real; se toma el último valor, que es el que agrega el proxy propio.
 * Sin proxy (desarrollo) todo el tráfico cuenta como una sola IP.
 */
export async function clientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return forwarded?.at(-1) || h.get("x-real-ip") || "local";
}

export const limits = {
  order: { max: 5, windowMs: 10 * 60_000 },
  booking: { max: 5, windowMs: 10 * 60_000 },
  quote: { max: 40, windowMs: 5 * 60_000 },
  qrRenew: { max: 10, windowMs: 10 * 60_000 },
  // La página del QR consulta cada 5 segundos
  qrCheck: { max: 150, windowMs: 10 * 60_000 },
  // Ingreso al panel: además, cada cuenta se traba 15 minutos tras 5 intentos fallidos
  adminLogin: { max: 10, windowMs: 15 * 60_000 },
  adminUpload: { max: 120, windowMs: 10 * 60_000 },
  stats: { max: 300, windowMs: 10 * 60_000 },
  inquiry: { max: 5, windowMs: 10 * 60_000 },
} as const;

/** true si la IP todavía puede usar esa acción. */
export async function allowed(action: keyof typeof limits) {
  const { max, windowMs } = limits[action];
  return hit(`${action}:${await clientIp()}`, max, windowMs);
}

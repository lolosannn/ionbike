// Cotización de envíos con la API de Andreani (https://apis.andreani.com).
// Hace falta un contrato con Andreani: usuario y contraseña de la API, número de cliente
// y número de contrato del servicio a domicilio.
import { store } from "@/config/store";
import { packagesFor, type ShippingLine } from "@/lib/shipping";

export function isAndreaniConfigured() {
  const e = process.env;
  return Boolean(e.ANDREANI_USER && e.ANDREANI_PASSWORD && e.ANDREANI_CLIENTE && e.ANDREANI_CONTRATO);
}

function baseUrl() {
  return (process.env.ANDREANI_API_URL ?? "https://apis.andreani.com").replace(/\/$/, "");
}

// El token de la API dura 24 h; se renueva un rato antes
let token: { value: string; expires: number } | null = null;

async function getToken() {
  if (token && token.expires > Date.now()) return token.value;
  const auth = Buffer.from(`${process.env.ANDREANI_USER}:${process.env.ANDREANI_PASSWORD}`).toString("base64");
  const res = await fetch(`${baseUrl()}/login`, {
    headers: { Authorization: `Basic ${auth}` },
    signal: AbortSignal.timeout(8000),
  });
  const value = res.headers.get("x-authorization-token");
  if (!res.ok || !value) throw new Error(`Andreani login: ${res.status}`);
  token = { value, expires: Date.now() + 20 * 60 * 60 * 1000 };
  return value;
}

/** Costo del envío a domicilio en centavos, IVA incluido. */
export async function andreaniQuote(zip: string, lines: ShippingLine[]): Promise<number> {
  const params = new URLSearchParams({
    cpDestino: zip,
    contrato: process.env.ANDREANI_CONTRATO!,
    cliente: process.env.ANDREANI_CLIENTE!,
  });
  packagesFor(lines).forEach((p, i) => {
    const { kilos, cm } = store.shipping.packages[p.type];
    params.set(`bultos[${i}][kilos]`, String(kilos));
    params.set(`bultos[${i}][volumen]`, String(cm[0] * cm[1] * cm[2]));
    params.set(`bultos[${i}][valorDeclarado]`, String(Math.round(p.value / 100)));
  });
  const res = await fetch(`${baseUrl()}/v1/tarifas?${params}`, {
    headers: { "x-authorization-token": await getToken() },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 401) token = null;
  if (!res.ok) throw new Error(`Andreani tarifas: ${res.status}`);
  const data = await res.json();
  const total = Number(data?.tarifaConIva?.total);
  if (!Number.isFinite(total) || total <= 0) throw new Error("Andreani no devolvió la tarifa");
  return Math.round(total * 100);
}

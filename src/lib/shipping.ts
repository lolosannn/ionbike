// Cálculo de envíos: lo usan el carrito, el checkout y el servidor al crear el pedido.
import { store } from "@/config/store";
import { hasFreeShipping } from "@/lib/pricing";

export const provinces = [
  "Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones",
  "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
  "Santiago del Estero", "Tierra del Fuego", "Tucumán",
] as const;

export type ZoneId = keyof typeof store.shipping.zones;
export type Destination = { zip: string; province: string };
// bulky: bicicleta (viaja en su propia caja grande)
export type ShippingLine = { bulky: boolean; quantity: number; price: number };
export type ShippingQuote = {
  cost: number;
  free: boolean;
  zone: string;
  days: string;
  // "andreani": cotizado en vivo con la API · "tabla": tarifa estimada por zona
  source: "andreani" | "tabla";
};

const zoneByProvince: Record<string, ZoneId> = {
  "Ciudad Autónoma de Buenos Aires": "amba",
  "Buenos Aires": "centro", "Córdoba": "centro", "Santa Fe": "centro", "Entre Ríos": "centro", "La Pampa": "centro",
  "Chubut": "sur", "Santa Cruz": "sur", "Tierra del Fuego": "sur",
};

/** Código postal de 4 dígitos (acepta también el formato CPA, por ejemplo B1842ZAB). */
export function normalizeZip(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  const m = /^[A-Z]?(\d{4})[A-Z]{0,3}$/.exec(s);
  return m ? m[1] : null;
}

export function isValidDestination(d: Destination | null | undefined): d is Destination {
  return Boolean(d && normalizeZip(d.zip) && (provinces as readonly string[]).includes(d.province));
}

export function zoneFor(d: Destination): ZoneId {
  const zip = Number(normalizeZip(d.zip));
  // Conurbano bonaerense: códigos postales 1000 a 1999
  if (d.province === "Buenos Aires" && zip >= 1000 && zip <= 1999) return "amba";
  return zoneByProvince[d.province] ?? "norte";
}

/** Las bicis (y e-bikes) viajan en caja grande; el resto va junto en una caja chica. */
export function isBulkyCategory(...slugs: (string | null | undefined)[]) {
  return slugs.some((s) => s === "bicicletas" || s === "e-bike");
}

/** Bultos del pedido: una caja por bici y una sola caja para todo lo demás. */
export function packagesFor(lines: ShippingLine[]) {
  const bikes = lines.filter((l) => l.bulky).flatMap((l) => Array.from({ length: l.quantity }, () => l.price));
  const small = lines.filter((l) => !l.bulky).reduce((n, l) => n + l.price * l.quantity, 0);
  return [
    ...bikes.map((value) => ({ type: "bike" as const, value })),
    ...(small > 0 ? [{ type: "small" as const, value: small }] : []),
  ];
}

/** Envío según la tabla por zona de store.ts. */
export function estimateShipping(d: Destination, lines: ShippingLine[]): ShippingQuote {
  const zone = store.shipping.zones[zoneFor(d)];
  const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
  const free = hasFreeShipping(subtotal);
  const cost = free ? 0 : packagesFor(lines).reduce((n, p) => n + zone[p.type], 0);
  return { cost, free, zone: zone.label, days: zone.days, source: "tabla" };
}

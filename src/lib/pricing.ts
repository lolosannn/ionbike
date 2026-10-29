import { store } from "@/config/store";

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formatea centavos como pesos: 56597800 → "$ 565.978" */
export function formatPrice(cents: number): string {
  return ars.format(Math.round(cents / 100));
}

export function transferPrice(cents: number): number {
  return Math.round(cents * (1 - store.transferDiscountPct / 100));
}

/** Medios de pago con el descuento de transferencia / efectivo. */
export function hasCashDiscount(method: string): boolean {
  return method === "TRANSFER" || method === "QR" || method === "CASH" || (method === "TICKET" && store.ticketDiscount);
}

export function installmentPrice(cents: number): number {
  return Math.round(cents / store.installments);
}

/** Planes de cuotas para un precio de lista: valor de cada cuota y total a pagar. */
export function financingPlans(cents: number) {
  return store.financing.map(({ cuotas, recargoPct }) => {
    const total = Math.round(cents * (1 + recargoPct / 100));
    return { cuotas, interestFree: recargoPct === 0, cuota: Math.round(total / cuotas), total };
  });
}

/** Porcentaje de descuento sobre el precio anterior tachado, o null si no está en oferta. */
export function discountPct(price: number, compareAt: number | null | undefined): number | null {
  return compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;
}

export function hasFreeShipping(cents: number): boolean {
  return cents >= store.freeShippingFrom;
}

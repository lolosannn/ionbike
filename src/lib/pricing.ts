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

export function installmentPrice(cents: number): number {
  return Math.round(cents / store.installments);
}

export function hasFreeShipping(cents: number): boolean {
  return cents >= store.freeShippingFrom;
}

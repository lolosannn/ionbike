"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { estimateShipping, isValidDestination, type Destination, type ShippingQuote } from "@/lib/shipping";

// Cotiza en el servidor (Andreani o tabla con precios reales). Sin acción, en la vista
// previa estática, se calcula acá con la tabla por zona.
export type QuoteAction = (
  items: { variantId: string; quantity: number }[],
  dest: Destination,
) => Promise<ShippingQuote | null>;

export function useShippingQuote(dest: Destination | null, quoteAction?: QuoteAction) {
  const { items } = useCart();
  const valid = isValidDestination(dest);
  const key = valid ? JSON.stringify([dest, items.map((i) => [i.variantId, i.quantity])]) : "";
  const [result, setResult] = useState<{ key: string; quote: ShippingQuote | null } | null>(null);

  useEffect(() => {
    if (!key || !dest) return;
    const lines = items.map((i) => ({ bulky: i.bulky ?? true, quantity: i.quantity, price: i.price }));
    if (!quoteAction) {
      setResult({ key, quote: estimateShipping(dest, lines) });
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      quoteAction(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), dest)
        .catch(() => estimateShipping(dest, lines))
        .then((quote) => !cancelled && setResult({ key, quote }));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // key resume destino e items: alcanza como dependencia
  }, [key, quoteAction]);

  const current = result?.key === key ? result.quote : null;
  return { quote: current, loading: Boolean(key) && result?.key !== key };
}

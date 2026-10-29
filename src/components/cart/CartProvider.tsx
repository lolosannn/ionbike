"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Destination } from "@/lib/shipping";
import { trackCart } from "@/components/layout/Analytics";

export type CartItem = {
  variantId: string;
  slug: string;
  name: string;
  variantLabel: string;
  image: string | null;
  // Precio unitario de lista en centavos (el servidor lo vuelve a validar al pagar)
  price: number;
  quantity: number;
  maxStock: number;
  // Bicicleta: viaja en caja grande. Los carritos guardados antes de este campo se toman como bici.
  bulky?: boolean;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  // Código postal y provincia para cotizar el envío (se recuerdan entre visitas)
  destination: Destination | null;
  setDestination: (d: Destination | null) => void;
  add: (item: CartItem) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "ion-cart-v1";
const DESTINATION_KEY = "ion-shipping-destination-v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
      const dest = localStorage.getItem(DESTINATION_KEY);
      if (dest) setDestination(JSON.parse(dest));
    } catch {
      // Almacenamiento no disponible: el carrito arranca vacío
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignorar: el carrito sigue funcionando en memoria
    }
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (destination) localStorage.setItem(DESTINATION_KEY, JSON.stringify(destination));
      else localStorage.removeItem(DESTINATION_KEY);
    } catch {
      // Ignorar
    }
  }, [destination, ready]);

  const add = useCallback((item: CartItem) => {
    trackCart(item.slug);
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (!existing) return [...prev, { ...item, quantity: Math.min(item.quantity, item.maxStock) }];
      return prev.map((i) =>
        i.variantId === item.variantId
          ? { ...i, maxStock: item.maxStock, quantity: Math.min(i.quantity + item.quantity, item.maxStock) }
          : i,
      );
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) } : i)),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      ready,
      destination,
      setDestination,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, ready, destination, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}

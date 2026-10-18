"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

/** Vacía el carrito después de crear el pedido y refresca el estado cada tanto. */
export function ClearCart() {
  const { clear, ready } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}

"use server";

import { redirect } from "next/navigation";
import { PaymentMethod, ShippingMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { cancelPendingOrder, createOrder, OutOfStockError } from "@/lib/orders";
import { createPreference, isMercadoPagoConfigured } from "@/lib/mercadopago";

export type CheckoutState = { error?: string } | null;

const MAX_LINES = 20;
const MAX_QTY = 20;

function text(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

export async function placeOrder(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  let items: { variantId: string; quantity: number }[];
  try {
    const raw = JSON.parse(String(form.get("items") ?? "[]"));
    items = (Array.isArray(raw) ? raw : [])
      .slice(0, MAX_LINES)
      .map((i) => ({ variantId: String(i.variantId), quantity: Math.floor(Number(i.quantity)) }))
      .filter((i) => i.variantId && i.quantity >= 1 && i.quantity <= MAX_QTY);
  } catch {
    items = [];
  }
  if (items.length === 0) return { error: "Tu carrito está vacío." };

  const paymentMethod = text(form, "paymentMethod") as PaymentMethod;
  const shippingMethod = text(form, "shippingMethod") as ShippingMethod;
  if (!Object.values(PaymentMethod).includes(paymentMethod)) return { error: "Elegí un medio de pago." };
  if (!Object.values(ShippingMethod).includes(shippingMethod)) return { error: "Elegí cómo recibir tu pedido." };

  const data = {
    name: text(form, "name"),
    email: text(form, "email"),
    phone: text(form, "phone", 40),
    dni: text(form, "dni", 20),
    address: text(form, "address"),
    city: text(form, "city", 100),
    province: text(form, "province", 100),
    zip: text(form, "zip", 12),
    notes: text(form, "notes", 1000),
  };
  if (!data.name || !data.phone || !data.dni) return { error: "Completá nombre, teléfono y DNI." };
  if (!/^\S+@\S+\.\S+$/.test(data.email)) return { error: "Revisá el email." };
  if (shippingMethod === "DELIVERY" && (!data.address || !data.city || !data.province || !data.zip)) {
    return { error: "Completá la dirección de envío." };
  }
  if (paymentMethod === "MERCADOPAGO" && !isMercadoPagoConfigured()) {
    return { error: "El pago con Mercado Pago todavía no está habilitado. Elegí transferencia." };
  }

  let order;
  try {
    order = await createOrder({ items, paymentMethod, shippingMethod, ...data });
  } catch (e) {
    if (e instanceof OutOfStockError) return { error: `${e.message}. Actualizá tu carrito.` };
    throw e;
  }

  if (paymentMethod === "TRANSFER") redirect(`/pedido/${order.publicToken}?nuevo=1`);

  let initPoint: string;
  try {
    const pref = await createPreference({
      orderId: order.id,
      publicToken: order.publicToken,
      email: order.email,
      items: order.items.map((i) => ({
        id: i.variantId,
        title: [i.productName, i.variantLabel].filter(Boolean).join(" - "),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      shippingCost: order.shippingCost,
    });
    await db.order.update({ where: { id: order.id }, data: { mpPreferenceId: pref.id } });
    initPoint = pref.initPoint;
  } catch (e) {
    console.error("Error creando preferencia de Mercado Pago", e);
    await cancelPendingOrder(order.id);
    return { error: "No pudimos conectar con Mercado Pago. Probá de nuevo en unos minutos." };
  }
  redirect(initPoint);
}

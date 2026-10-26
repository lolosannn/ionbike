"use server";

import { redirect } from "next/navigation";
import { PaymentMethod, ShippingMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { attachQr, cancelPendingOrder, syncQrPayment, createOrder, OutOfStockError, quoteShipping } from "@/lib/orders";
import { isValidDestination, type ShippingQuote } from "@/lib/shipping";
import { createPreference, isMercadoPagoConfigured, isQrConfigured } from "@/lib/mercadopago";
import type { CheckoutState } from "./CheckoutForm";

const MAX_LINES = 20;
const MAX_QTY = 20;

function text(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function parseItems(raw: unknown) {
  return (Array.isArray(raw) ? raw : [])
    .slice(0, MAX_LINES)
    .map((i) => ({ variantId: String(i?.variantId), quantity: Math.floor(Number(i?.quantity)) }))
    .filter((i) => i.variantId && i.quantity >= 1 && i.quantity <= MAX_QTY);
}

/** Cotización para el carrito y el checkout: precios de la base y Andreani si está configurado. */
export async function quoteShippingAction(
  rawItems: { variantId: string; quantity: number }[],
  dest: { zip: string; province: string },
): Promise<ShippingQuote | null> {
  const items = parseItems(rawItems);
  const d = { zip: String(dest?.zip ?? "").slice(0, 12), province: String(dest?.province ?? "").slice(0, 100) };
  if (items.length === 0 || !isValidDestination(d)) return null;
  return quoteShipping(items, d);
}

export async function placeOrder(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  let items: { variantId: string; quantity: number }[];
  try {
    items = parseItems(JSON.parse(String(form.get("items") ?? "[]")));
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
  if (shippingMethod === "DELIVERY" && !isValidDestination(data)) {
    return { error: "Revisá el código postal y la provincia." };
  }
  const viaMercadoPago = paymentMethod === "MERCADOPAGO" || paymentMethod === "CARD" || paymentMethod === "TICKET";
  if (viaMercadoPago && !isMercadoPagoConfigured()) {
    return { error: "Ese medio de pago todavía no está habilitado. Elegí transferencia o efectivo en el local." };
  }
  if (paymentMethod === "QR" && !isQrConfigured()) {
    return { error: "El pago con QR todavía no está habilitado. Elegí transferencia al alias." };
  }

  let order;
  try {
    order = await createOrder({ items, paymentMethod, shippingMethod, ...data });
  } catch (e) {
    if (e instanceof OutOfStockError) return { error: `${e.message}. Actualizá tu carrito.` };
    throw e;
  }

  if (paymentMethod === "QR") {
    try {
      await attachQr(order.id);
    } catch (e) {
      console.error("Error creando el QR de Mercado Pago", e);
      await cancelPendingOrder(order.id);
      return { error: "No pudimos generar el QR. Probá de nuevo o elegí transferencia al alias." };
    }
  }
  if (!viaMercadoPago) redirect(`/pedido/${order.publicToken}?nuevo=1`);

  let initPoint: string;
  try {
    const pref = await createPreference({
      orderId: order.id,
      orderNumber: order.number,
      publicToken: order.publicToken,
      email: order.email,
      method: paymentMethod,
      items: order.items.map((i) => ({
        id: i.variantId,
        title: [i.productName, i.variantLabel].filter(Boolean).join(" - "),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      shippingCost: order.shippingCost,
      discount: order.discount,
      total: order.total,
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

/** Genera un QR nuevo para un pedido pendiente (el anterior vence a los 30 minutos). */
export async function renewQr(token: string) {
  const order = await db.order.findUnique({ where: { publicToken: String(token) } });
  if (!order) return;
  await attachQr(order.id).catch((e) => console.error("Error renovando el QR", e));
}

/** Consulta si ya se pagó el QR del pedido. Devuelve true cuando está pagado. */
export async function checkQrPayment(token: string) {
  const order = await db.order.findUnique({ where: { publicToken: String(token) } });
  if (!order) return false;
  if (order.status === "PENDING" && order.mpQrOrderId) {
    await syncQrPayment(order.mpQrOrderId).catch((e) => console.error("Error consultando el QR", e));
    return (await db.order.findUnique({ where: { id: order.id } }))?.status === "PAID";
  }
  return order.status === "PAID";
}

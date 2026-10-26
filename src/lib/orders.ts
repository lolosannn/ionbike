import { randomBytes } from "node:crypto";
import { PaymentMethod, Prisma, ShippingMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { store } from "@/config/store";
import { variantLabel } from "@/lib/variants";
import { andreaniQuote, isAndreaniConfigured } from "@/lib/andreani";
import { estimateShipping, isBulkyCategory, isValidDestination, normalizeZip, type Destination, type ShippingQuote } from "@/lib/shipping";

export class OutOfStockError extends Error {
  constructor(public productName: string) {
    super(`Sin stock suficiente de ${productName}`);
  }
}

export type OrderInput = {
  items: { variantId: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  name: string;
  email: string;
  phone: string;
  dni: string;
  address?: string;
  city?: string;
  province?: string;
  zip?: string;
  notes?: string;
};

/**
 * Cotiza el envío con los precios y categorías de la base de datos.
 * Con credenciales de Andreani cotiza en vivo; si no hay o la API falla, usa la tabla por zona.
 */
export async function quoteShipping(items: { variantId: string; quantity: number }[], dest: Destination): Promise<ShippingQuote> {
  if (!isValidDestination(dest)) throw new Error("Destino de envío inválido");
  const variants = await db.variant.findMany({
    where: { id: { in: items.map((i) => i.variantId) } },
    include: { product: { include: { category: { include: { parent: true } } } } },
  });
  const lines = items.flatMap((i) => {
    const v = variants.find((x) => x.id === i.variantId);
    if (!v) return [];
    const { category } = v.product;
    return [{ bulky: isBulkyCategory(category.slug, category.parent?.slug), quantity: i.quantity, price: v.product.price }];
  });
  const estimate = estimateShipping(dest, lines);
  if (estimate.free || !isAndreaniConfigured()) return estimate;
  try {
    return { ...estimate, cost: await andreaniQuote(normalizeZip(dest.zip)!, lines), source: "andreani" };
  } catch (e) {
    console.error("No se pudo cotizar con Andreani, se usa la tabla", e);
    return estimate;
  }
}

// Transferencia y efectivo al retirar tienen el mismo descuento (no se aplica al envío)
export function transferDiscountFor(method: PaymentMethod, subtotal: number) {
  return method === "TRANSFER" || method === "CASH" ? Math.round((subtotal * store.transferDiscountPct) / 100) : 0;
}

/**
 * Crea el pedido y descuenta el stock en una sola transacción.
 * Los precios salen siempre de la base de datos, nunca del carrito del navegador.
 */
export async function createOrder(input: OrderInput) {
  const isDelivery = input.shippingMethod === "DELIVERY";
  const shipping = isDelivery
    ? await quoteShipping(input.items, { zip: input.zip ?? "", province: input.province ?? "" })
    : null;

  return db.$transaction(async (tx) => {
    const lines: Prisma.OrderItemCreateManyOrderInput[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const variant = await tx.variant.findUnique({ where: { id: item.variantId }, include: { product: true } });
      if (!variant || !variant.product.active || variant.product.onRequest) throw new OutOfStockError("un producto que ya no está disponible");

      const updated = await tx.variant.updateMany({
        where: { id: variant.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count === 0) throw new OutOfStockError(variant.product.name);

      subtotal += variant.product.price * item.quantity;
      lines.push({
        variantId: variant.id,
        productName: variant.product.name,
        variantLabel: variantLabel(variant),
        unitPrice: variant.product.price,
        quantity: item.quantity,
      });
    }

    const discount = transferDiscountFor(input.paymentMethod, subtotal);
    const shippingCost = shipping?.cost ?? 0;

    return tx.order.create({
      data: {
        publicToken: randomBytes(24).toString("base64url"),
        paymentMethod: input.paymentMethod,
        shippingMethod: input.shippingMethod,
        name: input.name,
        email: input.email,
        phone: input.phone,
        dni: input.dni,
        address: isDelivery ? input.address : null,
        city: isDelivery ? input.city : null,
        province: isDelivery ? input.province : null,
        zip: isDelivery ? input.zip : null,
        notes: input.notes || null,
        subtotal,
        discount,
        shippingCost,
        total: subtotal - discount + shippingCost,
        items: { createMany: { data: lines } },
      },
      include: { items: true },
    });
  });
}

/** Cancela un pedido pendiente y devuelve el stock. No hace nada si ya no está pendiente. */
export async function cancelPendingOrder(orderId: string) {
  await db.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "CANCELLED" } });
    if (changed.count === 0) return;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    }
  });
}

/** Marca un pedido como pagado y suma las ventas a cada producto. Idempotente. */
export async function markOrderPaid(orderId: string, mpPaymentId?: string) {
  await db.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "PAID", mpPaymentId },
    });
    if (changed.count === 0) return;
    const items = await tx.orderItem.findMany({ where: { orderId }, include: { variant: true } });
    for (const item of items) {
      await tx.product.update({ where: { id: item.variant.productId }, data: { salesCount: { increment: item.quantity } } });
    }
  });
}

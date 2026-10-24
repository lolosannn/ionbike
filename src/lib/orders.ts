import { randomBytes } from "node:crypto";
import { PaymentMethod, Prisma, ShippingMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { store } from "@/config/store";
import { variantLabel } from "@/lib/variants";

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

export function shippingCostFor(method: ShippingMethod, subtotal: number) {
  if (method === "PICKUP") return 0;
  return subtotal >= store.freeShippingFrom ? 0 : store.shippingFlatRate;
}

export function transferDiscountFor(method: PaymentMethod, subtotal: number) {
  return method === "TRANSFER" ? Math.round((subtotal * store.transferDiscountPct) / 100) : 0;
}

/**
 * Crea el pedido y descuenta el stock en una sola transacción.
 * Los precios salen siempre de la base de datos, nunca del carrito del navegador.
 */
export async function createOrder(input: OrderInput) {
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
    const shippingCost = shippingCostFor(input.shippingMethod, subtotal);
    const isDelivery = input.shippingMethod === "DELIVERY";

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

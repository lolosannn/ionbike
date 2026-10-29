import "server-only";
import type { OrderStatus, PaymentMethod, ShippingMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { cancelPendingOrder, expireStaleOrders, holdUntil, markOrderPaid } from "@/lib/orders";

export type OrderRow = {
  id: string;
  number: number;
  createdAt: string;
  name: string;
  phone: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  summary: string;
  units: number;
  province: string | null;
};

export type OrderDetail = OrderRow & {
  email: string;
  dni: string;
  address: string | null;
  city: string | null;
  zip: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  shippingCost: number;
  mpPaymentId: string | null;
  paidAt: string | null;
  updatedAt: string;
  holdUntil: string;
  trackingCode: string | null;
  adminNotes: string | null;
  publicToken: string;
  items: { id: string; productName: string; variantLabel: string; unitPrice: number; quantity: number; productId: string | null }[];
};

type OrderWithItems = Awaited<ReturnType<typeof loadOrder>>;

function loadOrder(id: string) {
  return db.order.findUnique({ where: { id }, include: { items: { include: { variant: { select: { productId: true } } } } } });
}

function toRow(o: NonNullable<OrderWithItems>): OrderRow {
  return {
    id: o.id,
    number: o.number,
    createdAt: o.createdAt.toISOString(),
    name: o.name,
    phone: o.phone,
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod,
    shippingMethod: o.shippingMethod,
    summary: o.items.map((i) => `${i.quantity > 1 ? `${i.quantity} × ` : ""}${i.productName}`).join(", "),
    units: o.items.reduce((n, i) => n + i.quantity, 0),
    province: o.province,
  };
}

/** Últimos pedidos (los impagos vencidos se cancelan antes, para que el listado esté al día) */
export async function listOrders(limit = 500): Promise<OrderRow[]> {
  await expireStaleOrders();
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { items: { include: { variant: { select: { productId: true } } } } },
  });
  return orders.map(toRow);
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const o = await loadOrder(id);
  if (!o) return null;
  return {
    ...toRow(o),
    email: o.email,
    dni: o.dni,
    address: o.address,
    city: o.city,
    zip: o.zip,
    notes: o.notes,
    subtotal: o.subtotal,
    discount: o.discount,
    shippingCost: o.shippingCost,
    mpPaymentId: o.mpPaymentId,
    paidAt: o.paidAt?.toISOString() ?? null,
    updatedAt: o.updatedAt.toISOString(),
    holdUntil: holdUntil(o.paymentMethod, o.createdAt).toISOString(),
    trackingCode: o.trackingCode,
    adminNotes: o.adminNotes,
    publicToken: o.publicToken,
    items: o.items.map((i) => ({ id: i.id, productName: i.productName, variantLabel: i.variantLabel, unitPrice: i.unitPrice, quantity: i.quantity, productId: i.variant.productId })),
  };
}

export type OrderAction = "paid" | "shipped" | "delivered" | "cancel";

/**
 * Cambia el estado de un pedido. Cada paso solo vale desde el estado que corresponde,
 * así dos personas tocando el mismo pedido no lo dejan en un estado raro.
 */
export async function changeOrderStatus(id: string, action: OrderAction, trackingCode?: string) {
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return { ok: false as const, error: "El pedido no existe." };

  if (action === "paid") {
    if (order.status !== "PENDING" && order.status !== "CANCELLED") return { ok: false as const, error: "El pedido ya estaba cobrado." };
    if (order.status === "CANCELLED" && order.mpPaymentId) return { ok: false as const, error: "Este pedido se canceló después de cobrarlo." };
    // Si estaba cancelado (venció la reserva), markOrderPaid lo revive y vuelve a descontar el stock
    const done = await markOrderPaid(order.id);
    return done ? { ok: true as const } : { ok: false as const, error: "No se pudo marcar como cobrado." };
  }

  if (action === "shipped") {
    const updated = await db.order.updateMany({
      where: { id, status: "PAID", shippingMethod: "DELIVERY" },
      data: { status: "SHIPPED", trackingCode: trackingCode?.trim().slice(0, 60) || order.trackingCode },
    });
    return updated.count ? { ok: true as const } : { ok: false as const, error: "Solo se puede despachar un pedido cobrado con envío a domicilio." };
  }

  if (action === "delivered") {
    const updated = await db.order.updateMany({ where: { id, status: { in: ["PAID", "SHIPPED"] } }, data: { status: "DELIVERED" } });
    return updated.count ? { ok: true as const } : { ok: false as const, error: "Solo se puede entregar un pedido cobrado." };
  }

  // Cancelar: el stock vuelve. Si ya estaba cobrado, la devolución de la plata se hace aparte.
  if (order.status === "PENDING") {
    await cancelPendingOrder(order.id);
    return { ok: true as const };
  }
  if (order.status === "PAID" || order.status === "SHIPPED") {
    await db.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({ where: { id, status: order.status }, data: { status: "CANCELLED" } });
      if (!changed.count) return;
      const items = await tx.orderItem.findMany({ where: { orderId: id }, include: { variant: true } });
      for (const item of items) {
        await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        await tx.product.update({ where: { id: item.variant.productId }, data: { salesCount: { decrement: item.quantity } } });
      }
    });
    return { ok: true as const };
  }
  return { ok: false as const, error: "Este pedido ya no se puede cancelar." };
}

export async function saveOrderNotes(id: string, adminNotes: string, trackingCode: string) {
  const updated = await db.order.updateMany({
    where: { id },
    data: { adminNotes: adminNotes.trim().slice(0, 2000) || null, trackingCode: trackingCode.trim().slice(0, 60) || null },
  });
  return updated.count > 0;
}

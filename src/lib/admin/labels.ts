// Nombres en castellano de los estados y opciones, para el panel
import type { AppointmentStatus, InquiryStatus, OrderStatus, PaymentMethod, ShippingMethod } from "@prisma/client";

export const paymentLabels: Record<PaymentMethod, string> = {
  CARD: "Tarjeta (Mercado Pago)",
  MERCADOPAGO: "Mercado Pago",
  TICKET: "Pago Fácil / Rapipago",
  TRANSFER: "Transferencia al alias",
  QR: "QR (MODO / app del banco)",
  CASH: "Efectivo en el local",
};

/** Medios que el local tiene que confirmar a mano (no avisa Mercado Pago) */
export const manualPayment: PaymentMethod[] = ["TRANSFER", "CASH"];

export const shippingLabels: Record<ShippingMethod, string> = {
  PICKUP: "Retira en el local",
  DELIVERY: "Envío a domicilio",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Por cobrar",
  PAID: "Cobrado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  NEW: "Nueva",
  CONTACTED: "Contactado",
  RESERVED: "Señó",
  WON: "Vendida",
  LOST: "No avanzó",
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  PENDING: "Por confirmar",
  CONFIRMED: "Confirmado",
  DONE: "Terminado",
  CANCELLED: "Cancelado",
};

/** Link de WhatsApp al cliente: agrega el 549 si el teléfono vino sin código de país */
export function waTo(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  const full = digits.startsWith("54") ? digits : `549${digits.replace(/^15/, "")}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

const dateTime = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

/** "hace 5 min", "hace 3 h", "hace 2 días" */
export function timeAgo(iso: string, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

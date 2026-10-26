import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { store } from "@/config/store";

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

/** El pago con QR necesita además una caja (punto de venta) creada en la cuenta de Mercado Pago. */
export function isQrConfigured() {
  return isMercadoPagoConfigured() && Boolean(process.env.MP_QR_POS_ID);
}

// Medios que se ocultan en Checkout Pro según lo que eligió el cliente en la web.
// El dinero en cuenta de Mercado Pago no se puede ocultar.
const excludedTypes = {
  CARD: ["ticket", "atm"],
  TICKET: ["credit_card", "debit_card", "prepaid_card", "atm"],
  MERCADOPAGO: [],
} as const;
export type CheckoutProMethod = keyof typeof excludedTypes;

function client() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN");
  return new MercadoPagoConfig({ accessToken });
}

export function siteUrl() {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

type PreferenceInput = {
  orderId: string;
  orderNumber: number;
  publicToken: string;
  email: string;
  method: CheckoutProMethod;
  items: { id: string; title: string; quantity: number; unitPrice: number }[];
  shippingCost: number;
  discount: number;
  total: number;
};

/** Crea una preferencia de Checkout Pro. Montos en centavos. */
export async function createPreference(input: PreferenceInput) {
  const items = input.items.map((i) => ({
    id: i.id,
    title: i.title,
    quantity: i.quantity,
    unit_price: i.unitPrice / 100,
    currency_id: "ARS",
  }));
  if (input.shippingCost > 0) {
    items.push({ id: "envio", title: "Envío", quantity: 1, unit_price: input.shippingCost / 100, currency_id: "ARS" });
  }
  // Con descuento (efectivo en Pago Fácil o Rapipago) se cobra el total del pedido en un solo ítem
  const billed = input.discount > 0
    ? [{ id: input.orderId, title: `Pedido #${input.orderNumber} IonBikeStore`, quantity: 1, unit_price: input.total / 100, currency_id: "ARS" }]
    : items;
  const back = `${siteUrl()}/pedido/${input.publicToken}?nuevo=1`;
  const isPublicUrl = siteUrl().startsWith("https://");
  const preference = await new Preference(client()).create({
    body: {
      items: billed,
      payer: { email: input.email },
      external_reference: input.orderId,
      statement_descriptor: "IONBIKESTORE",
      // Tope de cuotas igual al que promociona la web (las sin interés se configuran en la cuenta)
      payment_methods: {
        installments: store.installments,
        excluded_payment_types: excludedTypes[input.method].map((id) => ({ id })),
      },
      back_urls: { success: back, pending: back, failure: back },
      // Mercado Pago sólo acepta auto_return y notificaciones con URLs públicas
      ...(isPublicUrl && {
        auto_return: "approved",
        notification_url: `${siteUrl()}/api/webhooks/mercadopago`,
      }),
    },
  });
  if (!preference.id || !preference.init_point) throw new Error("Mercado Pago no devolvió la preferencia");
  return { id: preference.id, initPoint: preference.init_point };
}

// Vigencia del QR: pasado este tiempo se puede generar uno nuevo desde la página del pedido
const QR_MINUTES = 30;

/**
 * Crea un QR dinámico (API de Orders de Mercado Pago) por el total del pedido.
 * Es interoperable: se paga con MODO, Mercado Pago o la app de cualquier banco.
 */
export async function createQrOrder(input: { orderId: string; orderNumber: number; total: number }) {
  const res = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify({
      type: "qr",
      external_reference: input.orderId,
      description: `Pedido #${input.orderNumber} IonBikeStore`,
      total_amount: (input.total / 100).toFixed(2),
      expiration_time: `PT${QR_MINUTES}M`,
      config: { qr: { external_pos_id: process.env.MP_QR_POS_ID, mode: "dynamic" } },
      transactions: { payments: [{ amount: (input.total / 100).toFixed(2) }] },
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => null);
  const qrData = data?.type_response?.qr_data;
  if (!res.ok || !data?.id || !qrData) throw new Error(`Mercado Pago QR: ${res.status} ${JSON.stringify(data)}`);
  return { id: String(data.id), qrData: String(qrData), expiresAt: new Date(Date.now() + QR_MINUTES * 60 * 1000) };
}

/** Estado de una orden QR. "processed" = pagada. */
export async function getQrOrder(id: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Mercado Pago QR: ${res.status}`);
  const data = await res.json();
  const paid = Math.round(Number(data?.total_paid_amount ?? 0) * 100);
  return {
    status: String(data?.status ?? ""),
    externalReference: String(data?.external_reference ?? ""),
    paid,
    paymentId: data?.transactions?.payments?.[0]?.id as string | undefined,
  };
}

export async function getPayment(id: string) {
  return new Payment(client()).get({ id });
}

/**
 * Valida la firma x-signature de las notificaciones de Mercado Pago.
 * https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verifyWebhookSignature(params: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
}) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !params.signature) return false;
  const parts = Object.fromEntries(
    params.signature.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  if (!parts.ts || !parts.v1) return false;
  const id = /^[a-z0-9]+$/i.test(params.dataId) ? params.dataId.toLowerCase() : params.dataId;
  let manifest = `id:${id};`;
  if (params.requestId) manifest += `request-id:${params.requestId};`;
  manifest += `ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

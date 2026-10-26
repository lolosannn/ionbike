import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { store } from "@/config/store";

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

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
  publicToken: string;
  email: string;
  items: { id: string; title: string; quantity: number; unitPrice: number }[];
  shippingCost: number;
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
  const back = `${siteUrl()}/pedido/${input.publicToken}?nuevo=1`;
  const isPublicUrl = siteUrl().startsWith("https://");
  const preference = await new Preference(client()).create({
    body: {
      items,
      payer: { email: input.email },
      external_reference: input.orderId,
      statement_descriptor: "IONBIKESTORE",
      // Tope de cuotas igual al que promociona la web (las sin interés se configuran en la cuenta)
      payment_methods: { installments: store.installments },
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

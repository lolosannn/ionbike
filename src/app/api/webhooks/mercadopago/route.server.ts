import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPayment, verifyWebhookSignature } from "@/lib/mercadopago";
import { markOrderPaid, syncQrPayment } from "@/lib/orders";

// Las notificaciones de Mercado Pago pesan unos cientos de bytes
const MAX_BODY = 16 * 1024;

export async function POST(req: NextRequest) {
  const raw = await req.text().catch(() => "");
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "demasiado grande" }, { status: 413 });
  let body: { type?: string; data?: { id?: unknown } } = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    // Algunas notificaciones viajan solo en la URL
  }
  const type = req.nextUrl.searchParams.get("type") ?? body.type;
  const dataId = String(req.nextUrl.searchParams.get("data.id") ?? body?.data?.id ?? "");

  // "payment": Checkout Pro (tarjeta, Pago Fácil / Rapipago, Mercado Pago) · "order": pago con QR
  if ((type !== "payment" && type !== "order") || !dataId) return NextResponse.json({ ok: true });
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(dataId)) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const valid = verifyWebhookSignature({
    signature: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId,
  });
  if (!valid) return NextResponse.json({ error: "firma inválida" }, { status: 401 });

  // Nunca confiamos en el cuerpo: consultamos directamente a Mercado Pago.
  // Por eso reenviar una notificación vieja no tiene efecto (y todo es idempotente).
  try {
    if (type === "order") {
      await syncQrPayment(dataId);
      return NextResponse.json({ ok: true });
    }

    const payment = await getPayment(dataId);
    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ ok: true });

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ ok: true });

    if (payment.status === "approved") {
      const paid = Math.round((payment.transaction_amount ?? 0) * 100);
      if (payment.currency_id !== "ARS") {
        console.error(`Pago ${dataId} en ${payment.currency_id} para el pedido ${order.number}: se ignora`);
      } else if (paid < order.total) {
        console.error(`Pago ${dataId} por ${paid} menor al total del pedido ${order.number} (${order.total})`);
      } else {
        await markOrderPaid(order.id, String(payment.id));
      }
    }
    // Pagos rechazados: el pedido queda pendiente porque el cliente puede reintentar con otra tarjeta.
  } catch (e) {
    // 500 para que Mercado Pago reintente más tarde; el detalle queda solo en el log
    console.error("Error procesando el webhook de Mercado Pago", e);
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

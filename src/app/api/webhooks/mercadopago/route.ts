import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPayment, verifyWebhookSignature } from "@/lib/mercadopago";
import { markOrderPaid } from "@/lib/orders";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const type = req.nextUrl.searchParams.get("type") ?? body.type;
  const dataId = String(req.nextUrl.searchParams.get("data.id") ?? body?.data?.id ?? "");

  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true });

  const valid = verifyWebhookSignature({
    signature: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId,
  });
  if (!valid) return NextResponse.json({ error: "firma inválida" }, { status: 401 });

  // Nunca confiamos en el cuerpo: consultamos el pago directamente a Mercado Pago
  const payment = await getPayment(dataId);
  const orderId = payment.external_reference;
  if (!orderId) return NextResponse.json({ ok: true });

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ ok: true });

  if (payment.status === "approved") {
    const paid = Math.round((payment.transaction_amount ?? 0) * 100);
    if (paid < order.total) {
      console.error(`Pago ${dataId} por ${paid} menor al total del pedido ${order.number} (${order.total})`);
    } else {
      await markOrderPaid(order.id, String(payment.id));
    }
  }
  // Pagos rechazados: el pedido queda pendiente porque el cliente puede reintentar con otra tarjeta.

  return NextResponse.json({ ok: true });
}

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/pricing";
import { store, whatsappUrl } from "@/config/store";
import { ClearCart } from "./ClearCart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tu pedido", robots: { index: false } };

const statusText = {
  PENDING: "Pendiente de pago",
  PAID: "Pago confirmado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
} as const;

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ nuevo?: string }>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { nuevo } = await searchParams;
  const order = await db.order.findUnique({ where: { publicToken: token }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="container" style={{ maxWidth: 840 }}>
      {nuevo && <ClearCart />}
      <div className="page-head">
        <span className="eyebrow">Pedido #{order.number}</span>
        <h1 className="display" style={{ fontSize: "clamp(44px, 7vw, 72px)" }}>
          {order.status === "PAID" ? "¡Gracias por tu compra!" : nuevo ? "¡Recibimos tu pedido!" : statusText[order.status]}
        </h1>
        <p className="muted">Estado: <strong style={{ color: "var(--text)" }}>{statusText[order.status]}</strong>. Te escribimos a {order.email}.</p>
      </div>

      {order.paymentMethod === "TRANSFER" && order.status === "PENDING" && (
        <div className="notice bank" style={{ marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>Transferí {formatPrice(order.total)} a esta cuenta</h2>
          <dl>
            <dt>Titular</dt><dd>{store.bank.holder}</dd>
            <dt>CBU</dt><dd>{store.bank.cbu}</dd>
            <dt>Alias</dt><dd>{store.bank.alias}</dd>
            <dt>CUIT</dt><dd>{store.bank.cuit}</dd>
          </dl>
          <p className="muted">Cuando hagas la transferencia, mandanos el comprobante por WhatsApp indicando el número de pedido.</p>
          <a className="btn btn-whatsapp" href={whatsappUrl(`Hola! Te envío el comprobante del pedido #${order.number}`)} target="_blank" rel="noreferrer">
            Enviar comprobante por WhatsApp
          </a>
        </div>
      )}

      {order.paymentMethod === "CASH" && order.status === "PENDING" && (
        <div className="notice" style={{ marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>Pagás {formatPrice(order.total)} en efectivo al retirar</h2>
          <p className="muted">Te avisamos por WhatsApp cuando esté listo para retirar en {store.address} ({store.hours}).</p>
        </div>
      )}

      {order.paymentMethod === "MERCADOPAGO" && order.status === "PENDING" && (
        <div className="notice" style={{ marginTop: 24 }}>
          Estamos esperando la confirmación de Mercado Pago. Si ya pagaste, esta página se actualiza sola en unos minutos.
        </div>
      )}

      <div className="summary" style={{ position: "static", marginTop: 24 }}>
        <h2>Detalle</h2>
        {order.items.map((i) => (
          <div key={i.id} className="summary-row">
            <span>{i.quantity} × {i.productName}{i.variantLabel && <span className="muted"> ({i.variantLabel})</span>}</span>
            <span>{formatPrice(i.unitPrice * i.quantity)}</span>
          </div>
        ))}
        <div className="summary-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
        {order.discount > 0 && <div className="summary-row"><span>Descuento</span><span>−{formatPrice(order.discount)}</span></div>}
        <div className="summary-row"><span>Envío</span><span>{order.shippingCost ? formatPrice(order.shippingCost) : "Gratis"}</span></div>
        <div className="summary-row total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        <p className="muted" style={{ margin: 0 }}>
          {order.shippingMethod === "PICKUP"
            ? `Retiro en ${store.address}. Te avisamos cuando esté listo.`
            : `Envío a ${order.address}, ${order.city}, ${order.province} (${order.zip}).`}
        </p>
      </div>
    </div>
  );
}

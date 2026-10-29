import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/pricing";
import { store, whatsappUrl } from "@/config/store";
import QRCode from "qrcode";
import { ClearCart } from "./ClearCart";
import { QrPayment } from "./QrPayment";
import { checkQrPayment, renewQr } from "../../checkout/actions";
import { expireStaleOrders, holdUntil } from "@/lib/orders";
import { isPublicToken } from "@/lib/validation";

export const dynamic = "force-dynamic";
// El link del pedido es la llave para verlo: no se indexa ni se manda en el Referer
export const metadata = { title: "Tu pedido", robots: { index: false, follow: false }, referrer: "no-referrer" as const };

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
  if (!isPublicToken(token)) notFound();
  await expireStaleOrders();
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

      {order.status === "PENDING" && (
        <p className="muted" style={{ marginTop: 16 }}>
          Te reservamos los productos hasta el{" "}
          <strong style={{ color: "var(--text)" }}>
            {holdUntil(order.paymentMethod, order.createdAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "long", timeStyle: "short" })} h
          </strong>. Si para entonces no se acreditó el pago, el pedido se cancela solo.
        </p>
      )}

      {order.trackingCode && (order.status === "SHIPPED" || order.status === "DELIVERED") && (
        <div className="notice" style={{ marginTop: 24 }}>
          Tu pedido viaja por Andreani. Número de seguimiento: <strong>{order.trackingCode}</strong>{" "}
          (seguilo en <a href="https://www.andreani.com/" target="_blank" rel="noreferrer">andreani.com</a>).
        </div>
      )}

      {order.status === "CANCELLED" && (
        <div className="notice" style={{ marginTop: 24 }}>
          Este pedido se canceló. Si ya pagaste o lo querés retomar,{" "}
          <a href={whatsappUrl(`Hola! Consulto por el pedido #${order.number}`)} target="_blank" rel="noreferrer">escribinos por WhatsApp</a>.
        </div>
      )}

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

      {order.paymentMethod === "QR" && order.status === "PENDING" && order.mpQrData && order.mpQrExpiresAt && (
        <div className="notice" style={{ marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>Escaneá el QR y pagá {formatPrice(order.total)}</h2>
          <QrPayment
            svg={await QRCode.toString(order.mpQrData, { type: "svg", margin: 2, errorCorrectionLevel: "M" })}
            expiresAt={order.mpQrExpiresAt.toISOString()}
            check={checkQrPayment.bind(null, token)}
            renew={renewQr.bind(null, token)}
          />
        </div>
      )}

      {order.paymentMethod === "CASH" && order.status === "PENDING" && (
        <div className="notice" style={{ marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>Pagás {formatPrice(order.total)} en efectivo en el local</h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            Te esperamos en {store.address} ({store.hours}).{" "}
            {order.shippingMethod === "DELIVERY"
              ? "Cuando pagues, lo despachamos por Andreani."
              : "Te avisamos por WhatsApp cuando esté listo para retirar."}
          </p>
        </div>
      )}

      {order.paymentMethod === "TICKET" && order.status === "PENDING" && (
        <div className="notice" style={{ marginTop: 24 }}>
          Estamos esperando que pagues el cupón en Pago Fácil o Rapipago. La acreditación puede demorar hasta 2 días hábiles; cuando llegue, esta página se actualiza.
        </div>
      )}

      {(order.paymentMethod === "MERCADOPAGO" || order.paymentMethod === "CARD") && order.status === "PENDING" && (
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { OrderAction, OrderDetail } from "@/lib/admin/orders";
import { formatDateTime, manualPayment, orderStatusLabels, paymentLabels, shippingLabels, timeAgo, waTo } from "@/lib/admin/labels";
import { formatPrice } from "@/lib/pricing";
import { WhatsappIcon } from "@/components/icons";
import { StatusChip } from "./OrdersTable";

type Result = { ok: boolean; error?: string };

type Props = {
  order: OrderDetail;
  now: number;
  // Sin acciones (vista previa): se ve todo, pero no cambia nada
  changeStatus?: (id: string, action: OrderAction, trackingCode?: string) => Promise<Result>;
  saveNotes?: (id: string, notes: string, trackingCode: string) => Promise<Result>;
};

const steps = ["PENDING", "PAID", "SHIPPED", "DELIVERED"] as const;

export function OrderView({ order, now, changeStatus, saveNotes }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);
  const [notes, setNotes] = useState(order.adminNotes ?? "");
  const [tracking, setTracking] = useState(order.trackingCode ?? "");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const delivery = order.shippingMethod === "DELIVERY";
  const visibleSteps: readonly (typeof steps)[number][] = delivery ? steps : steps.filter((s) => s !== "SHIPPED");
  const current = (visibleSteps as readonly string[]).indexOf(order.status);
  const expired = order.status === "PENDING" && new Date(order.holdUntil).getTime() < now;

  const run = (action: OrderAction, ok: string) => {
    setConfirmCancel(false);
    if (!changeStatus) return setMessage({ kind: "info", text: `Vista previa: acá el pedido pasaría a «${ok}».` });
    start(async () => {
      const res = await changeStatus(order.id, action, tracking);
      if (!res.ok) return setMessage({ kind: "error", text: res.error ?? "No se pudo cambiar el estado." });
      setMessage({ kind: "ok", text: `Listo: el pedido quedó como ${ok.toLowerCase()}.` });
      router.refresh();
    });
  };

  const storeNotes = () => {
    if (!saveNotes) return setMessage({ kind: "info", text: "Vista previa: las notas no se guardan." });
    start(async () => {
      const res = await saveNotes(order.id, notes, tracking);
      setMessage(res.ok ? { kind: "ok", text: "Notas guardadas." } : { kind: "error", text: res.error ?? "No se pudieron guardar." });
      if (res.ok) router.refresh();
    });
  };

  const firstName = order.name.split(" ")[0];
  const waMessages = [
    { label: "Recordar el pago", show: order.status === "PENDING", text: `Hola ${firstName}! Te escribimos de IonBikeStore por tu pedido #${order.number} (${formatPrice(order.total)}). Te reservamos los productos: ¿pudiste hacer el pago?` },
    { label: "Avisar que está listo para retirar", show: order.status === "PAID" && !delivery, text: `Hola ${firstName}! Tu pedido #${order.number} ya está listo para retirar en el local. ¡Te esperamos!` },
    { label: "Avisar que se despachó", show: (order.status === "PAID" || order.status === "SHIPPED") && delivery, text: `Hola ${firstName}! Tu pedido #${order.number} ya salió por Andreani.${tracking ? ` Número de seguimiento: ${tracking}.` : ""} ¡Gracias por tu compra!` },
    { label: "Escribirle", show: true, text: `Hola ${firstName}! Te escribimos de IonBikeStore por tu pedido #${order.number}.` },
  ].filter((m) => m.show);

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <Link href="/admin/pedidos" className="adm-back">← Pedidos</Link>
          <h1>Pedido #{order.number}</h1>
          <p className="adm-sub">
            <StatusChip status={order.status} label={orderStatusLabels[order.status]} />
            <span>{formatDateTime(order.createdAt)} ({timeAgo(order.createdAt, now)})</span>
          </p>
        </div>
      </header>

      {message && <p className={`adm-banner ${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>{message.text}</p>}

      {order.status !== "CANCELLED" && (
        <ol className="adm-steps" aria-label="Avance del pedido">
          {visibleSteps.map((s, i) => (
            <li key={s} className={i < current ? "done" : i === current ? "current" : undefined}>
              <span aria-hidden>{i < current ? "✓" : i + 1}</span>
              {orderStatusLabels[s]}
            </li>
          ))}
        </ol>
      )}

      <div className="adm-editor-grid">
        <div className="adm-editor-main">
          <section className="adm-card" aria-labelledby="t-productos">
            <h2 id="t-productos">Productos</h2>
            <ul className="adm-lines">
              {order.items.map((i) => (
                <li key={i.id}>
                  <span>
                    {i.productId ? <Link href={`/admin/productos/${i.productId}`}>{i.productName}</Link> : i.productName}
                    {i.variantLabel && <small className="adm-muted"> · {i.variantLabel}</small>}
                  </span>
                  <span className="adm-muted">{i.quantity} × {formatPrice(i.unitPrice)}</span>
                  <b>{formatPrice(i.unitPrice * i.quantity)}</b>
                </li>
              ))}
            </ul>
            <dl className="adm-totals">
              <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.discount > 0 && <div><dt>Descuento por pago en efectivo / transferencia</dt><dd>− {formatPrice(order.discount)}</dd></div>}
              <div><dt>Envío</dt><dd>{delivery ? (order.shippingCost ? formatPrice(order.shippingCost) : "Gratis") : "Retira"}</dd></div>
              <div className="total"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </section>

          <section className="adm-card" aria-labelledby="t-cliente">
            <h2 id="t-cliente">Cliente</h2>
            <dl className="adm-facts">
              <div><dt>Nombre</dt><dd>{order.name}</dd></div>
              <div><dt>DNI / CUIT</dt><dd>{order.dni}</dd></div>
              <div><dt>Teléfono</dt><dd><a href={`tel:${order.phone}`}>{order.phone}</a></dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${order.email}`}>{order.email}</a></dd></div>
              {order.notes && <div className="wide"><dt>Comentario del cliente</dt><dd className="adm-quote">{order.notes}</dd></div>}
            </dl>
            <div className="adm-wa-list">
              {waMessages.map((m) => (
                <a key={m.label} className="adm-btn adm-btn-sm adm-btn-wa" href={waTo(order.phone, m.text)} target="_blank" rel="noreferrer">
                  <WhatsappIcon size={16} /> {m.label}
                </a>
              ))}
            </div>
          </section>

          <section className="adm-card" aria-labelledby="t-entrega">
            <h2 id="t-entrega">Entrega</h2>
            <dl className="adm-facts">
              <div><dt>Forma</dt><dd>{shippingLabels[order.shippingMethod]}</dd></div>
              {delivery && (
                <div className="wide">
                  <dt>Dirección</dt>
                  <dd>{order.address}, {order.city}, {order.province} ({order.zip})</dd>
                </div>
              )}
            </dl>
            {delivery && (
              <label className="adm-field" style={{ marginTop: 16 }}>
                <span>Número de seguimiento de Andreani</span>
                <input className="adm-input adm-mono" value={tracking} maxLength={60} onChange={(e) => setTracking(e.target.value)} placeholder="Se lo ve el cliente en su pedido" />
              </label>
            )}
          </section>
        </div>

        <aside className="adm-editor-side">
          <section className="adm-card" aria-labelledby="t-acciones">
            <h2 id="t-acciones">Qué sigue</h2>
            {order.status === "PENDING" && (
              <>
                <p className="adm-note-plain">
                  {manualPayment.includes(order.paymentMethod)
                    ? `Cuando veas la ${order.paymentMethod === "CASH" ? "plata" : "transferencia"}, marcalo como cobrado.`
                    : "Mercado Pago avisa solo cuando se acredita. Si ya lo ves acreditado y acá no, podés marcarlo a mano."}
                  {" "}{expired ? "La reserva de stock ya venció." : `Reserva el stock hasta el ${formatDateTime(order.holdUntil)}.`}
                </p>
                <button type="button" className="adm-btn adm-btn-primary adm-btn-block" disabled={pending} onClick={() => run("paid", "Cobrado")}>Marcar como cobrado</button>
              </>
            )}
            {order.status === "PAID" && delivery && (
              <button type="button" className="adm-btn adm-btn-primary adm-btn-block" disabled={pending} onClick={() => run("shipped", "Enviado")}>
                Marcar como enviado{tracking ? "" : " (sin seguimiento)"}
              </button>
            )}
            {(order.status === "SHIPPED" || (order.status === "PAID" && !delivery)) && (
              <button type="button" className="adm-btn adm-btn-primary adm-btn-block" disabled={pending} onClick={() => run("delivered", "Entregado")}>
                {delivery ? "Marcar como entregado" : "Marcar como retirado"}
              </button>
            )}
            {order.status === "CANCELLED" && !order.mpPaymentId && (
              <>
                <p className="adm-note-plain">Cancelado: el stock volvió a la tienda. Si el cliente pagó igual, marcalo como cobrado y se vuelve a descontar.</p>
                <button type="button" className="adm-btn adm-btn-block" disabled={pending} onClick={() => run("paid", "Cobrado")}>Marcar como cobrado igual</button>
              </>
            )}
            {order.status === "DELIVERED" && <p className="adm-note-plain">Pedido terminado. ¡Una venta más!</p>}

            {["PENDING", "PAID", "SHIPPED"].includes(order.status) && (
              confirmCancel ? (
                <div className="adm-confirm">
                  <p>
                    ¿Cancelar el pedido #{order.number}? El stock vuelve a la tienda.
                    {order.status !== "PENDING" && " La devolución de la plata se hace aparte (en Mercado Pago o por transferencia)."}
                  </p>
                  <div className="adm-inline-actions">
                    <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" disabled={pending} onClick={() => run("cancel", "Cancelado")}>Sí, cancelar</button>
                    <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setConfirmCancel(false)}>No</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="adm-btn adm-btn-block adm-btn-danger-ghost" onClick={() => setConfirmCancel(true)}>Cancelar pedido</button>
              )
            )}
          </section>

          <section className="adm-card" aria-labelledby="t-pago">
            <h2 id="t-pago">Pago</h2>
            <dl className="adm-facts">
              <div className="wide"><dt>Medio</dt><dd>{paymentLabels[order.paymentMethod]}</dd></div>
              {order.paidAt && <div className="wide"><dt>Cobrado</dt><dd>{formatDateTime(order.paidAt)}</dd></div>}
              {order.mpPaymentId && <div className="wide"><dt>Operación de Mercado Pago</dt><dd className="adm-mono">{order.mpPaymentId}</dd></div>}
            </dl>
          </section>

          <section className="adm-card" aria-labelledby="t-notas">
            <h2 id="t-notas">Notas internas</h2>
            <textarea className="adm-input" rows={4} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder="Solo las ve el local. Ej. «Pasa el sábado a retirar»" />
            <button
              type="button"
              className="adm-btn adm-btn-sm adm-btn-block"
              style={{ marginTop: 10 }}
              disabled={pending || (notes === (order.adminNotes ?? "") && tracking === (order.trackingCode ?? ""))}
              onClick={storeNotes}
            >
              Guardar notas{delivery ? " y seguimiento" : ""}
            </button>
            {changeStatus && (
              <Link href={`/pedido/${order.publicToken}`} target="_blank" rel="noreferrer" className="adm-small-link">Ver el pedido como lo ve el cliente ↗</Link>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

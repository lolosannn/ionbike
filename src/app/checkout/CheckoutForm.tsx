"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, hasFreeShipping } from "@/lib/pricing";
import { provinces } from "@/lib/shipping";
import { store } from "@/config/store";
import { useShippingQuote, type QuoteAction } from "@/components/cart/useShippingQuote";

export type CheckoutState = { error?: string; demo?: boolean } | null;

type Props = {
  mercadoPagoEnabled: boolean;
  // Sin acción: vista previa estática, el pedido se simula
  action?: (prev: CheckoutState, form: FormData) => Promise<CheckoutState>;
  quoteAction?: QuoteAction;
};

type Payment = "MERCADOPAGO" | "TRANSFER" | "CASH";

export function CheckoutForm({ mercadoPagoEnabled, action: placeOrder, quoteAction }: Props) {
  const { items, subtotal, ready, clear, destination, setDestination } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    placeOrder ?? (async () => { clear(); return { demo: true }; }),
    null,
  );
  const [shipping, setShipping] = useState<"PICKUP" | "DELIVERY">("DELIVERY");
  const [payment, setPayment] = useState<Payment>(mercadoPagoEnabled ? "MERCADOPAGO" : "TRANSFER");
  const { quote, loading } = useShippingQuote(destination, quoteAction);
  const zip = destination?.zip ?? "";
  const province = destination?.province ?? "";

  if (!ready) return null;
  if (state?.demo) {
    return (
      <div className="notice" style={{ marginTop: 28 }}>
        <h2 style={{ marginTop: 0 }}>¡Listo! (vista previa)</h2>
        <p>En la tienda real acá se crea el pedido y se te redirige a Mercado Pago o a los datos de transferencia. En esta vista previa no se generó ningún pedido ni cobro.</p>
        <Link href="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 28 }}>
        <p>Tu carrito está vacío.</p>
        <Link href="/categoria/bicicletas" className="btn btn-primary">Ver bicicletas</Link>
      </div>
    );
  }

  // Cálculo orientativo: el servidor recalcula todo con los precios reales
  const discount = payment !== "MERCADOPAGO" ? Math.round((subtotal * store.transferDiscountPct) / 100) : 0;
  const free = hasFreeShipping(subtotal);
  const shippingCost = shipping === "PICKUP" || free ? 0 : quote?.cost ?? null;
  const total = subtotal - discount + (shippingCost ?? 0);
  const deliveryText = free
    ? "Gratis"
    : loading
      ? "Cotizando…"
      : quote
        ? `${formatPrice(quote.cost)} · ${quote.days}`
        : "Ingresá tu código postal para cotizar";

  const chooseShipping = (method: "PICKUP" | "DELIVERY") => {
    setShipping(method);
    // El efectivo es solo retirando en el local
    if (method === "DELIVERY" && payment === "CASH") setPayment("TRANSFER");
  };

  return (
    <form action={action} className="cart-layout">
      <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })))} />

      <div className="cart-items form">
        <fieldset>
          <legend>Tus datos</legend>
          <div className="field-row">
            <label className="field">Nombre y apellido<input className="input" name="name" required autoComplete="name" /></label>
            <label className="field">DNI<input className="input" name="dni" required inputMode="numeric" /></label>
          </div>
          <div className="field-row">
            <label className="field">Email<input className="input" name="email" type="email" required autoComplete="email" /></label>
            <label className="field">Teléfono / WhatsApp<input className="input" name="phone" type="tel" required autoComplete="tel" /></label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Entrega</legend>
          <label className="choice">
            <input type="radio" name="shippingMethod" value="DELIVERY" checked={shipping === "DELIVERY"} onChange={() => chooseShipping("DELIVERY")} />
            <span>
              <strong>Envío a domicilio (Andreani)</strong>
              <small>{deliveryText}{free && " · a todo el país"}</small>
            </span>
          </label>
          <label className="choice">
            <input type="radio" name="shippingMethod" value="PICKUP" checked={shipping === "PICKUP"} onChange={() => chooseShipping("PICKUP")} />
            <span>
              <strong>Retiro en el local</strong>
              <small>Gratis · {store.address} · {store.hours}</small>
            </span>
          </label>
          {shipping === "DELIVERY" && (
            <>
              <label className="field">Dirección (calle, número, piso)<input className="input" name="address" required autoComplete="street-address" /></label>
              <div className="field-row">
                <label className="field">Código postal
                  <input
                    className="input" name="zip" required autoComplete="postal-code" inputMode="numeric" maxLength={8}
                    value={zip} onChange={(e) => setDestination({ zip: e.target.value, province })}
                  />
                </label>
                <label className="field">Provincia
                  <select
                    className="input" name="province" required autoComplete="address-level1"
                    value={province} onChange={(e) => setDestination({ zip, province: e.target.value })}
                  >
                    <option value="">Elegí</option>
                    {provinces.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
                <label className="field">Localidad<input className="input" name="city" required autoComplete="address-level2" /></label>
              </div>
            </>
          )}
        </fieldset>

        <fieldset>
          <legend>Pago</legend>
          {mercadoPagoEnabled && (
            <label className="choice">
              <input type="radio" name="paymentMethod" value="MERCADOPAGO" checked={payment === "MERCADOPAGO"} onChange={() => setPayment("MERCADOPAGO")} />
              <span>
                <strong>Mercado Pago</strong>
                <small>Crédito hasta {store.installments} cuotas sin interés, débito, dinero en cuenta y efectivo en Pago Fácil o Rapipago. Precio de lista.</small>
              </span>
            </label>
          )}
          <label className="choice">
            <input type="radio" name="paymentMethod" value="TRANSFER" checked={payment === "TRANSFER"} onChange={() => setPayment("TRANSFER")} />
            <span>
              <strong>Transferencia · {store.transferDiscountPct}% off</strong>
              <small>Te mostramos el alias y el CBU / CVU al confirmar el pedido. El descuento no se aplica al envío.</small>
            </span>
          </label>
          {shipping === "PICKUP" && (
            <label className="choice">
              <input type="radio" name="paymentMethod" value="CASH" checked={payment === "CASH"} onChange={() => setPayment("CASH")} />
              <span>
                <strong>Efectivo al retirar · {store.transferDiscountPct}% off</strong>
                <small>Te reservamos el pedido y lo pagás en el local.</small>
              </span>
            </label>
          )}
        </fieldset>

        <label className="field">Notas del pedido (opcional)<textarea className="input" name="notes" rows={3} /></label>
      </div>

      <aside className="summary" aria-label="Resumen">
        <h2>Resumen</h2>
        {items.map((i) => (
          <div key={i.variantId} className="summary-row">
            <span>{i.quantity} × {i.name}{i.variantLabel && <span className="muted"> ({i.variantLabel})</span>}</span>
            <span>{formatPrice(i.price * i.quantity)}</span>
          </div>
        ))}
        <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        {discount > 0 && <div className="summary-row"><span>Descuento {payment === "CASH" ? "efectivo" : "transferencia"} ({store.transferDiscountPct}%)</span><span>−{formatPrice(discount)}</span></div>}
        <div className="summary-row">
          <span>Envío{shipping === "DELIVERY" && quote && !free ? ` (${quote.zone})` : ""}</span>
          <span>{shippingCost === null ? <span className="muted">A cotizar</span> : shippingCost ? formatPrice(shippingCost) : "Gratis"}</span>
        </div>
        <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
        {state?.error && <p className="alert" role="alert">{state.error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? "Procesando…" : payment === "MERCADOPAGO" ? "Pagar con Mercado Pago" : payment === "CASH" ? "Reservar pedido" : "Confirmar pedido"}
        </button>
      </aside>
    </form>
  );
}

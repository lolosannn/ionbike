"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/lib/pricing";
import { store } from "@/config/store";
import { placeOrder, type CheckoutState } from "./actions";

export function CheckoutForm({ mercadoPagoEnabled }: { mercadoPagoEnabled: boolean }) {
  const { items, subtotal, ready } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const [shipping, setShipping] = useState<"PICKUP" | "DELIVERY">("DELIVERY");
  const [payment, setPayment] = useState<"MERCADOPAGO" | "TRANSFER">(mercadoPagoEnabled ? "MERCADOPAGO" : "TRANSFER");

  if (!ready) return null;
  if (items.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 28 }}>
        <p>Tu carrito está vacío.</p>
        <Link href="/categoria/bicicletas" className="btn btn-primary">Ver bicicletas</Link>
      </div>
    );
  }

  // Cálculo orientativo: el servidor recalcula todo con los precios reales
  const discount = payment === "TRANSFER" ? Math.round((subtotal * store.transferDiscountPct) / 100) : 0;
  const shippingCost = shipping === "PICKUP" || subtotal >= store.freeShippingFrom ? 0 : store.shippingFlatRate;
  const total = subtotal - discount + shippingCost;

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
            <input type="radio" name="shippingMethod" value="DELIVERY" checked={shipping === "DELIVERY"} onChange={() => setShipping("DELIVERY")} />
            <span>
              <strong>Envío a domicilio (Andreani)</strong>
              <small>{subtotal >= store.freeShippingFrom ? "Gratis" : formatPrice(store.shippingFlatRate)} · a todo el país</small>
            </span>
          </label>
          <label className="choice">
            <input type="radio" name="shippingMethod" value="PICKUP" checked={shipping === "PICKUP"} onChange={() => setShipping("PICKUP")} />
            <span>
              <strong>Retiro en el local</strong>
              <small>Gratis · {store.address}</small>
            </span>
          </label>
          {shipping === "DELIVERY" && (
            <>
              <label className="field">Dirección (calle, número, piso)<input className="input" name="address" required autoComplete="street-address" /></label>
              <div className="field-row">
                <label className="field">Localidad<input className="input" name="city" required autoComplete="address-level2" /></label>
                <label className="field">Provincia<input className="input" name="province" required autoComplete="address-level1" /></label>
                <label className="field">Código postal<input className="input" name="zip" required autoComplete="postal-code" /></label>
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
                <small>Tarjetas de crédito y débito, hasta {store.installments} cuotas sin interés, efectivo y dinero en cuenta.</small>
              </span>
            </label>
          )}
          <label className="choice">
            <input type="radio" name="paymentMethod" value="TRANSFER" checked={payment === "TRANSFER"} onChange={() => setPayment("TRANSFER")} />
            <span>
              <strong>Transferencia bancaria · {store.transferDiscountPct}% off</strong>
              <small>Te mostramos los datos de la cuenta al confirmar el pedido.</small>
            </span>
          </label>
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
        {discount > 0 && <div className="summary-row"><span>Descuento transferencia</span><span>−{formatPrice(discount)}</span></div>}
        <div className="summary-row"><span>Envío</span><span>{shippingCost ? formatPrice(shippingCost) : "Gratis"}</span></div>
        <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
        {state?.error && <p className="alert" role="alert">{state.error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? "Procesando…" : payment === "MERCADOPAGO" ? "Pagar con Mercado Pago" : "Confirmar pedido"}
        </button>
      </aside>
    </form>
  );
}

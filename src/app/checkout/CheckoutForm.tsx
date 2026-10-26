"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, hasCashDiscount, hasFreeShipping } from "@/lib/pricing";
import { provinces } from "@/lib/shipping";
import { store } from "@/config/store";
import { useShippingQuote, type QuoteAction } from "@/components/cart/useShippingQuote";

export type CheckoutState = { error?: string; demo?: boolean } | null;

type Props = {
  mercadoPagoEnabled: boolean;
  // Pago con QR (MODO, app del banco): Mercado Pago con una caja configurada
  qrEnabled: boolean;
  // Sin acción: vista previa estática, el pedido se simula
  action?: (prev: CheckoutState, form: FormData) => Promise<CheckoutState>;
  quoteAction?: QuoteAction;
};

type Payment = "CARD" | "TRANSFER" | "QR" | "CASH" | "TICKET" | "MERCADOPAGO";
type Group = "card" | "transfer" | "cash" | "mp";

const groupOf: Record<Payment, Group> = {
  CARD: "card", TRANSFER: "transfer", QR: "transfer", CASH: "cash", TICKET: "cash", MERCADOPAGO: "mp",
};

const submitText: Record<Payment, string> = {
  CARD: "Pagar con tarjeta",
  TRANSFER: "Confirmar pedido",
  QR: "Generar QR de pago",
  CASH: "Reservar pedido",
  TICKET: "Generar cupón de pago",
  MERCADOPAGO: "Pagar con Mercado Pago",
};

function PaymentChoice(props: {
  group: Group;
  current: Group;
  onSelect: () => void;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  const selected = props.group === props.current;
  return (
    <div className="choice-group">
      <label className="choice">
        <input type="radio" name="paymentGroup" checked={selected} onChange={props.onSelect} />
        <span>
          <strong>{props.title}</strong>
          <small>{props.text}</small>
        </span>
      </label>
      {selected && props.children && <div className="choice-options">{props.children}</div>}
    </div>
  );
}

function SubChoice(props: { value: Payment; payment: Payment; onSelect: (p: Payment) => void; title: string; text: string }) {
  return (
    <label className="choice choice-sub">
      <input type="radio" name="paymentOption" checked={props.payment === props.value} onChange={() => props.onSelect(props.value)} />
      <span>
        <strong>{props.title}</strong>
        <small>{props.text}</small>
      </span>
    </label>
  );
}

export function CheckoutForm({ mercadoPagoEnabled, qrEnabled, action: placeOrder, quoteAction }: Props) {
  const { items, subtotal, ready, clear, destination, setDestination } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    placeOrder ?? (async () => { clear(); return { demo: true }; }),
    null,
  );
  const [shipping, setShipping] = useState<"PICKUP" | "DELIVERY">("DELIVERY");
  const [payment, setPayment] = useState<Payment>(mercadoPagoEnabled ? "CARD" : "TRANSFER");
  const group = groupOf[payment];
  const { quote, loading } = useShippingQuote(destination, quoteAction);
  const zip = destination?.zip ?? "";
  const province = destination?.province ?? "";

  if (!ready) return null;
  if (state?.demo) {
    return (
      <div className="notice" style={{ marginTop: 28 }}>
        <h2 style={{ marginTop: 0 }}>¡Listo! (vista previa)</h2>
        <p>En la tienda real acá se crea el pedido y se te lleva a pagar con el medio que elegiste: Mercado Pago, el QR, el cupón de Pago Fácil o Rapipago, o los datos para transferir. En esta vista previa no se generó ningún pedido ni cobro.</p>
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
  const discount = hasCashDiscount(payment) ? Math.round((subtotal * store.transferDiscountPct) / 100) : 0;
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

  const chooseShipping = (method: "PICKUP" | "DELIVERY") => setShipping(method);

  return (
    <form action={action} className="cart-layout">
      <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })))} />
      <input type="text" name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />

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
            <PaymentChoice group="card" current={group} onSelect={() => setPayment("CARD")}
              title="Tarjeta de crédito o débito"
              text={`Crédito en hasta ${store.installments} cuotas sin interés, o débito. Se paga con Mercado Pago, no necesitás tener cuenta.`}
            />
          )}
          <PaymentChoice group="transfer" current={group} onSelect={() => setPayment(qrEnabled ? "QR" : "TRANSFER")}
            title={`Transferencia bancaria · ${store.transferDiscountPct}% off`}
            text="Desde MODO, la app de tu banco o el home banking."
          >
            {qrEnabled && (
              <SubChoice value="QR" payment={payment} onSelect={setPayment}
                title="Con QR" text="Lo generamos al confirmar y lo escaneás desde MODO, Mercado Pago o la app de tu banco."
              />
            )}
            <SubChoice value="TRANSFER" payment={payment} onSelect={setPayment}
              title="Al alias o CBU / CVU" text="Te mostramos los datos al confirmar y nos mandás el comprobante por WhatsApp."
            />
          </PaymentChoice>
          <PaymentChoice group="cash" current={group} onSelect={() => setPayment("CASH")}
            title={`Efectivo · ${store.transferDiscountPct}% off`}
            text={mercadoPagoEnabled ? "En el local o en Pago Fácil / Rapipago." : "En el local."}
          >
            <SubChoice value="CASH" payment={payment} onSelect={setPayment}
              title="En el local"
              text={`${store.address} · ${store.hours}.${shipping === "DELIVERY" ? " Cuando pagás, lo despachamos." : ""}`}
            />
            {mercadoPagoEnabled && (
              <SubChoice value="TICKET" payment={payment} onSelect={setPayment}
                title="En Pago Fácil o Rapipago"
                text={`Te damos un cupón para pagar en cualquier sucursal.${store.ticketDiscount ? "" : " Precio de lista."}`}
              />
            )}
          </PaymentChoice>
          {mercadoPagoEnabled && (
            <PaymentChoice group="mp" current={group} onSelect={() => setPayment("MERCADOPAGO")}
              title="Mercado Pago"
              text="Dinero en cuenta, Mercado Crédito o tus tarjetas guardadas. Precio de lista."
            />
          )}
          <input type="hidden" name="paymentMethod" value={payment} />
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>El descuento se aplica sobre los productos, no sobre el envío.</p>
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
        {discount > 0 && <div className="summary-row"><span>Descuento {groupOf[payment] === "cash" ? "efectivo" : "transferencia"} ({store.transferDiscountPct}%)</span><span>−{formatPrice(discount)}</span></div>}
        <div className="summary-row">
          <span>Envío{shipping === "DELIVERY" && quote && !free ? ` (${quote.zone})` : ""}</span>
          <span>{shippingCost === null ? <span className="muted">A cotizar</span> : shippingCost ? formatPrice(shippingCost) : "Gratis"}</span>
        </div>
        <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
        <label className="terms">
          <input type="checkbox" name="terms" required />
          <span>
            Acepto los <Link href="/terminos" target="_blank">términos y condiciones</Link> y la{" "}
            <Link href="/privacidad" target="_blank">política de privacidad</Link>.
          </span>
        </label>
        {state?.error && <p className="alert" role="alert">{state.error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? "Procesando…" : submitText[payment]}
        </button>
      </aside>
    </form>
  );
}

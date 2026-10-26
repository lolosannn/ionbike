import { financingPlans, formatPrice, transferPrice } from "@/lib/pricing";
import { store } from "@/config/store";

/** Cuánto sale el carrito con cada medio de pago (sin contar el envío). */
export function PaymentOptions({ subtotal }: { subtotal: number }) {
  const plans = financingPlans(subtotal);
  const discounted = formatPrice(transferPrice(subtotal));
  const off = `${store.transferDiscountPct}% off · ahorrás ${formatPrice(subtotal - transferPrice(subtotal))}`;
  return (
    <section className="pay-options" aria-labelledby="formas-de-pago">
      <h2 id="formas-de-pago">Formas de pago</h2>
      <ul>
        <li>
          <span>
            <strong>Tarjeta de crédito o débito</strong>
            <small>
              {plans.map((p) => `${p.cuotas} cuotas${p.interestFree ? " sin interés" : ""} de ${formatPrice(p.cuota)}`).join(" · ")}
            </small>
          </span>
          <b>{formatPrice(plans[plans.length - 1]?.total ?? subtotal)}</b>
        </li>
        <li>
          <span>
            <strong>Transferencia bancaria</strong>
            <small>Con QR o al alias, desde MODO o la app de tu banco · {off}</small>
          </span>
          <b className="pay-highlight">{discounted}</b>
        </li>
        <li>
          <span>
            <strong>Efectivo</strong>
            <small>
              En el local{store.ticketDiscount ? " o en Pago Fácil / Rapipago" : ""} · {off}
              {!store.ticketDiscount && " · Pago Fácil / Rapipago a precio de lista"}
            </small>
          </span>
          <b className="pay-highlight">{discounted}</b>
        </li>
        <li>
          <span>
            <strong>Mercado Pago</strong>
            <small>Dinero en cuenta, Mercado Crédito o tus tarjetas guardadas</small>
          </span>
          <b>{formatPrice(subtotal)}</b>
        </li>
      </ul>
      <div className="pay-chips">
        {store.paymentBrands.map((b) => <span key={b}>{b}</span>)}
      </div>
      <p className="muted pay-note">El descuento se aplica sobre los productos, no sobre el envío.</p>
    </section>
  );
}

import { financingPlans, formatPrice, transferPrice } from "@/lib/pricing";
import { store } from "@/config/store";

/** Cuánto sale el carrito con cada medio de pago (sin contar el envío). */
export function PaymentOptions({ subtotal }: { subtotal: number }) {
  const plans = financingPlans(subtotal);
  return (
    <section className="pay-options" aria-labelledby="formas-de-pago">
      <h2 id="formas-de-pago">Formas de pago</h2>
      <ul>
        <li>
          <span>
            <strong>Transferencia o efectivo en el local</strong>
            <small>{store.transferDiscountPct}% off · ahorrás {formatPrice(subtotal - transferPrice(subtotal))}</small>
          </span>
          <b className="pay-highlight">{formatPrice(transferPrice(subtotal))}</b>
        </li>
        <li>
          <span>
            <strong>Tarjeta de crédito</strong>
            <small>
              {plans.map((p) => `${p.cuotas} cuotas${p.interestFree ? " sin interés" : ""} de ${formatPrice(p.cuota)}`).join(" · ")}
            </small>
          </span>
          <b>{formatPrice(plans[plans.length - 1]?.total ?? subtotal)}</b>
        </li>
        <li>
          <span>
            <strong>Débito, dinero en Mercado Pago, Pago Fácil o Rapipago</strong>
            <small>Un pago, precio de lista</small>
          </span>
          <b>{formatPrice(subtotal)}</b>
        </li>
      </ul>
      <div className="pay-chips">
        {store.paymentBrands.map((b) => <span key={b}>{b}</span>)}
      </div>
      <p className="muted pay-note">Los pagos con tarjeta, débito y efectivo en Pago Fácil o Rapipago se hacen con Mercado Pago. El descuento no se aplica sobre el envío.</p>
    </section>
  );
}

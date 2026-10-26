"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, hasFreeShipping } from "@/lib/pricing";
import { normalizeZip, provinces, type ShippingQuote } from "@/lib/shipping";
import { store } from "@/config/store";

/** Cotizador del carrito: código postal + provincia → costo y plazo de Andreani. */
export function ShippingCalculator({ quote, loading }: { quote: ShippingQuote | null; loading: boolean }) {
  const { subtotal, destination, setDestination } = useCart();
  const [zip, setZip] = useState(destination?.zip ?? "");
  const [province, setProvince] = useState(destination?.province ?? "");
  const [error, setError] = useState("");
  const free = hasFreeShipping(subtotal);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizeZip(zip)) return setError("Ingresá un código postal de 4 números.");
    if (!province) return setError("Elegí la provincia.");
    setError("");
    setDestination({ zip: zip.trim(), province });
  };

  return (
    <div className="ship-calc">
      <h3>{free ? "¿Cuándo te llega?" : "Calculá el envío"}</h3>
      <form onSubmit={submit} className="ship-calc-form">
        <input
          className="input"
          aria-label="Código postal"
          placeholder="Código postal"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={8}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
        />
        <select className="input" aria-label="Provincia" value={province} onChange={(e) => setProvince(e.target.value)}>
          <option value="">Provincia</option>
          {provinces.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button type="submit" className="btn btn-outline">Calcular</button>
      </form>
      {error && <p className="ship-calc-error" role="alert">{error}</p>}

      {destination && !error && (
        <ul className="ship-options" aria-live="polite">
          <li>
            <span>
              <strong>Andreani a domicilio</strong>
              <small>
                {loading ? "Cotizando…" : quote ? `${quote.zone} · ${quote.days}` : "No pudimos cotizar, lo vemos al confirmar"}
                {quote?.source === "tabla" && !quote.free && " · costo estimado"}
              </small>
            </span>
            <b>{loading || !quote ? "—" : quote.free ? "Gratis" : formatPrice(quote.cost)}</b>
          </li>
          <li>
            <span>
              <strong>Retiro en el local</strong>
              <small>{store.address}</small>
            </span>
            <b>Gratis</b>
          </li>
        </ul>
      )}
    </div>
  );
}

/** Barra de avance hacia el envío gratis. */
export function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const free = hasFreeShipping(subtotal);
  const pct = Math.min(100, Math.round((subtotal / store.freeShippingFrom) * 100));
  return (
    <div className="free-ship">
      <p>
        {free
          ? <><strong>¡Tenés envío gratis</strong> a todo el país!</>
          : <>Te faltan <strong>{formatPrice(store.freeShippingFrom - subtotal)}</strong> para el envío gratis.</>}
      </p>
      <div className="free-ship-bar" role="progressbar" aria-label="Avance hacia el envío gratis" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

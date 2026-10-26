"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, hasFreeShipping, transferPrice } from "@/lib/pricing";
import { TrashIcon } from "@/components/icons";
import { ProductImage } from "@/components/product/ProductCard";
import { FreeShippingProgress, ShippingCalculator } from "@/components/cart/ShippingCalculator";
import { PaymentOptions } from "@/components/cart/PaymentOptions";
import { useShippingQuote, type QuoteAction } from "@/components/cart/useShippingQuote";

export function CartView({ quoteAction }: { quoteAction?: QuoteAction }) {
  const { items, count, subtotal, ready, destination, setQuantity, remove } = useCart();
  const { quote, loading } = useShippingQuote(destination, quoteAction);
  const free = hasFreeShipping(subtotal);
  // Hasta elegir la forma de entrega se muestra el envío a domicilio cotizado, si lo hay
  const shippingCost = free ? 0 : quote?.cost ?? null;

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="display">Tu carrito</h1>
      </div>

      {!ready ? null : items.length === 0 ? (
        <div className="empty" style={{ marginTop: 28 }}>
          <p>Tu carrito está vacío.</p>
          <Link href="/categoria/bicicletas" className="btn btn-primary">Ver bicicletas</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.variantId} className="cart-item">
                <div className="cart-thumb"><ProductImage src={item.image} alt="" /></div>
                <div className="cart-item-info">
                  <Link href={`/producto/${item.slug}`}>{item.name}</Link>
                  {item.variantLabel && <div className="muted" style={{ fontSize: 14 }}>{item.variantLabel}</div>}
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{formatPrice(item.price * item.quantity)}</div>
                </div>
                <div className="qty" role="group" aria-label={`Cantidad de ${item.name}`}>
                  <button type="button" aria-label="Restar uno" onClick={() => setQuantity(item.variantId, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label="Sumar uno" onClick={() => setQuantity(item.variantId, item.quantity + 1)}>+</button>
                </div>
                <button type="button" className="icon-btn" aria-label={`Quitar ${item.name}`} onClick={() => remove(item.variantId)}>
                  <TrashIcon />
                </button>
              </div>
            ))}
            <PaymentOptions subtotal={subtotal} />
          </div>

          <aside className="summary" aria-label="Resumen">
            <h2>Resumen</h2>
            <FreeShippingProgress subtotal={subtotal} />
            <div className="summary-row"><span>Subtotal ({count} {count === 1 ? "producto" : "productos"})</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary-row">
              <span>Envío</span>
              <span>{free ? "Gratis" : shippingCost !== null ? formatPrice(shippingCost) : <span className="muted">Ingresá tu código postal</span>}</span>
            </div>
            <ShippingCalculator quote={quote} loading={loading} />
            <div className="summary-row total"><span>Total</span><span>{formatPrice(subtotal + (shippingCost ?? 0))}</span></div>
            <p className="price-note" style={{ margin: 0 }}>
              Con transferencia o efectivo: <strong style={{ color: "var(--accent)" }}>{formatPrice(transferPrice(subtotal) + (shippingCost ?? 0))}</strong>
            </p>
            <Link href="/checkout" className="btn btn-primary btn-block">Iniciar compra</Link>
            <Link href="/categoria/bicicletas" className="btn btn-outline btn-block">Seguir comprando</Link>
          </aside>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, hasFreeShipping, transferPrice } from "@/lib/pricing";
import { store } from "@/config/store";
import { TrashIcon } from "@/components/icons";
import { ProductImage } from "@/components/product/ProductCard";

export default function CartPage() {
  const { items, subtotal, ready, setQuantity, remove } = useCart();

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
          </div>

          <aside className="summary" aria-label="Resumen">
            <h2>Resumen</h2>
            <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary-row muted">
              <span>Envío</span>
              <span>{hasFreeShipping(subtotal) ? "Gratis" : "Se calcula en el checkout"}</span>
            </div>
            <div className="summary-row total"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
            <p className="price-note" style={{ margin: 0 }}>
              Pagando con transferencia: <strong style={{ color: "var(--accent)" }}>{formatPrice(transferPrice(subtotal))}</strong>
            </p>
            {!hasFreeShipping(subtotal) && (
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                Te faltan {formatPrice(store.freeShippingFrom - subtotal)} para el envío gratis.
              </p>
            )}
            <Link href="/checkout" className="btn btn-primary btn-block">Iniciar compra</Link>
            <Link href="/categoria/bicicletas" className="btn btn-outline btn-block">Seguir comprando</Link>
          </aside>
        </div>
      )}
    </div>
  );
}

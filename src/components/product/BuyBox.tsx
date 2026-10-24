"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { formatSize, variantLabel } from "@/lib/variants";
import { whatsappUrl } from "@/config/store";

type VariantOption = {
  id: string;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  stock: number;
};

type Props = {
  product: { slug: string; name: string; price: number; image: string | null };
  variants: VariantOption[];
};

export function BuyBox({ product, variants }: Props) {
  const router = useRouter();
  const { add } = useCart();

  const colors = useMemo(() => {
    const map = new Map<string, string | null>();
    variants.forEach((v) => v.color && map.set(v.color, v.colorHex));
    return [...map];
  }, [variants]);
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean) as string[])], [variants]);

  const firstInStock = variants.find((v) => v.stock > 0) ?? variants[0];
  const [color, setColor] = useState<string | null>(firstInStock?.color ?? null);
  const [size, setSize] = useState<string | null>(firstInStock?.size ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.color === color && v.size === size);
  const stock = variant?.stock ?? 0;
  const stockFor = (c: string | null, s: string | null) =>
    variants.find((v) => v.color === c && v.size === s)?.stock ?? 0;

  const label = variantLabel({ color, size });

  const addToCart = (goToCart: boolean) => {
    if (!variant || stock < 1) return;
    add({
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      variantLabel: label,
      image: product.image,
      price: product.price,
      quantity: qty,
      maxStock: stock,
    });
    if (goToCart) router.push("/carrito");
    else setAdded(true);
  };

  return (
    <>
      {colors.length > 0 && (
        <div className="option-group">
          <h2>Color: <span>{color ?? "Elegí uno"}</span></h2>
          <div className="chip-row">
            {colors.map(([name, hex]) => (
              <label key={name} className="swatch" title={name}>
                <input
                  type="radio"
                  name="color"
                  aria-label={name}
                  checked={color === name}
                  onChange={() => { setColor(name); setQty(1); setAdded(false); }}
                />
                <span style={{ background: hex ?? "#777" }} />
              </label>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="option-group">
          <h2>{sizes.every((s) => /^\d+$/.test(s)) ? "Rodado" : "Talle"}</h2>
          <div className="chip-row">
            {sizes.map((s) => {
              const out = stockFor(color, s) < 1;
              return (
                <label key={s} className="size-chip" style={out ? { opacity: 0.45 } : undefined}>
                  <input
                    type="radio"
                    name="size"
                    checked={size === s}
                    disabled={out}
                    onChange={() => { setSize(s); setQty(1); setAdded(false); }}
                  />
                  <span>{formatSize(s)}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <p className={`stock-note${stock > 0 && stock <= 3 ? " low" : ""}`} aria-live="polite">
        {!variant ? "Esa combinación no está disponible." : stock < 1 ? "Sin stock en esta opción." : stock <= 3 ? `¡Quedan ${stock}!` : "En stock"}
        {(!variant || stock < 1) && (
          <>
            {" "}
            <a href={whatsappUrl(`Hola! Quiero consultar por la ${product.name}${label ? ` (${label})` : ""}`)} target="_blank" rel="noreferrer">
              Consultanos por WhatsApp
            </a>
          </>
        )}
      </p>

      <div className="buy-row">
        <div className="qty" role="group" aria-label="Cantidad">
          <button type="button" aria-label="Restar uno" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button type="button" aria-label="Sumar uno" onClick={() => setQty((q) => Math.min(Math.max(stock, 1), q + 1))}>+</button>
        </div>
        <button type="button" className="btn btn-primary" disabled={!variant || stock < 1} onClick={() => addToCart(true)}>
          Comprar ahora
        </button>
      </div>
      <button type="button" className="btn btn-outline btn-block" disabled={!variant || stock < 1} onClick={() => addToCart(false)}>
        {added ? "¡Agregado al carrito!" : "Agregar al carrito"}
      </button>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, getRelatedProducts } from "@/lib/catalog";
import { formatPrice, hasFreeShipping, installmentPrice, transferPrice } from "@/lib/pricing";
import { store } from "@/config/store";
import { BuyBox } from "@/components/product/BuyBox";
import { Gallery } from "@/components/product/Gallery";
import { ProductCard } from "@/components/product/ProductCard";
import { PinIcon, ShieldIcon, TruckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return { title: product?.name ?? "Producto", description: product?.description.slice(0, 160) };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product.categoryId, product.slug);
  const specs = (Array.isArray(product.specs) ? product.specs : []) as { label: string; value: string }[];
  const off = product.compareAt && product.compareAt > product.price
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : null;
  const parent = product.category.parent;

  return (
    <div className="container">
      <nav aria-label="Ruta de navegación" className="breadcrumb" style={{ paddingTop: 32 }}>
        <Link href="/">Inicio</Link>
        {parent && <> / <Link href={`/categoria/${parent.slug}`}>{parent.name}</Link></>}
        {" / "}<Link href={`/categoria/${product.category.slug}`}>{product.category.name}</Link>
      </nav>

      <div className="pdp">
        <Gallery images={product.images} alt={product.name} />

        <div className="pdp-info">
          <span className="product-meta">{[product.brand?.name, product.category.name].filter(Boolean).join(" · ")}</span>
          <h1 className="display">{product.name}</h1>

          <div className="pdp-price">
            <span className="price-list">
              {off && product.compareAt && <s>{formatPrice(product.compareAt)}</s>}
              {formatPrice(product.price)} con tarjeta
              {off && <span className="badge badge-accent" style={{ marginLeft: 8 }}>{off}% OFF</span>}
            </span>
            <span className="price-transfer">{formatPrice(transferPrice(product.price))}</span>
            <span className="price-note">
              con transferencia ({store.transferDiscountPct}% off) · o {store.installments} cuotas sin interés de{" "}
              {formatPrice(installmentPrice(product.price))}
            </span>
          </div>

          <BuyBox
            product={{ slug: product.slug, name: product.name, price: product.price, image: product.images[0] ?? null }}
            variants={product.variants.map((v) => ({ id: v.id, color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock }))}
          />

          <ul className="perks">
            <li><TruckIcon size={20} />{hasFreeShipping(product.price) ? "Envío gratis a todo el país" : `Envío gratis desde ${formatPrice(store.freeShippingFrom)}`}</li>
            <li><PinIcon size={20} />Retiro sin cargo en {store.address}</li>
            <li><ShieldIcon />Compra protegida</li>
          </ul>
        </div>
      </div>

      {(product.description || specs.length > 0) && (
        <section className="section" style={{ display: "flex", flexWrap: "wrap", gap: 48 }}>
          {product.description && (
            <div style={{ flex: "1 1 420px" }}>
              <h2 className="display" style={{ fontSize: 40, marginBottom: 16 }}>Descripción</h2>
              <p className="pdp-desc">{product.description}</p>
            </div>
          )}
          {specs.length > 0 && (
            <div style={{ flex: "1 1 420px" }}>
              <h2 className="display" style={{ fontSize: 40, marginBottom: 16 }}>Especificaciones</h2>
              <table className="specs">
                <tbody>
                  {specs.map((s) => (
                    <tr key={s.label}><th scope="row">{s.label}</th><td>{s.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="display">También te puede gustar</h2>
          </div>
          <div className="product-grid">
            {related.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

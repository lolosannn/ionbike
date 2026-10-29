import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { discountPct, formatPrice, hasFreeShipping, installmentPrice, transferPrice } from "@/lib/pricing";
import { store } from "@/config/store";
import { BikeIcon } from "@/components/icons";
import { PromoBadge } from "@/components/promos/Promos";

export function ProductImage({ src, alt }: { src: string | null; alt: string }) {
  if (src) return <img src={src} alt={alt} loading="lazy" />;
  return (
    <div className="ph">
      <BikeIcon />
      <span>Foto a cargar</span>
    </div>
  );
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const href = `/producto/${product.slug}`;
  const off = discountPct(product.price, product.compareAt);

  return (
    <article className="product-card">
      <div className="product-media">
        <ProductImage src={product.image} alt={product.name} />
        <div className="badges">
          {hasFreeShipping(product.price) && <span className="badge">Envío gratis</span>}
          {off && <span className="badge badge-accent">{off}% OFF</span>}
          <PromoBadge slug={product.slug} categories={[product.categorySlug, product.parentCategorySlug]} />
          {product.onRequest
            ? <span className="badge badge-muted">A pedido</span>
            : !product.inStock && <span className="badge badge-muted">Sin stock</span>}
        </div>
      </div>
      <div className="product-body">
        <span className="product-meta">
          {[product.brand, product.category].filter(Boolean).join(" · ")}
        </span>
        <h3 className="product-name"><Link href={href}>{product.name}</Link></h3>
        {product.colors.length > 1 && (
          <span className="product-colors">{product.colors.length} colores</span>
        )}
        <div className="price-block">
          <span className="price-list">
            {off && product.compareAt && <s>{formatPrice(product.compareAt)}</s>}
            {formatPrice(product.price)} con tarjeta
          </span>
          <span className="price-transfer">{formatPrice(transferPrice(product.price))}</span>
          <span className="price-note">
            con transferencia · o {store.installments} cuotas de {formatPrice(installmentPrice(product.price))}
          </span>
        </div>
        <Link href={href} className="btn btn-primary">{product.onRequest ? "Consultar" : "Ver producto"}</Link>
      </div>
    </article>
  );
}

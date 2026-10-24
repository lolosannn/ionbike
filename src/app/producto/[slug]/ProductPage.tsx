import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, getRelatedProducts } from "@/lib/catalog";
import { financingPlans, formatPrice, hasFreeShipping, installmentPrice, transferPrice } from "@/lib/pricing";
import { store, whatsappUrl } from "@/config/store";
import { BuyBox } from "@/components/product/BuyBox";
import { Gallery } from "@/components/product/Gallery";
import { SpecsAccordion } from "@/components/product/SpecsAccordion";
import { ProductCard } from "@/components/product/ProductCard";
import { ChatIcon, PinIcon, RulerIcon, ShieldIcon, TruckIcon, WhatsappIcon, WrenchIcon } from "@/components/icons";

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
  const isBike = [product.category.slug, parent?.slug].some((s) => s === "bicicletas" || s === "e-bike");

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
            <div className="pdp-price-main">
              <span className="pdp-price-label">Efectivo / transferencia</span>
              <span className="price-transfer">{formatPrice(transferPrice(product.price))}</span>
              <span className="pdp-price-tag">{store.transferDiscountPct}% off aplicado</span>
            </div>
            <div className="pdp-price-side">
              <span className="price-list">
                {off && product.compareAt && <s>{formatPrice(product.compareAt)}</s>}
                Precio de lista {formatPrice(product.price)}
              </span>
              {off && <span className="badge badge-accent">{off}% OFF</span>}
              <strong>
                {store.installments} cuotas sin interés de {formatPrice(installmentPrice(product.price))}
              </strong>
            </div>
          </div>

          <section className="financing" aria-labelledby="financiacion">
            <div className="financing-head">
              <h2 id="financiacion">Financiación</h2>
              <div className="financing-brands">
                {store.paymentBrands.slice(0, 6).map((b) => <span key={b}>{b}</span>)}
              </div>
            </div>
            <ul>
              {financingPlans(product.price).map((p) => (
                <li key={p.cuotas}>
                  <span>
                    <b>{p.cuotas}</b> cuotas de <b>{formatPrice(p.cuota)}</b>
                    {p.interestFree && <span className="financing-free">Sin interés</span>}
                  </span>
                  <span className="financing-total">Total: {formatPrice(p.total)}</span>
                </li>
              ))}
            </ul>
          </section>

          <ul className="pdp-perks">
            <li><ShieldIcon size={24} />Compra protegida</li>
            <li><WrenchIcon size={24} />Taller propio</li>
            <li><PinIcon size={24} />Retiro en el local</li>
            <li><ChatIcon size={24} />Asesoramiento especializado</li>
          </ul>

          <div className="pdp-shipping">
            <TruckIcon size={28} />
            <span>
              <strong>
                {hasFreeShipping(product.price) ? "¡Envío gratis a todo el país!" : `Envío gratis desde ${formatPrice(store.freeShippingFrom)}`}
              </strong>
              <span>Despacho por Andreani · o retiralo sin cargo en {store.address}</span>
            </span>
          </div>

          {product.onRequest ? (
            <div className="on-request">
              <span className="badge badge-accent">A pedido</span>
              <p>
                Este modelo lo traemos por pedido. Escribinos y te confirmamos colores, talles, precio final y
                plazo de entrega.
              </p>
              <a
                className="btn btn-whatsapp btn-block"
                href={whatsappUrl(`Hola! Quiero consultar por la ${product.name}`)}
                target="_blank"
                rel="noreferrer"
              >
                <WhatsappIcon size={20} /> Contactanos por WhatsApp
              </a>
            </div>
          ) : (
            <BuyBox
              product={{ slug: product.slug, name: product.name, price: product.price, image: product.images[0] ?? null }}
              variants={product.variants.map((v) => ({ id: v.id, color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock }))}
            />
          )}

          {!product.onRequest && (
            <a
              className="btn btn-whatsapp btn-block"
              href={whatsappUrl(`Hola! Necesito asesoramiento con la ${product.name}`)}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsappIcon size={20} /> ¿Necesitás asesoramiento?
            </a>
          )}

          {isBike && (
            <Link href="/guia-de-talles" className="size-guide-link">
              <RulerIcon /> ¿Qué talle me va? Ver la guía de talles
            </Link>
          )}

        </div>

        {(isBike || specs.length > 0) && (
          <section className="pdp-specs" aria-labelledby="especificaciones">
            <h2 id="especificaciones" className="display">Especificaciones</h2>
            {/* En las bicis se muestran todas las partes, aunque falte cargar el dato */}
            <SpecsAccordion specs={specs} allParts={isBike} />
          </section>
        )}
      </div>

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

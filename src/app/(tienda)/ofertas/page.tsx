import Link from "next/link";
import type { Metadata } from "next";
import { getSaleProducts } from "@/lib/catalog";
import { ProductListing } from "@/components/product/ProductListing";

export const metadata: Metadata = {
  title: "Ofertas",
  description: "Bicicletas, repuestos y accesorios con descuento. Envío a todo el país y retiro en Monte Grande.",
};

export default async function OffersPage() {
  const products = await getSaleProducts();

  return (
    <div className="container">
      <div className="page-head category-head">
        <nav aria-label="Ruta de navegación" className="breadcrumb">
          <Link href="/">Inicio</Link>{" / "}<span style={{ color: "var(--text)" }}>Ofertas</span>
        </nav>
        <h1 className="display">Ofertas</h1>
        <p className="category-desc">Todo lo que está con descuento, del más rebajado al menos.</p>
      </div>
      {products.length > 0 ? (
        <ProductListing products={products} subcategories={[]} />
      ) : (
        <div className="empty" style={{ marginTop: 28 }}>
          <p>Ahora no hay productos en oferta. Volvé pronto o mirá todo el catálogo.</p>
          <Link href="/categoria/bicicletas" className="btn btn-primary">Ver bicicletas</Link>
        </div>
      )}
    </div>
  );
}

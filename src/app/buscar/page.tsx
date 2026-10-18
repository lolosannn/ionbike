import { searchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buscar" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const results = q ? await searchProducts(q) : [];

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="display" style={{ fontSize: "clamp(40px, 6vw, 64px)" }}>
          {q ? <>Resultados para “{q}”</> : "Buscar"}
        </h1>
        <p className="muted">{q ? `${results.length} productos` : "Escribí qué estás buscando en el buscador."}</p>
      </div>
      {results.length > 0 ? (
        <div className="product-grid" style={{ marginTop: 24 }}>
          {results.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      ) : q ? (
        <div className="empty" style={{ marginTop: 24 }}>No encontramos productos. Probá con otra palabra.</div>
      ) : null}
    </div>
  );
}

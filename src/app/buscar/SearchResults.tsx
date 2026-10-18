"use client";

import { useSearchParams } from "next/navigation";
import type { ProductCardData } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function SearchResults({ products }: { products: ProductCardData[] }) {
  const q = (useSearchParams().get("q") ?? "").trim();
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  const results = terms.length
    ? products.filter((p) => {
        const haystack = normalize([p.name, p.brand, p.category].filter(Boolean).join(" "));
        return terms.every((t) => haystack.includes(t));
      })
    : [];

  return (
    <>
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
    </>
  );
}

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ProductCardData } from "@/lib/catalog";
import { hasFreeShipping } from "@/lib/pricing";
import { ProductCard } from "@/components/product/ProductCard";
import { formatSize } from "@/lib/variants";

type Sort = "sales" | "price-asc" | "price-desc" | "new";

type Props = {
  products: ProductCardData[];
  // Subcategorías para las pastillas (vacío si la categoría no tiene hijas)
  subcategories: { slug: string; name: string }[];
};

/** Disciplina elegida desde el inicio: /categoria/bicicletas?disciplina=mtb */
function DisciplineFromUrl({ slugs, onChange }: { slugs: string; onChange: (slug: string) => void }) {
  const disciplina = useSearchParams().get("disciplina");
  // Solo cuando cambia la dirección (no en cada render, para no pisar lo que elige el cliente)
  useEffect(() => {
    if (disciplina && slugs.split(",").includes(disciplina)) onChange(disciplina);
  }, [disciplina, slugs, onChange]);
  return null;
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ProductListing({ products, subcategories }: Props) {
  const [sub, setSub] = useState<string | null>(null);
  const [sizes, setSizes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("sales");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Mantiene la disciplina en la dirección, para volver atrás o compartir el link
  const chooseSub = (slug: string | null) => {
    setSub(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("disciplina", slug);
    else url.searchParams.delete("disciplina");
    window.history.replaceState(window.history.state, "", url);
  };

  const options = useMemo(() => {
    const sizeSet = new Set<string>();
    const brandCount = new Map<string, number>();
    const colorMap = new Map<string, string | null>();
    for (const p of products) {
      p.sizes.forEach((s) => sizeSet.add(s));
      if (p.brand) brandCount.set(p.brand, (brandCount.get(p.brand) ?? 0) + 1);
      p.colors.forEach((c) => colorMap.set(c.name, c.hex));
    }
    return {
      sizes: [...sizeSet].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
      brands: [...brandCount].sort((a, b) => a[0].localeCompare(b[0])),
      colors: [...colorMap],
    };
  }, [products]);

  const filtered = useMemo(() => {
    const minCents = min ? Number(min.replace(/\D/g, "")) * 100 : null;
    const maxCents = max ? Number(max.replace(/\D/g, "")) * 100 : null;
    const list = products.filter((p) => {
      if (sub && p.categorySlug !== sub) return false;
      if (sizes.length && !p.sizes.some((s) => sizes.includes(s))) return false;
      if (brands.length && !(p.brand && brands.includes(p.brand))) return false;
      if (colors.length && !p.colors.some((c) => colors.includes(c.name))) return false;
      if (minCents !== null && p.price < minCents) return false;
      if (maxCents !== null && p.price > maxCents) return false;
      if (freeOnly && !hasFreeShipping(p.price)) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "new") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "sales") sorted.sort((a, b) => b.salesCount - a.salesCount);
    return sorted;
  }, [products, sub, sizes, brands, colors, min, max, freeOnly, sort]);

  const clearAll = () => {
    setSizes([]); setBrands([]); setColors([]); setMin(""); setMax(""); setFreeOnly(false);
  };

  return (
    <>
      {/* Suspense: en la vista previa estática, solo esta parte espera a leer la dirección */}
      <Suspense fallback={null}>
        <DisciplineFromUrl slugs={subcategories.map((c) => c.slug).join(",")} onChange={setSub} />
      </Suspense>
      {subcategories.length > 0 && (
        <div className="pills" role="group" aria-label="Disciplina">
          <button type="button" className="pill" aria-pressed={sub === null} onClick={() => chooseSub(null)}>Todas</button>
          {subcategories.map((c) => (
            <button key={c.slug} type="button" className="pill" aria-pressed={sub === c.slug} onClick={() => chooseSub(c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="listing">
        <button
          type="button"
          className="btn btn-outline btn-block filters-toggle"
          aria-expanded={filtersOpen}
          aria-controls="filtros"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          {filtersOpen ? "Ocultar filtros" : "Filtrar"}
        </button>
        <aside id="filtros" className={`filters${filtersOpen ? " open" : ""}`} aria-label="Filtros">
          <div className="filters-head">
            <h2>Filtros</h2>
            <button type="button" className="link-btn" onClick={clearAll}>Limpiar</button>
          </div>

          {options.sizes.length > 0 && (
            <fieldset>
              <legend>Rodado / talle</legend>
              <div className="chip-row">
                {options.sizes.map((s) => (
                  <label key={s} className="size-chip">
                    <input type="checkbox" checked={sizes.includes(s)} onChange={() => setSizes(toggle(sizes, s))} />
                    <span>{formatSize(s)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {options.brands.length > 0 && (
            <fieldset>
              <legend>Marca</legend>
              {options.brands.map(([name, n]) => (
                <label key={name} className="check">
                  <input type="checkbox" checked={brands.includes(name)} onChange={() => setBrands(toggle(brands, name))} />
                  {name} <span className="muted">({n})</span>
                </label>
              ))}
            </fieldset>
          )}

          {options.colors.length > 0 && (
            <fieldset>
              <legend>Color</legend>
              <div className="chip-row">
                {options.colors.map(([name, hex]) => (
                  <label key={name} className="swatch" title={name}>
                    <input type="checkbox" aria-label={name} checked={colors.includes(name)} onChange={() => setColors(toggle(colors, name))} />
                    <span style={{ background: hex ?? "#777" }} />
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend>Precio</legend>
            <div className="chip-row" style={{ alignItems: "center", flexWrap: "nowrap" }}>
              <label htmlFor="pmin" className="sr-only">Precio mínimo</label>
              <input id="pmin" className="input" inputMode="numeric" placeholder="Mín." value={min} onChange={(e) => setMin(e.target.value)} />
              <span className="muted">–</span>
              <label htmlFor="pmax" className="sr-only">Precio máximo</label>
              <input id="pmax" className="input" inputMode="numeric" placeholder="Máx." value={max} onChange={(e) => setMax(e.target.value)} />
            </div>
          </fieldset>

          <label className="check">
            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
            Solo con envío gratis
          </label>
        </aside>

        <div className="listing-main">
          <div className="listing-bar">
            <span className="muted" aria-live="polite">{filtered.length} {filtered.length === 1 ? "producto" : "productos"}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label htmlFor="orden" className="muted" style={{ fontSize: 14 }}>Ordenar por</label>
              <select id="orden" className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="sales">Más vendidos</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="new">Más nuevos</option>
              </select>
            </div>
          </div>
          {filtered.length > 0 ? (
            <div className="product-grid">
              {filtered.map((p) => <ProductCard key={p.slug} product={p} />)}
            </div>
          ) : (
            <div className="empty">No hay productos con esos filtros.</div>
          )}
        </div>
      </div>
    </>
  );
}

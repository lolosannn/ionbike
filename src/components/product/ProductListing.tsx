"use client";

import { Fragment, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { ProductCardData } from "@/lib/catalog";
import { discountPct, hasFreeShipping } from "@/lib/pricing";
import { ProductCard } from "@/components/product/ProductCard";
import { PromoCard } from "@/components/promos/Promos";
import { usePromos } from "@/components/promos/PromosProvider";
import { formatSize } from "@/lib/variants";

type Sort = "offers" | "sales" | "price-asc" | "price-desc" | "new";

const onSale = (p: ProductCardData) => discountPct(p.price, p.compareAt) !== null;

// Tarjetas de promo entre los productos: la primera en el tercer lugar y después una cada 8
const promoSlot = (i: number) => i === 2 || (i > 2 && (i - 2) % 8 === 0);

type Props = {
  products: ProductCardData[];
  // Subcategorías para las pastillas (vacío si la categoría no tiene hijas)
  subcategories: { slug: string; name: string }[];
  // Slugs de la categoría y su madre, para mostrar solo las promos que aplican (vacío: todas)
  categorySlugs?: string[];
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

type PriceRange = { label: string; min: number | null; max: number | null };

const pesos = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const digits = (v: string) => v.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
const formatThousands = (v: string) => (v ? pesos.format(Number(v)) : "");
/** Rodados (números chicos como 26, 27.5, 29) aparte de los talles (S, M, L…) */
const isWheel = (s: string) => /^\d+(\.\d+)?$/.test(s) && Number(s) <= 29;

/** Redondea a un número "lindo" para los rangos: 1.234.567 → 1.200.000 */
function roundNice(pesosValue: number) {
  const step = 10 ** Math.max(0, Math.floor(Math.log10(pesosValue)) - 1);
  return Math.round(pesosValue / step) * step;
}

/** Tres rangos de precio armados según lo que hay en la lista */
function priceRanges(prices: number[]): PriceRange[] {
  const sorted = prices.map((c) => c / 100).sort((a, b) => a - b);
  if (sorted.length < 4) return [];
  const low = roundNice(sorted[Math.floor(sorted.length / 3)]);
  const high = roundNice(sorted[Math.floor((sorted.length * 2) / 3)]);
  if (!(low > sorted[0] && high > low && high < sorted[sorted.length - 1])) return [];
  return [
    { label: `Hasta $${pesos.format(low)}`, min: null, max: low },
    { label: `$${pesos.format(low)} a $${pesos.format(high)}`, min: low, max: high },
    { label: `Más de $${pesos.format(high)}`, min: high, max: null },
  ];
}

function priceLabel(min: string, max: string) {
  if (min && max) return `$${formatThousands(min)} a $${formatThousands(max)}`;
  return min ? `Desde $${formatThousands(min)}` : `Hasta $${formatThousands(max)}`;
}

function FilterSection({ title, active, children }: { title: string; active: number; children: ReactNode }) {
  return (
    <details className="filter-section" open>
      <summary>
        <span>{title}</span>
        {active > 0 && <span className="filters-badge">{active}</span>}
        <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="filter-section-body">{children}</div>
    </details>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
      <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
    </svg>
  );
}

export function ProductListing({ products, subcategories, categorySlugs }: Props) {
  const [sub, setSub] = useState<string | null>(null);
  const [sizes, setSizes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [saleOnly, setSaleOnly] = useState(false);
  // Por defecto, primero lo que está en oferta y después lo más vendido
  const [sort, setSort] = useState<Sort>("offers");
  const promos = usePromos("listado", categorySlugs?.length ? { categories: categorySlugs, products: products.map((p) => p.slug) } : undefined);
  // "Solo en oferta" tiene sentido si hay de los dos (en Ofertas están todos)
  const saleFilter = useMemo(() => products.some(onSale) && !products.every(onSale), [products]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // En celular los filtros se abren como panel: se traba el scroll de atrás y se cierra con Esc
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltersOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [filtersOpen]);

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
      priceRanges: priceRanges(products.map((p) => p.price)),
    };
  }, [products]);

  const filtered = useMemo(() => {
    const minCents = min ? Number(min) * 100 : null;
    const maxCents = max ? Number(max) * 100 : null;
    const list = products.filter((p) => {
      if (sub && p.categorySlug !== sub) return false;
      if (sizes.length && !p.sizes.some((s) => sizes.includes(s))) return false;
      if (brands.length && !(p.brand && brands.includes(p.brand))) return false;
      if (colors.length && !p.colors.some((c) => colors.includes(c.name))) return false;
      if (minCents !== null && p.price < minCents) return false;
      if (maxCents !== null && p.price > maxCents) return false;
      if (freeOnly && !hasFreeShipping(p.price)) return false;
      if (saleOnly && !onSale(p)) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "new") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "sales") sorted.sort((a, b) => b.salesCount - a.salesCount);
    if (sort === "offers") {
      sorted.sort((a, b) =>
        Number(onSale(b)) - Number(onSale(a)) ||
        (discountPct(b.price, b.compareAt) ?? 0) - (discountPct(a.price, a.compareAt) ?? 0) ||
        b.salesCount - a.salesCount);
    }
    return sorted;
  }, [products, sub, sizes, brands, colors, min, max, freeOnly, saleOnly, sort]);

  const clearAll = () => {
    setSizes([]); setBrands([]); setColors([]); setMin(""); setMax(""); setFreeOnly(false); setSaleOnly(false);
  };

  const priceActive = Boolean(min || max);
  const activeCount = sizes.length + brands.length + colors.length + (priceActive ? 1 : 0) + (freeOnly ? 1 : 0) + (saleOnly ? 1 : 0);
  const presetActive = (r: PriceRange) => min === (r.min ? String(r.min) : "") && max === (r.max ? String(r.max) : "");
  const choosePreset = (r: PriceRange) => {
    if (presetActive(r)) { setMin(""); setMax(""); return; }
    setMin(r.min ? String(r.min) : "");
    setMax(r.max ? String(r.max) : "");
  };

  // Filtros activos, para mostrarlos arriba del listado y sacarlos de a uno
  const activeTags: { key: string; label: string; remove: () => void }[] = [
    ...(priceActive ? [{ key: "price", label: priceLabel(min, max), remove: () => { setMin(""); setMax(""); } }] : []),
    ...(freeOnly ? [{ key: "free", label: "Envío gratis", remove: () => setFreeOnly(false) }] : []),
    ...(saleOnly ? [{ key: "sale", label: "En oferta", remove: () => setSaleOnly(false) }] : []),
    ...sizes.map((s) => ({ key: `s-${s}`, label: formatSize(s), remove: () => setSizes(toggle(sizes, s)) })),
    ...brands.map((b) => ({ key: `b-${b}`, label: b, remove: () => setBrands(toggle(brands, b)) })),
    ...colors.map((c) => ({ key: `c-${c}`, label: c, remove: () => setColors(toggle(colors, c)) })),
  ];

  const sizeGroups = [
    { label: "Rodado", items: options.sizes.filter(isWheel) },
    { label: "Talle", items: options.sizes.filter((s) => !isWheel(s)) },
  ].filter((g) => g.items.length > 0);

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
          onClick={() => setFiltersOpen(true)}
        >
          <FilterIcon /> Filtrar{activeCount > 0 && <span className="filters-badge">{activeCount}</span>}
        </button>
        {filtersOpen && <div className="filters-backdrop" onClick={() => setFiltersOpen(false)} />}
        <aside id="filtros" className={`filters${filtersOpen ? " open" : ""}`} aria-label="Filtros">
          <div className="filters-head">
            <h2>Filtros{activeCount > 0 && <span className="filters-badge">{activeCount}</span>}</h2>
            {activeCount > 0 && <button type="button" className="link-btn" onClick={clearAll}>Limpiar todo</button>}
            <button type="button" className="filters-close" aria-label="Cerrar filtros" onClick={() => setFiltersOpen(false)}>✕</button>
          </div>

          <div className="filters-body">
            <FilterSection title="Precio" active={(priceActive ? 1 : 0) + (freeOnly ? 1 : 0) + (saleOnly ? 1 : 0)}>
              {options.priceRanges.length > 0 && (
                <div className="price-presets">
                  {options.priceRanges.map((r) => (
                    <button key={r.label} type="button" className="price-preset" aria-pressed={presetActive(r)} onClick={() => choosePreset(r)}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="price-range">
                <label className="price-field">
                  <span>Desde</span>
                  <span className="price-input">
                    <i aria-hidden>$</i>
                    <input inputMode="numeric" placeholder="0" value={formatThousands(min)} onChange={(e) => setMin(digits(e.target.value))} aria-label="Precio mínimo" />
                  </span>
                </label>
                <span className="price-sep" aria-hidden>–</span>
                <label className="price-field">
                  <span>Hasta</span>
                  <span className="price-input">
                    <i aria-hidden>$</i>
                    <input inputMode="numeric" placeholder="Sin tope" value={formatThousands(max)} onChange={(e) => setMax(digits(e.target.value))} aria-label="Precio máximo" />
                  </span>
                </label>
              </div>
              <label className="switch">
                <input type="checkbox" role="switch" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
                <span className="switch-track" aria-hidden />
                Solo con envío gratis
              </label>
              {saleFilter && (
                <label className="switch">
                  <input type="checkbox" role="switch" checked={saleOnly} onChange={(e) => setSaleOnly(e.target.checked)} />
                  <span className="switch-track" aria-hidden />
                  Solo en oferta
                </label>
              )}
            </FilterSection>

            {sizeGroups.length > 0 && (
              <FilterSection title="Rodado / talle" active={sizes.length}>
                {sizeGroups.map((g) => (
                  <div key={g.label} className="filter-group" role="group" aria-label={g.label}>
                    {sizeGroups.length > 1 && <span className="filter-sublabel">{g.label}</span>}
                    <div className="chip-row">
                      {g.items.map((s) => (
                        <label key={s} className="size-chip">
                          <input type="checkbox" checked={sizes.includes(s)} onChange={() => setSizes(toggle(sizes, s))} />
                          <span>{formatSize(s)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </FilterSection>
            )}

            {options.brands.length > 0 && (
              <FilterSection title="Marca" active={brands.length}>
                <div className="brand-list">
                  {options.brands.map(([name, n]) => (
                    <label key={name} className="brand-option">
                      <input type="checkbox" checked={brands.includes(name)} onChange={() => setBrands(toggle(brands, name))} />
                      <span className="brand-box" aria-hidden />
                      <span className="brand-name">{name}</span>
                      <span className="brand-count">{n}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}

            {options.colors.length > 0 && (
              <FilterSection title="Color" active={colors.length}>
                <div className="chip-row">
                  {options.colors.map(([name, hex]) => (
                    <label key={name} className="color-chip">
                      <input type="checkbox" checked={colors.includes(name)} onChange={() => setColors(toggle(colors, name))} />
                      <span><i style={{ background: hex ?? "#777" }} />{name}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}
          </div>

          <div className="filters-foot">
            <button type="button" className="btn btn-primary btn-block" onClick={() => setFiltersOpen(false)}>
              Ver {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
            </button>
          </div>
        </aside>

        <div className="listing-main">
          <div className="listing-bar">
            <span className="muted" aria-live="polite">{filtered.length} {filtered.length === 1 ? "producto" : "productos"}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label htmlFor="orden" className="muted" style={{ fontSize: 14 }}>Ordenar por</label>
              <select id="orden" className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="offers">Ofertas primero</option>
                <option value="sales">Más vendidos</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="new">Más nuevos</option>
              </select>
            </div>
          </div>
          {activeTags.length > 0 && (
            <div className="active-filters" aria-label="Filtros aplicados">
              {activeTags.map((t) => (
                <button key={t.key} type="button" className="active-filter" onClick={t.remove} aria-label={`Quitar filtro ${t.label}`}>
                  {t.label} <span aria-hidden>✕</span>
                </button>
              ))}
              <button type="button" className="link-btn" onClick={clearAll}>Limpiar todo</button>
            </div>
          )}
          {filtered.length > 0 ? (
            <div className="product-grid">
              {filtered.map((p, i) => {
                // Cada lugar de promo toma la siguiente promo vigente, hasta que se acaban
                const slot = promoSlot(i) ? (i === 2 ? 0 : (i - 2) / 8) : -1;
                const promo = slot >= 0 ? promos[slot] : undefined;
                return (
                  <Fragment key={p.slug}>
                    {promo && <PromoCard promo={promo} />}
                    <ProductCard product={p} />
                  </Fragment>
                );
              })}
              {/* Con pocos productos, la promo va al final para que igual se vea */}
              {filtered.length > 0 && filtered.length <= 2 && promos[0] && <PromoCard promo={promos[0]} />}
            </div>
          ) : (
            <div className="empty">
              No hay productos con esos filtros.
              {activeCount > 0 && <> <button type="button" className="link-btn" onClick={clearAll}>Limpiar filtros</button></>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

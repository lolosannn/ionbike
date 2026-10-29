"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { ProductRow } from "@/lib/admin/products";
import type { CategoryOption } from "@/lib/admin/product-form";
import { discountPct, formatPrice } from "@/lib/pricing";
import { BikeIcon, SearchIcon } from "@/components/icons";

type Status = "todos" | "publicados" | "ocultos" | "sin-stock";

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ProductsTable({
  rows: initialRows,
  categories,
  setActive,
}: {
  rows: ProductRow[];
  categories: CategoryOption[];
  // Sin acción (vista previa): el cambio se ve pero no se guarda
  setActive?: (id: string, active: boolean) => Promise<{ ok: boolean }>;
}) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<Status>("todos");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Una categoría madre incluye a sus hijas (Bicicletas → MTB, Ruta…)
  const categoryIds = useMemo(() => {
    if (!category) return null;
    const parent = categories.find((c) => c.id === category);
    return new Set([category, ...categories.filter((c) => parent && c.parentSlug === parent.slug).map((c) => c.id)]);
  }, [category, categories]);

  const filtered = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return rows.filter((r) => {
      if (categoryIds && !categoryIds.has(r.categoryId)) return false;
      if (status === "publicados" && !r.active) return false;
      if (status === "ocultos" && r.active) return false;
      if (status === "sin-stock" && (r.stock > 0 || r.onRequest)) return false;
      const haystack = normalize([r.name, r.brand, r.category, r.slug].filter(Boolean).join(" "));
      return terms.every((t) => haystack.includes(t));
    });
  }, [rows, query, categoryIds, status]);

  const counts = {
    todos: rows.length,
    publicados: rows.filter((r) => r.active).length,
    ocultos: rows.filter((r) => !r.active).length,
    "sin-stock": rows.filter((r) => r.stock === 0 && !r.onRequest).length,
  };

  const toggle = (row: ProductRow) => {
    setError("");
    const active = !row.active;
    setRows((list) => list.map((r) => (r.id === row.id ? { ...r, active } : r)));
    if (!setActive) return;
    startTransition(async () => {
      const res = await setActive(row.id, active);
      if (!res.ok) {
        setRows((list) => list.map((r) => (r.id === row.id ? { ...r, active: row.active } : r)));
        setError(`No se pudo ${active ? "publicar" : "ocultar"} "${row.name}". Recargá la página.`);
      }
    });
  };

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Productos</h1>
          <p className="adm-sub">{counts.publicados} publicados · {counts.ocultos} ocultos{counts["sin-stock"] > 0 && <> · <b className="adm-warn-text">{counts["sin-stock"]} sin stock</b></>}</p>
        </div>
        <Link href="/admin/productos/nuevo" className="adm-btn adm-btn-primary">+ Nuevo producto</Link>
      </header>

      <div className="adm-toolbar">
        <label className="adm-search">
          <SearchIcon size={18} />
          <span className="sr-only">Buscar</span>
          <input type="search" placeholder="Buscar por nombre, marca o categoría" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="adm-input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.parentName ? `   ${c.parentName} › ${c.name}` : c.name}</option>
          ))}
        </select>
        <div className="adm-tabs" role="group" aria-label="Estado">
          {(["todos", "publicados", "ocultos", "sin-stock"] as Status[]).map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === "sin-stock" ? "Sin stock" : s[0].toUpperCase() + s.slice(1)} <span>{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="adm-alert" role="alert">{error}</p>}

      {filtered.length === 0 ? (
        <div className="adm-empty">
          {rows.length === 0 ? <>Todavía no hay productos. <Link href="/admin/productos/nuevo">Cargá el primero</Link>.</> : "No hay productos con esos filtros."}
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="num">Precio</th>
                <th className="num">Stock</th>
                <th>Visible</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const off = discountPct(r.price, r.compareAt);
                return (
                  <tr key={r.id} className={r.active ? undefined : "is-hidden"}>
                    <td>
                      <Link href={`/admin/productos/${r.id}`} className="adm-product-cell">
                        <span className="adm-thumb">{r.image ? <img src={r.image} alt="" loading="lazy" /> : <BikeIcon size={22} />}</span>
                        <span>
                          <strong>{r.name}</strong>
                          <small>
                            {r.brand ?? "Sin marca"}
                            {r.featured && <em className="adm-chip">Destacado</em>}
                            {r.onRequest && <em className="adm-chip">A pedido</em>}
                          </small>
                        </span>
                      </Link>
                    </td>
                    <td data-label="Categoría">{r.category}</td>
                    <td data-label="Precio" className="num">
                      {r.compareAt && off && <s className="adm-muted">{formatPrice(r.compareAt)}</s>}
                      <b>{formatPrice(r.price)}</b>
                      {off && <em className="adm-chip adm-chip-accent">{off}% OFF</em>}
                    </td>
                    <td data-label="Stock" className="num">
                      {r.onRequest ? <span className="adm-muted">A pedido</span> : (
                        <span className={r.stock === 0 ? "adm-stock-out" : r.stock <= 2 ? "adm-stock-low" : undefined}>
                          {r.stock} u.
                        </span>
                      )}
                      <small className="adm-muted"> · {r.variants} {r.variants === 1 ? "variante" : "variantes"}</small>
                    </td>
                    <td data-label="Visible">
                      <label className="adm-switch" title={r.active ? "Se ve en la tienda" : "Oculto en la tienda"}>
                        <input type="checkbox" role="switch" checked={r.active} disabled={pending} onChange={() => toggle(r)} aria-label={`Mostrar ${r.name} en la tienda`} />
                        <span aria-hidden />
                      </label>
                    </td>
                    <td className="adm-row-actions">
                      <Link href={`/admin/productos/${r.id}`} className="adm-btn adm-btn-sm">Editar</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

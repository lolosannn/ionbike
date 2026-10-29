"use client";

import { useState } from "react";
import { palette } from "@/data/catalog";
import { skuFor, type VariantForm } from "@/lib/admin/product-form";

const sizeSuggestions = ["12", "16", "20", "24", "26", "27.5", "29", "XS", "S", "M", "L", "XL", "XXL", "Único"];
const empty: VariantForm = { id: "", color: "", colorHex: "", size: "", stock: 0, sku: "" };

const guessHex = (color: string) =>
  Object.entries(palette).find(([name]) => name.toLowerCase() === color.trim().toLowerCase())?.[1]?.toLowerCase() ?? "";

const splitList = (text: string) => [...new Set(text.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean))];

/**
 * Variantes del producto: cada combinación de color y rodado/talle con su stock.
 * Un producto sin colores ni talles (un inflador) lleva una sola variante vacía.
 */
export function VariantsField({
  variants,
  onChange,
  slug,
}: {
  variants: VariantForm[];
  onChange: (variants: VariantForm[]) => void;
  slug: string;
}) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkColors, setBulkColors] = useState("");
  const [bulkSizes, setBulkSizes] = useState("");
  const [bulkStock, setBulkStock] = useState(0);

  const update = (i: number, patch: Partial<VariantForm>) =>
    onChange(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  const total = variants.reduce((n, v) => n + (Number.isFinite(v.stock) ? v.stock : 0), 0);

  const generate = () => {
    const colors = splitList(bulkColors);
    const sizes = splitList(bulkSizes);
    if (!colors.length && !sizes.length) return;
    // Si solo hay una variante vacía (producto nuevo), se reemplaza
    const base = variants.filter((v) => v.color || v.size || v.id);
    const exists = (c: string, s: string) => base.some((v) => v.color.toLowerCase() === c.toLowerCase() && v.size.toLowerCase() === s.toLowerCase());
    const added: VariantForm[] = [];
    for (const color of colors.length ? colors : [""]) {
      for (const size of sizes.length ? sizes : [""]) {
        if (!exists(color, size)) added.push({ ...empty, color, size, colorHex: guessHex(color), stock: bulkStock });
      }
    }
    onChange([...base, ...added]);
    setBulkOpen(false);
    setBulkColors("");
    setBulkSizes("");
  };

  return (
    <div className="adm-variants">
      <div className="adm-variants-bar">
        <span className="adm-muted">{variants.length} {variants.length === 1 ? "variante" : "variantes"} · <b className={total === 0 ? "adm-stock-out" : undefined}>{total} unidades</b> en total</span>
        <div className="adm-inline-actions">
          <button type="button" className="adm-btn adm-btn-sm" onClick={() => setBulkOpen((o) => !o)} aria-expanded={bulkOpen}>Cargar varias juntas</button>
          <button type="button" className="adm-btn adm-btn-sm" onClick={() => onChange([...variants, { ...empty }])}>+ Agregar variante</button>
        </div>
      </div>

      {bulkOpen && (
        <div className="adm-bulk">
          <p>Escribí los colores y los rodados o talles separados por coma: se crean todas las combinaciones que falten.</p>
          <div className="adm-bulk-grid">
            <label className="adm-field">
              <span>Colores</span>
              <input className="adm-input" value={bulkColors} onChange={(e) => setBulkColors(e.target.value)} placeholder="Negro, Rojo, Gris" />
            </label>
            <label className="adm-field">
              <span>Rodados o talles</span>
              <input className="adm-input" value={bulkSizes} onChange={(e) => setBulkSizes(e.target.value)} placeholder="29 o S, M, L" />
            </label>
            <label className="adm-field">
              <span>Stock de cada una</span>
              <input className="adm-input" type="number" min={0} value={bulkStock} onChange={(e) => setBulkStock(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
            </label>
          </div>
          <div className="adm-inline-actions">
            <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={generate}>Crear variantes</button>
            <button type="button" className="adm-btn adm-btn-sm adm-btn-ghost" onClick={() => setBulkOpen(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table adm-variant-table">
          <thead>
            <tr>
              <th>Color</th>
              <th>Rodado / talle</th>
              <th>Stock</th>
              <th>SKU</th>
              <th><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v, i) => (
              <tr key={i}>
                <td data-label="Color">
                  <div className="adm-color-input">
                    <input
                      type="color"
                      value={v.colorHex || "#777777"}
                      onChange={(e) => update(i, { colorHex: e.target.value })}
                      aria-label={`Tono del color ${v.color || "de la variante"}`}
                      className={v.colorHex ? undefined : "is-unset"}
                    />
                    <input
                      className="adm-input"
                      list="adm-colors"
                      value={v.color}
                      placeholder="Sin color"
                      maxLength={40}
                      onChange={(e) => update(i, { color: e.target.value, colorHex: v.colorHex || guessHex(e.target.value) })}
                      aria-label="Color"
                    />
                  </div>
                </td>
                <td data-label="Rodado / talle">
                  <input className="adm-input" list="adm-sizes" value={v.size} placeholder="Único" maxLength={40} onChange={(e) => update(i, { size: e.target.value })} aria-label="Rodado o talle" />
                </td>
                <td data-label="Stock">
                  <div className="adm-stepper">
                    <button type="button" onClick={() => update(i, { stock: Math.max(0, v.stock - 1) })} aria-label="Restar uno">−</button>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={Number.isFinite(v.stock) ? v.stock : ""}
                      onChange={(e) => update(i, { stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                      aria-label="Stock"
                    />
                    <button type="button" onClick={() => update(i, { stock: v.stock + 1 })} aria-label="Sumar uno">+</button>
                  </div>
                </td>
                <td data-label="SKU">
                  <input
                    className="adm-input adm-mono"
                    value={v.sku}
                    placeholder={skuFor(slug, v.color, v.size)}
                    maxLength={160}
                    onChange={(e) => update(i, { sku: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                    aria-label="SKU (código interno)"
                  />
                </td>
                <td className="adm-row-actions">
                  <button type="button" className="adm-icon-btn" title="Duplicar" aria-label="Duplicar variante" onClick={() => onChange([...variants.slice(0, i + 1), { ...v, id: "", sku: "", size: "" }, ...variants.slice(i + 1)])}>⧉</button>
                  <button type="button" className="adm-icon-btn danger" title="Quitar" aria-label="Quitar variante" onClick={() => onChange(variants.filter((_, j) => j !== i))} disabled={variants.length === 1}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <datalist id="adm-colors">{Object.keys(palette).map((c) => <option key={c} value={c} />)}</datalist>
      <datalist id="adm-sizes">{sizeSuggestions.map((s) => <option key={s} value={s} />)}</datalist>
      <p className="adm-hint">
        El SKU es el código interno de cada variante: si lo dejás vacío se arma solo. Las variantes que ya se vendieron no se
        borran del todo (quedan en los pedidos), solo dejan de mostrarse.
      </p>
    </div>
  );
}

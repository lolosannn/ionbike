"use client";

import { bikeParts } from "@/lib/specs";
import type { SpecForm } from "@/lib/admin/product-form";

/** Especificaciones técnicas: pares nombre / dato, con atajos para las partes de la bici */
export function SpecsField({ specs, onChange, isBike }: { specs: SpecForm[]; onChange: (specs: SpecForm[]) => void; isBike: boolean }) {
  const update = (i: number, patch: Partial<SpecForm>) => onChange(specs.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= specs.length) return;
    const next = [...specs];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const used = new Set(specs.map((s) => s.label.trim().toLowerCase()));
  const shortcuts = isBike
    ? ["Rodado", "Velocidades", ...bikeParts.map((p) => p.label)].filter((l) => !used.has(l.toLowerCase()))
    : ["Material", "Medidas", "Peso", "Compatibilidad"].filter((l) => !used.has(l.toLowerCase()));

  return (
    <div className="adm-specs">
      {specs.length > 0 && (
        <ol className="adm-spec-list">
          {specs.map((s, i) => (
            <li key={i} className="adm-spec">
              <input className="adm-input adm-spec-label" value={s.label} placeholder="Ej. Frenos" maxLength={60} onChange={(e) => update(i, { label: e.target.value })} aria-label={`Nombre de la especificación ${i + 1}`} />
              <textarea
                className="adm-input"
                value={s.value}
                rows={Math.min(5, Math.max(1, s.value.split("\n").length))}
                placeholder="Ej. Hidráulicos de disco, 180 mm"
                maxLength={1000}
                onChange={(e) => update(i, { value: e.target.value })}
                aria-label={`Dato de ${s.label || `la especificación ${i + 1}`}`}
              />
              <div className="adm-spec-actions">
                <button type="button" className="adm-icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Subir">↑</button>
                <button type="button" className="adm-icon-btn" onClick={() => move(i, i + 1)} disabled={i === specs.length - 1} aria-label="Bajar">↓</button>
                <button type="button" className="adm-icon-btn danger" onClick={() => onChange(specs.filter((_, j) => j !== i))} aria-label="Quitar">✕</button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="adm-spec-add">
        <button type="button" className="adm-btn adm-btn-sm" onClick={() => onChange([...specs, { label: "", value: "" }])}>+ Agregar dato</button>
        {shortcuts.length > 0 && (
          <div className="adm-chips" aria-label="Agregar rápido">
            {shortcuts.map((label) => (
              <button key={label} type="button" className="adm-chip-btn" onClick={() => onChange([...specs, { label, value: "" }])}>+ {label}</button>
            ))}
          </div>
        )}
      </div>
      <p className="adm-hint">
        {isBike
          ? "En la ficha se agrupan solas por parte de la bici (cuadro, horquilla, frenos…). Para más de una línea, usá Enter. Los datos vacíos no se guardan."
          : "Se muestran en la ficha en este orden. Los datos vacíos no se guardan."}
      </p>
    </div>
  );
}

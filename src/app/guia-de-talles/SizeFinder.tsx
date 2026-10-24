"use client";

import { useState } from "react";
import { rowFor, sizeTables, type TableId } from "./sizes";

const fmt = (cm: number) => `${(cm / 100).toFixed(2).replace(".", ",")} m`;

export function SizeFinder() {
  const [tableId, setTableId] = useState<TableId>("mtb");
  const [height, setHeight] = useState("");

  const table = sizeTables.find((t) => t.id === tableId)!;
  const cm = Number(height.replace(",", "."));
  // Acepta "1,75" o "175"
  const heightCm = cm > 0 && cm < 3 ? Math.round(cm * 100) : Math.round(cm);
  const match = heightCm > 0 ? rowFor(table.rows, heightCm) : null;

  return (
    <div className="size-finder">
      <div className="pills" role="group" aria-label="Tipo de bicicleta" style={{ marginTop: 0 }}>
        {sizeTables.map((t) => (
          <button key={t.id} type="button" className="pill" aria-pressed={t.id === tableId} onClick={() => setTableId(t.id)}>
            {t.name}
          </button>
        ))}
      </div>

      <div className="size-input">
        <label htmlFor="altura">¿Cuánto medís?</label>
        <input
          id="altura"
          className="input"
          inputMode="decimal"
          placeholder="Ej: 1,75"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />
        <p className="size-result" aria-live="polite">
          {heightCm > 0 && (match
            ? <>Tu talle es <strong>{match.size}</strong> · {match.frame}</>
            : <>Para esa altura escribinos y te asesoramos.</>)}
        </p>
      </div>

      <table className="specs size-table">
        <caption className="sr-only">Talles de {table.name} según la altura</caption>
        <thead>
          <tr><th scope="col">Talle</th><th scope="col">{table.unit}</th><th scope="col">Altura</th></tr>
        </thead>
        <tbody>
          {table.rows.map((r) => (
            <tr key={r.size} className={match?.size === r.size ? "current" : undefined}>
              <th scope="row">{r.size}</th>
              <td>{r.frame}</td>
              <td>{fmt(r.from)} a {fmt(r.to)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

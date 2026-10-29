"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

// Gráficos del tablero, en SVG y sin librerías. Una sola serie por gráfico (en el amarillo de la
// marca), un solo eje, grillas finas y detalle al pasar el mouse o con las flechas del teclado.

const compact = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export const fmt = {
  int: (v: number) => whole.format(v),
  compact: (v: number) => compact.format(v),
  money: (cents: number) => pesos.format(Math.round(cents / 100)),
  moneyCompact: (cents: number) => `$ ${compact.format(Math.round(cents / 100))}`,
  pct: (v: number) => `${v.toLocaleString("es-AR", { maximumFractionDigits: v < 10 ? 1 : 0 })}%`,
};

/** "2026-10-29" → "29 oct" */
export function shortDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d))).replace(".", "");
}

export function longDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
  return t.charAt(0).toUpperCase() + t.slice(1).replace(",", "");
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Tope "lindo" del eje y sus marcas: 0, 25, 50, 75, 100 */
function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { top: ticks, step: 1 };
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw) ?? 10 * mag;
  return { top: step * ticks, step };
}

// ---- Mini tendencia de las tarjetas ----

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 4 - (v / max) * (h - 8)] as const);
  const last = pts[pts.length - 1];
  return (
    <svg className="adm-spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#6b6b68" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={3.5} fill="var(--accent)" stroke="var(--adm-card)" strokeWidth={2} />
    </svg>
  );
}

// ---- Tarjeta con un número ----

export function StatTile({
  label,
  value,
  current,
  previous,
  upIsGood = true,
  spark,
  hint,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
  upIsGood?: boolean;
  spark?: number[];
  hint?: string;
}) {
  let delta: { text: string; good: boolean | null } | null = null;
  if (previous > 0) {
    const change = ((current - previous) / previous) * 100;
    const rounded = Math.round(change);
    delta = rounded === 0
      ? { text: "igual que el período anterior", good: null }
      : { text: `${rounded > 0 ? "▲" : "▼"} ${Math.abs(rounded)}% vs. período anterior`, good: (rounded > 0) === upIsGood };
  } else if (current > 0) {
    delta = { text: "sin datos del período anterior", good: null };
  }
  return (
    <div className="adm-stat" title={hint}>
      <span className="adm-stat-label">{label}</span>
      <strong className="adm-stat-value">{value}</strong>
      {delta && <span className={`adm-stat-delta${delta.good === null ? "" : delta.good ? " up" : " down"}`}>{delta.text}</span>}
      {spark && <Sparkline values={spark} />}
    </div>
  );
}

// ---- Gráfico por día (área o columnas) ----

type Point = { date: string; value: number };

export function DayChart({
  points,
  kind,
  format,
  axisFormat,
  label,
}: {
  points: Point[];
  kind: "area" | "columns";
  format: (v: number) => string;
  axisFormat: (v: number) => string;
  label: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const height = 240;
  const pad = { top: 16, right: 12, bottom: 28, left: 52 };
  const innerW = Math.max(width - pad.left - pad.right, 10);
  const innerH = height - pad.top - pad.bottom;
  const { top, step } = niceScale(Math.max(...points.map((p) => p.value), 0));
  const n = points.length;
  const band = innerW / Math.max(n, 1);
  const x = (i: number) => (kind === "columns" ? band * i + band / 2 : n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
  const y = (v: number) => innerH - (v / top) * innerH;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  // Fechas del eje: pocas, para que no se pisen
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 70))));
  const xLabels: number[] = [];
  for (let i = 0; i < n; i += every) xLabels.push(i);
  if (n > 1 && xLabels[xLabels.length - 1] !== n - 1) {
    // El último día siempre se rotula; si queda muy cerca del anterior, ese se saca
    if (n - 1 - xLabels[xLabels.length - 1] < every * 0.6) xLabels.pop();
    xLabels.push(n - 1);
  }

  const pick = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = kind === "columns" ? Math.floor(px / band) : Math.round((px / innerW) * (n - 1));
    setActive(Math.min(Math.max(i, 0), n - 1));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowRight") setActive((a) => Math.min((a ?? -1) + 1, n - 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max((a ?? n) - 1, 0));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${innerH} L${x(0).toFixed(1)},${innerH} Z`;
  const barW = Math.min(24, Math.max(band - 2, 1));
  const a = active !== null ? points[active] : null;

  return (
    <div ref={ref} className="adm-chart">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${label}. Usá las flechas para recorrer los días.`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
        >
          <g transform={`translate(${pad.left},${pad.top})`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} stroke="#262626" strokeWidth={1} />
                <text x={-10} y={y(t)} dy="0.32em" textAnchor="end" className="adm-axis">{axisFormat(t)}</text>
              </g>
            ))}
            {xLabels.map((i) => (
              <text key={i} x={x(i)} y={innerH + 20} textAnchor={i === 0 && kind === "area" ? "start" : i === n - 1 && kind === "area" ? "end" : "middle"} className="adm-axis">
                {shortDate(points[i].date)}
              </text>
            ))}
            {kind === "area" ? (
              <>
                <path d={area} fill="var(--accent)" opacity={0.1} />
                <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              </>
            ) : (
              points.map((p, i) => {
                const h = innerH - y(p.value);
                if (h <= 0) return null;
                const r = Math.min(4, h, barW / 2);
                const x0 = x(i) - barW / 2;
                const y0 = y(p.value);
                // Punta redondeada arriba, recta sobre la base
                const d = `M${x0},${innerH} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${x0 + barW - r} Q${x0 + barW},${y0} ${x0 + barW},${y0 + r} V${innerH} Z`;
                return <path key={p.date} d={d} fill="var(--accent)" opacity={active === null || active === i ? 1 : 0.45} />;
              })
            )}
            {a && active !== null && (
              <>
                {kind === "area" && <line x1={x(active)} x2={x(active)} y1={0} y2={innerH} stroke="#8a8a86" strokeWidth={1} />}
                {kind === "area" && <circle cx={x(active)} cy={y(a.value)} r={5} fill="var(--accent)" stroke="var(--adm-card)" strokeWidth={2} />}
              </>
            )}
            <rect width={innerW} height={innerH} fill="transparent" onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setActive(null)} />
          </g>
        </svg>
      )}
      {a && active !== null && (
        <div
          className="adm-tooltip"
          style={{ left: Math.min(Math.max(pad.left + x(active), 70), width - 70), top: pad.top + Math.max(y(a.value) - 12, 0) }}
          role="status"
        >
          <strong>{format(a.value)}</strong>
          <span>{longDate(a.date)}</span>
        </div>
      )}
    </div>
  );
}

// ---- Barras horizontales con el valor en la punta ----

export function BarList({ items, format, note }: { items: { label: string; value: number; note?: string }[]; format: (v: number) => string; note?: (v: number, i: number) => string | null }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ol className="adm-barlist">
      {items.map((item, i) => (
        <li key={item.label}>
          <span className="adm-barlist-label">{item.label}</span>
          <span className="adm-barlist-track">
            <span className="adm-barlist-bar" style={{ width: `${Math.max((item.value / max) * 100, item.value ? 1.5 : 0)}%` }} />
            <span className="adm-barlist-value">
              {format(item.value)}
              {note?.(item.value, i) && <small> {note(item.value, i)}</small>}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

// ---- Partes de un total (dispositivos) ----

export function ShareBar({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const [hover, setHover] = useState<string | null>(null);
  if (!total) return <p className="adm-muted">Todavía no hay visitas en este período.</p>;
  return (
    <div className="adm-share">
      <div className="adm-share-bar" role="img" aria-label={items.map((i) => `${i.label}: ${Math.round((i.value / total) * 100)}%`).join(", ")}>
        {items.filter((i) => i.value).map((i) => (
          <span
            key={i.label}
            style={{ flexGrow: i.value, background: i.color, opacity: hover && hover !== i.label ? 0.45 : 1 }}
            onPointerEnter={() => setHover(i.label)}
            onPointerLeave={() => setHover(null)}
            title={`${i.label}: ${fmt.int(i.value)} (${Math.round((i.value / total) * 100)}%)`}
          />
        ))}
      </div>
      <ul className="adm-legend">
        {items.map((i) => (
          <li key={i.label} onPointerEnter={() => setHover(i.label)} onPointerLeave={() => setHover(null)}>
            <span className="adm-legend-key" style={{ background: i.color }} aria-hidden />
            <strong>{Math.round((i.value / total) * 100)}%</strong> {i.label}
            <small className="adm-muted"> · {fmt.int(i.value)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

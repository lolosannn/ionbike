"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { OrderStatus } from "@prisma/client";
import type { OrderRow } from "@/lib/admin/orders";
import { manualPayment, orderStatusLabels, paymentLabels, shippingLabels, timeAgo } from "@/lib/admin/labels";
import { formatPrice } from "@/lib/pricing";
import { SearchIcon } from "@/components/icons";

type Tab = "todos" | OrderStatus;
const tabs: Tab[] = ["todos", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function StatusChip({ status, label }: { status: string; label: string }) {
  return <span className={`adm-pill adm-pill-${status.toLowerCase()}`}>{label}</span>;
}

export function OrdersTable({ rows, now }: { rows: OrderRow[]; now: number }) {
  // Por defecto, lo que hay que mover: cobrados sin entregar
  const [tab, setTab] = useState<Tab>(rows.some((r) => r.status === "PAID") ? "PAID" : "todos");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const terms = normalize(query.replace(/^#/, "")).split(/\s+/).filter(Boolean);
    return rows.filter((r) => {
      if (tab !== "todos" && r.status !== tab) return false;
      const haystack = normalize(`${r.number} ${r.name} ${r.phone} ${r.summary} ${r.province ?? ""}`);
      return terms.every((t) => haystack.includes(t));
    });
  }, [rows, tab, query]);

  const toCollect = rows.filter((r) => r.status === "PENDING" && manualPayment.includes(r.paymentMethod)).length;
  const revenue30 = rows
    .filter((r) => ["PAID", "SHIPPED", "DELIVERED"].includes(r.status) && now - new Date(r.createdAt).getTime() < 30 * 864e5)
    .reduce((n, r) => n + r.total, 0);

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Pedidos</h1>
          <p className="adm-sub">
            {counts.PAID ?? 0} para preparar · {toCollect} esperando transferencia o efectivo · {formatPrice(revenue30)} cobrados en 30 días
          </p>
        </div>
      </header>

      <div className="adm-toolbar">
        <label className="adm-search">
          <SearchIcon size={18} />
          <span className="sr-only">Buscar</span>
          <input type="search" placeholder="Buscar por número, cliente, teléfono o producto" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="adm-tabs" role="group" aria-label="Estado">
          {tabs.map((t) => (
            <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t === "todos" ? "Todos" : orderStatusLabels[t]} <span>{counts[t] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="adm-empty">{rows.length === 0 ? "Todavía no hay pedidos." : "No hay pedidos con esos filtros."}</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th className="num">Total</th>
                <th>Pago y entrega</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="adm-row-link">
                  <td>
                    <Link href={`/admin/pedidos/${r.id}`} className="adm-order-cell">
                      <strong>#{r.number}</strong>
                      <small title={new Date(r.createdAt).toLocaleString("es-AR")}>{timeAgo(r.createdAt, now)}</small>
                    </Link>
                  </td>
                  <td data-label="Cliente">{r.name}</td>
                  <td data-label="Productos" className="adm-ellipsis" title={r.summary}>{r.summary}</td>
                  <td data-label="Total" className="num"><b>{formatPrice(r.total)}</b></td>
                  <td data-label="Pago y entrega">
                    <span className="adm-two-lines">
                      <span>{paymentLabels[r.paymentMethod]}</span>
                      <small className="adm-muted">{shippingLabels[r.shippingMethod]}{r.province ? ` · ${r.province}` : ""}</small>
                    </span>
                  </td>
                  <td data-label="Estado"><StatusChip status={r.status} label={orderStatusLabels[r.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

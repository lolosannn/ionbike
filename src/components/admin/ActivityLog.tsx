"use client";

import { useMemo, useState } from "react";
import type { ActivityRow } from "@/lib/admin/activity";
import { formatDateTime, timeAgo } from "@/lib/admin/labels";

const labels: Record<string, string> = {
  "ingreso": "Ingresó al panel",
  "ingreso.fallido": "Intento de ingreso fallido",
  "ingreso.bloqueado": "Cuenta bloqueada por intentos",
  "salida": "Salió del panel",
  "usuario.creado": "Usuario creado",
  "usuario.renovado": "Contraseña y 2FA renovados",
  "usuario.desactivado": "Usuario desactivado",
  "foto.subida": "Subió una foto",
  "producto.creado": "Creó un producto",
  "producto.editado": "Editó un producto",
  "producto.borrado": "Borró un producto",
  "producto.publicado": "Publicó un producto",
  "producto.ocultado": "Ocultó un producto",
  "pedido.paid": "Marcó un pedido como cobrado",
  "pedido.shipped": "Marcó un pedido como enviado",
  "pedido.delivered": "Marcó un pedido como entregado",
  "pedido.cancel": "Canceló un pedido",
  "pedido.notas": "Editó notas de un pedido",
  "turno.cargado": "Cargó un turno",
  "turno.confirmed": "Confirmó un turno",
  "turno.done": "Terminó un turno",
  "turno.cancelled": "Canceló un turno",
  "turno.pending": "Pasó un turno a por confirmar",
  "turno.notas": "Editó notas de un turno",
  "promo.creada": "Creó una promo",
  "promo.editada": "Editó una promo",
  "promo.borrada": "Borró una promo",
  "promo.activada": "Activó una promo",
  "promo.pausada": "Pausó una promo",
};
const label = (action: string) => labels[action] ?? (action.startsWith("consulta.") ? "Actualizó una consulta" : action);
const isAlert = (action: string) => action === "ingreso.fallido" || action === "ingreso.bloqueado";

type Filter = "todo" | "ingresos" | "alertas" | "cambios";

export function ActivityLog({ rows, now }: { rows: ActivityRow[]; now: number }) {
  const [filter, setFilter] = useState<Filter>("todo");
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        filter === "todo" ? true
        : filter === "alertas" ? isAlert(r.action)
        : filter === "ingresos" ? r.action.startsWith("ingreso") || r.action === "salida"
        : !r.action.startsWith("ingreso") && r.action !== "salida",
      ),
    [rows, filter],
  );
  const alerts24 = rows.filter((r) => isAlert(r.action) && now - new Date(r.createdAt).getTime() < 864e5).length;

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Actividad</h1>
          <p className="adm-sub">Todo lo que se hace en el panel, quién y cuándo. Se ven las últimas {rows.length} acciones.</p>
        </div>
      </header>
      {alerts24 >= 3 && (
        <p className="adm-banner error" role="alert">
          Hubo {alerts24} intentos de ingreso fallidos en las últimas 24 horas. Si no fueron ustedes, revisen las IP de abajo.
        </p>
      )}
      <div className="adm-toolbar">
        <div className="adm-tabs" role="group" aria-label="Filtro">
          {(["todo", "cambios", "ingresos", "alertas"] as Filter[]).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {{ todo: "Todo", cambios: "Cambios", ingresos: "Ingresos", alertas: "Alertas" }[f]}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="adm-empty">No hay acciones registradas con ese filtro.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Cuándo</th><th>Quién</th><th>Qué</th><th>Sobre qué</th><th>IP</th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className={isAlert(r.action) ? "adm-row-alert" : undefined}>
                  <td title={formatDateTime(r.createdAt)} className="adm-nowrap">{timeAgo(r.createdAt, now)}</td>
                  <td data-label="Quién">{r.user ?? <span className="adm-muted">—</span>}</td>
                  <td data-label="Qué">{label(r.action)}{r.detail && <small className="adm-muted adm-detail" title={r.detail}>{r.detail}</small>}</td>
                  <td data-label="Sobre qué" className="adm-ellipsis" title={r.target ?? ""}>{r.target}</td>
                  <td data-label="IP" className="adm-mono adm-nowrap">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

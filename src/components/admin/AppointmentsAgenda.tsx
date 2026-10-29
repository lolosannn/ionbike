"use client";

import { useMemo, useState, useTransition } from "react";
import type { AppointmentStatus } from "@prisma/client";
import type { AppointmentRow } from "@/lib/admin/types";
import { appointmentStatusLabels, waTo } from "@/lib/admin/labels";
import { workshopServices } from "@/config/workshop";
import { addDays, formatDay, slotsFor, weekday } from "@/lib/workshop";
import { WhatsappIcon } from "@/components/icons";

type Result = { ok: boolean; error?: string };
type NewAppointment = { date: string; time: string; services: string[]; name: string; phone: string; bike: string; notes: string };

type Props = {
  rows: AppointmentRow[];
  today: string;
  update?: (id: string, data: { status?: AppointmentStatus; adminNotes?: string }) => Promise<Result>;
  create?: (data: NewAppointment) => Promise<Result & { id?: string; overbooked?: boolean }>;
};

const serviceName = (id: string) => workshopServices.find((s) => s.id === id)?.name ?? id;
const mondayOf = (key: string) => addDays(key, -((weekday(key) + 6) % 7));
const shortDay = (key: string) => formatDay(key).replace(/ de [a-z]+$/i, "");

function AppointmentItem({ row, today, update, onChange }: { row: AppointmentRow; today: string; update: Props["update"]; onChange: (r: AppointmentRow) => void }) {
  const [pending, start] = useTransition();
  const [notesOpen, setNotesOpen] = useState(Boolean(row.adminNotes));
  const [notes, setNotes] = useState(row.adminNotes ?? "");
  const [error, setError] = useState("");
  const firstName = row.name.split(" ")[0];
  const when = `${row.date === today ? "hoy" : formatDay(row.date).toLowerCase()} a las ${row.time}`;

  const save = (data: { status?: AppointmentStatus; adminNotes?: string }) => {
    setError("");
    const previous = row;
    onChange({ ...row, ...data });
    if (!update) return;
    start(async () => {
      const res = await update(row.id, data);
      if (!res.ok) {
        onChange(previous);
        setError(res.error ?? "No se pudo guardar.");
      }
    });
  };

  return (
    <li className={`adm-appt adm-appt-${row.status.toLowerCase()}`}>
      <span className="adm-appt-time">{row.time}</span>
      <div className="adm-appt-body">
        <div className="adm-appt-head">
          <strong>{row.name}</strong>
          <span className={`adm-pill adm-pill-${row.status.toLowerCase()}`}>{appointmentStatusLabels[row.status]}</span>
        </div>
        <p className="adm-appt-services">{row.services.map(serviceName).join(" + ")}{row.bike && <span className="adm-muted"> · {row.bike}</span>}</p>
        {row.notes && <p className="adm-quote">{row.notes}</p>}
        <div className="adm-inline-actions">
          {row.status === "PENDING" && (
            <button type="button" className="adm-btn adm-btn-sm adm-btn-primary" disabled={pending} onClick={() => save({ status: "CONFIRMED" })}>Confirmar</button>
          )}
          {(row.status === "PENDING" || row.status === "CONFIRMED") && row.date <= today && (
            <button type="button" className="adm-btn adm-btn-sm" disabled={pending} onClick={() => save({ status: "DONE" })}>Terminado</button>
          )}
          <a
            className="adm-btn adm-btn-sm adm-btn-wa"
            href={waTo(row.phone, row.status === "DONE"
              ? `Hola ${firstName}! Tu bici ya está lista para retirar en IonBikeStore. ¡Te esperamos!`
              : `Hola ${firstName}! Te confirmamos el turno del taller de IonBikeStore para ${when} (${row.services.map(serviceName).join(" + ")}). ¡Te esperamos!`)}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsappIcon size={15} /> {row.status === "DONE" ? "Avisar que está lista" : "Escribirle"}
          </a>
          <button type="button" className="adm-btn adm-btn-sm adm-btn-ghost" onClick={() => setNotesOpen((o) => !o)}>Notas</button>
          {(row.status === "PENDING" || row.status === "CONFIRMED") && (
            <button type="button" className="adm-btn adm-btn-sm adm-btn-danger-ghost" disabled={pending} onClick={() => { if (confirm(`¿Cancelar el turno de ${row.name}? El horario queda libre.`)) save({ status: "CANCELLED" }); }}>Cancelar</button>
          )}
          {row.status === "CANCELLED" && row.date >= today && (
            <button type="button" className="adm-btn adm-btn-sm adm-btn-ghost" disabled={pending} onClick={() => save({ status: "CONFIRMED" })}>Reactivar</button>
          )}
        </div>
        {notesOpen && (
          <div className="adm-inquiry-notes">
            <textarea className="adm-input" rows={2} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder="Solo para el taller: qué se hizo, repuestos, presupuesto…" aria-label="Notas del taller" />
            {notes !== (row.adminNotes ?? "") && <button type="button" className="adm-btn adm-btn-sm" disabled={pending} onClick={() => save({ adminNotes: notes })}>Guardar nota</button>}
          </div>
        )}
        {error && <p className="adm-error-text" role="alert">{error}</p>}
        <a className="adm-small-link" href={`tel:${row.phone}`}>{row.phone}</a>
      </div>
    </li>
  );
}

function NewAppointmentForm({ today, create, onCreated, onCancel }: { today: string; create: Props["create"]; onCreated: (row: AppointmentRow, warning?: string) => void; onCancel: () => void }) {
  const [form, setForm] = useState<NewAppointment>({ date: today, time: "", services: [], name: "", phone: "", bike: "", notes: "" });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const slots = slotsFor(form.date);
  const set = <K extends keyof NewAppointment>(k: K, v: NewAppointment[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    setError("");
    if (!form.time || !form.services.length || !form.name.trim() || form.phone.replace(/\D/g, "").length < 8) {
      return setError("Completá día, horario, al menos un servicio, nombre y teléfono.");
    }
    const row: AppointmentRow = { id: `nuevo-${Date.now()}`, ...form, email: null, bike: form.bike || null, notes: form.notes || null, status: "CONFIRMED", adminNotes: null, createdAt: new Date().toISOString() };
    if (!create) return onCreated(row, "Vista previa: el turno no se guarda.");
    start(async () => {
      const res = await create(form);
      if (!res.ok) return setError(res.error ?? "No se pudo cargar el turno.");
      onCreated({ ...row, id: res.id ?? row.id }, res.overbooked ? "Ojo: en ese horario ya estaba el cupo completo." : undefined);
    });
  };

  return (
    <section className="adm-card adm-new-appt" aria-labelledby="t-nuevo-turno">
      <h2 id="t-nuevo-turno">Cargar un turno</h2>
      <p className="adm-hint" style={{ marginTop: -8 }}>Para los que piden turno por teléfono o en el local. Queda confirmado.</p>
      <div className="adm-bulk-grid">
        <label className="adm-field">
          <span>Día</span>
          <input type="date" className="adm-input" min={today} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value, time: "" }))} />
        </label>
        <label className="adm-field">
          <span>Horario</span>
          <select className="adm-input" value={form.time} onChange={(e) => set("time", e.target.value)} disabled={!slots.length}>
            <option value="">{slots.length ? "Elegí" : "Cerrado ese día"}</option>
            {slots.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="adm-field">
          <span>Teléfono</span>
          <input className="adm-input" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="11 5555 4444" />
        </label>
      </div>
      <div className="adm-bulk-grid">
        <label className="adm-field">
          <span>Nombre</span>
          <input className="adm-input" value={form.name} maxLength={200} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Bici <em className="adm-optional">opcional</em></span>
          <input className="adm-input" value={form.bike} maxLength={200} onChange={(e) => set("bike", e.target.value)} placeholder="Marca y modelo" />
        </label>
        <label className="adm-field">
          <span>Nota <em className="adm-optional">opcional</em></span>
          <input className="adm-input" value={form.notes} maxLength={1000} onChange={(e) => set("notes", e.target.value)} />
        </label>
      </div>
      <fieldset className="adm-checks">
        <legend>Servicios</legend>
        {workshopServices.map((s) => (
          <label key={s.id}>
            <input type="checkbox" checked={form.services.includes(s.id)} onChange={(e) => set("services", e.target.checked ? [...form.services, s.id] : form.services.filter((x) => x !== s.id))} />
            {s.name}
          </label>
        ))}
      </fieldset>
      {error && <p className="adm-alert" role="alert">{error}</p>}
      <div className="adm-inline-actions">
        <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" disabled={pending} onClick={submit}>{pending ? "Guardando…" : "Cargar turno"}</button>
        <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </section>
  );
}

export function AppointmentsAgenda({ rows: initial, today, update, create }: Props) {
  const [rows, setRows] = useState(initial);
  const [view, setView] = useState<"semana" | "por-confirmar">("semana");
  const [week, setWeek] = useState(mondayOf(today));
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    for (const r of rows) map.set(r.date, [...(map.get(r.date) ?? []), r]);
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [rows]);
  const toConfirm = rows.filter((r) => r.status === "PENDING" && r.date >= today);
  const todayActive = (byDay.get(today) ?? []).filter((r) => r.status !== "CANCELLED").length;
  const weekActive = days.reduce((n, d) => n + (byDay.get(d) ?? []).filter((r) => r.status !== "CANCELLED").length, 0);
  const onChange = (next: AppointmentRow) => setRows((list) => list.map((x) => (x.id === next.id ? next : x)));

  const list = (items: AppointmentRow[]) => (
    <ul className="adm-appt-list">
      {items.map((r) => <AppointmentItem key={r.id} row={r} today={today} update={update} onChange={onChange} />)}
    </ul>
  );

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Turnos del taller</h1>
          <p className="adm-sub">Hoy: <b>{todayActive}</b> {todayActive === 1 ? "turno" : "turnos"} · {toConfirm.length} por confirmar</p>
        </div>
        <button type="button" className="adm-btn adm-btn-primary" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>+ Cargar turno</button>
      </header>

      {notice && <p className="adm-banner info" role="status">{notice}</p>}
      {adding && (
        <NewAppointmentForm
          today={today}
          create={create}
          onCancel={() => setAdding(false)}
          onCreated={(row, warning) => {
            setRows((list) => [...list, row]);
            setAdding(false);
            setWeek(mondayOf(row.date));
            setView("semana");
            setNotice(warning ?? `Turno cargado para el ${formatDay(row.date).toLowerCase()} a las ${row.time}.`);
          }}
        />
      )}

      <div className="adm-toolbar">
        <div className="adm-tabs" role="group" aria-label="Vista">
          <button type="button" aria-pressed={view === "semana"} onClick={() => setView("semana")}>Semana</button>
          <button type="button" aria-pressed={view === "por-confirmar"} onClick={() => setView("por-confirmar")}>Por confirmar <span>{toConfirm.length}</span></button>
        </div>
        {view === "semana" && (
          <div className="adm-week-nav">
            <button type="button" className="adm-icon-btn" onClick={() => setWeek(addDays(week, -7))} aria-label="Semana anterior">←</button>
            <span>{shortDay(days[0])} al {formatDay(days[6]).toLowerCase()} · {weekActive} {weekActive === 1 ? "turno" : "turnos"}</span>
            <button type="button" className="adm-icon-btn" onClick={() => setWeek(addDays(week, 7))} aria-label="Semana siguiente">→</button>
            {week !== mondayOf(today) && <button type="button" className="adm-btn adm-btn-sm adm-btn-ghost" onClick={() => setWeek(mondayOf(today))}>Hoy</button>}
          </div>
        )}
      </div>

      {view === "por-confirmar" ? (
        toConfirm.length ? (
          <div className="adm-days">
            {[...new Set(toConfirm.map((r) => r.date))].map((d) => (
              <section key={d} className="adm-day">
                <h2>{d === today ? "Hoy" : formatDay(d)}</h2>
                {list(toConfirm.filter((r) => r.date === d))}
              </section>
            ))}
          </div>
        ) : <div className="adm-empty">No hay turnos por confirmar.</div>
      ) : (
        <div className="adm-days">
          {days.map((d) => {
            const items = byDay.get(d) ?? [];
            const closed = slotsFor(d).length === 0;
            if (closed && !items.length) return null;
            return (
              <section key={d} className={`adm-day${d === today ? " is-today" : ""}${d < today ? " is-past" : ""}`}>
                <h2>{d === today ? `Hoy · ${formatDay(d)}` : formatDay(d)} <small>{items.filter((r) => r.status !== "CANCELLED").length || "Sin"} {items.length === 1 ? "turno" : "turnos"}</small></h2>
                {items.length ? list(items) : <p className="adm-muted adm-day-empty">Agenda libre.</p>}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

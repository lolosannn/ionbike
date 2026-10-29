"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { InquiryStatus } from "@prisma/client";
import type { InquiryRow } from "@/lib/admin/types";
import { formatDateTime, inquiryStatusLabels, timeAgo, waTo } from "@/lib/admin/labels";
import { WhatsappIcon } from "@/components/icons";

type Tab = "abiertas" | InquiryStatus;
const statuses: InquiryStatus[] = ["NEW", "CONTACTED", "RESERVED", "WON", "LOST"];
const open: InquiryStatus[] = ["NEW", "CONTACTED", "RESERVED"];

type Props = {
  rows: InquiryRow[];
  now: number;
  update?: (id: string, data: { status?: InquiryStatus; adminNotes?: string }) => Promise<{ ok: boolean; error?: string }>;
};

function InquiryCard({ row, now, onChange, update }: { row: InquiryRow; now: number; onChange: (r: InquiryRow) => void; update: Props["update"] }) {
  const [notes, setNotes] = useState(row.adminNotes ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const firstName = row.name.split(" ")[0];

  const save = (data: { status?: InquiryStatus; adminNotes?: string }) => {
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
    <article className={`adm-card adm-inquiry ${row.status === "NEW" ? "is-new" : ""}`}>
      <header>
        <div>
          <strong className="adm-inquiry-name">{row.name}</strong>
          <span className="adm-muted" title={formatDateTime(row.createdAt)}> · {timeAgo(row.createdAt, now)}</span>
        </div>
        <select
          className={`adm-input adm-status-select adm-pill-${row.status.toLowerCase()}`}
          value={row.status}
          disabled={pending}
          onChange={(e) => save({ status: e.target.value as InquiryStatus })}
          aria-label={`Estado de la consulta de ${row.name}`}
        >
          {statuses.map((s) => <option key={s} value={s}>{inquiryStatusLabels[s]}</option>)}
        </select>
      </header>
      <p className="adm-inquiry-product">
        {row.productId ? <Link href={`/admin/productos/${row.productId}`}>{row.productName}</Link> : row.productName}
        {row.preference && <span className="adm-chip">{row.preference}</span>}
      </p>
      {row.message && <p className="adm-quote">{row.message}</p>}
      <div className="adm-inquiry-contact">
        <a className="adm-btn adm-btn-sm adm-btn-wa" href={waTo(row.phone, `Hola ${firstName}! Te escribimos de IonBikeStore por tu consulta de la ${row.productName}${row.preference ? ` (${row.preference})` : ""}.`)} target="_blank" rel="noreferrer">
          <WhatsappIcon size={16} /> {row.phone}
        </a>
        {row.email && <a className="adm-btn adm-btn-sm adm-btn-ghost" href={`mailto:${row.email}?subject=${encodeURIComponent(`Tu consulta por la ${row.productName}`)}`}>{row.email}</a>}
      </div>
      <div className="adm-inquiry-notes">
        <textarea className="adm-input" rows={2} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder="Notas: qué le ofreciste, cuánto señó, cuándo llega…" aria-label="Notas internas" />
        {notes !== (row.adminNotes ?? "") && (
          <button type="button" className="adm-btn adm-btn-sm" disabled={pending} onClick={() => save({ adminNotes: notes })}>Guardar nota</button>
        )}
      </div>
      {error && <p className="adm-error-text" role="alert">{error}</p>}
    </article>
  );
}

export function InquiriesBoard({ rows: initial, now, update }: Props) {
  const [rows, setRows] = useState(initial);
  const [tab, setTab] = useState<Tab>("abiertas");

  const counts = useMemo(() => {
    const c: Record<string, number> = { abiertas: 0 };
    for (const r of rows) {
      c[r.status] = (c[r.status] ?? 0) + 1;
      if (open.includes(r.status)) c.abiertas++;
    }
    return c;
  }, [rows]);
  const closed = (counts.WON ?? 0) + (counts.LOST ?? 0);
  const filtered = rows.filter((r) => (tab === "abiertas" ? open.includes(r.status) : r.status === tab));

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Consultas a pedido</h1>
          <p className="adm-sub">
            Clientes que pidieron precio y plazo de una bici a pedido desde la tienda.
            {closed > 0 && <> Se cerró el <b>{Math.round(((counts.WON ?? 0) / closed) * 100)}%</b> de las consultas terminadas.</>}
          </p>
        </div>
      </header>

      <div className="adm-toolbar">
        <div className="adm-tabs" role="group" aria-label="Estado">
          {(["abiertas", ...statuses] as Tab[]).map((t) => (
            <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t === "abiertas" ? "Abiertas" : inquiryStatusLabels[t]} <span>{counts[t] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="adm-empty">
          {rows.length === 0
            ? "Todavía no llegaron consultas. Aparecen acá cuando alguien completa el formulario de una bici marcada «A pedido»."
            : "No hay consultas en este estado."}
        </div>
      ) : (
        <div className="adm-inquiry-list">
          {filtered.map((r) => (
            <InquiryCard key={r.id} row={r} now={now} update={update} onChange={(next) => setRows((list) => list.map((x) => (x.id === next.id ? next : x)))} />
          ))}
        </div>
      )}
    </div>
  );
}

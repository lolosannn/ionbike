"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { placementInfo, promoStatus, promoStatusLabels, type PromoForm } from "@/lib/admin/promo-form";

type Props = {
  promos: PromoForm[];
  today: string;
  setActive?: (id: string, active: boolean) => Promise<{ ok: boolean }>;
};

const formatDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
};

export function dateRange(p: Pick<PromoForm, "startsOn" | "endsOn">) {
  if (p.startsOn && p.endsOn) return `Del ${formatDate(p.startsOn)} al ${formatDate(p.endsOn)}`;
  if (p.startsOn) return `Desde el ${formatDate(p.startsOn)}`;
  if (p.endsOn) return `Hasta el ${formatDate(p.endsOn)}`;
  return "Sin fecha de fin";
}

export function PromosList({ promos: initial, today, setActive }: Props) {
  const [promos, setPromos] = useState(initial);
  const [pending, start] = useTransition();
  const live = promos.filter((p) => promoStatus(p, today) === "activa").length;

  const toggle = (p: PromoForm) => {
    const active = !p.active;
    setPromos((list) => list.map((x) => (x.id === p.id ? { ...x, active } : x)));
    if (!setActive) return;
    start(async () => {
      const res = await setActive(p.id, active);
      if (!res.ok) setPromos((list) => list.map((x) => (x.id === p.id ? { ...x, active: p.active } : x)));
    });
  };

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Promociones</h1>
          <p className="adm-sub">{live} {live === 1 ? "activa" : "activas"} ahora en la tienda. Aparecen y se apagan solas según sus fechas.</p>
        </div>
        <Link href="/admin/promociones/nueva" className="adm-btn adm-btn-primary">+ Nueva promo</Link>
      </header>

      {promos.length === 0 ? (
        <div className="adm-empty">No hay promociones. <Link href="/admin/promociones/nueva">Creá la primera</Link>.</div>
      ) : (
        <div className="adm-promo-list">
          {promos.map((p) => {
            const status = promoStatus(p, today);
            return (
              <article key={p.id} className={`adm-card adm-promo-row is-${status}`}>
                <div className="adm-promo-thumb" aria-hidden>
                  {p.image ? <img src={p.image} alt="" /> : <span>{p.tag || "Promo"}</span>}
                </div>
                <div className="adm-promo-info">
                  <div className="adm-appt-head">
                    <Link href={`/admin/promociones/${p.id}`} className="adm-promo-title">{p.title}</Link>
                    <span className={`adm-pill adm-pill-promo-${status}`}>{promoStatusLabels[status]}</span>
                  </div>
                  <p className="adm-muted">{dateRange(p)}{p.categories.length + p.products.length > 0 && ` · aplica a ${[...p.categories, ...(p.products.length ? [`${p.products.length} producto${p.products.length === 1 ? "" : "s"}`] : [])].join(", ")}`}</p>
                  <div className="adm-chips">
                    {placementInfo.filter((i) => p.placements.includes(i.id)).map((i) => <span key={i.id} className="adm-chip">{i.label}</span>)}
                  </div>
                </div>
                <div className="adm-promo-actions">
                  <label className="adm-switch" title={p.active ? "Pausar" : "Activar"}>
                    <input type="checkbox" role="switch" checked={p.active} disabled={pending} onChange={() => toggle(p)} aria-label={`Promo ${p.title} activa`} />
                    <span aria-hidden />
                  </label>
                  <Link href={`/admin/promociones/${p.id}`} className="adm-btn adm-btn-sm">Editar</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { workshopSchedule, workshopServices, type WorkshopService } from "@/config/workshop";
import { whatsappUrl } from "@/config/store";
import { discountPct, formatPrice } from "@/lib/pricing";
import { bookableDays, formatDay, servicesById, slotKey, slotsFor, todayKey, weekday } from "@/lib/workshop";
import { CalendarIcon, ClockIcon, DropIcon, GearIcon, SparkleIcon, WhatsappIcon, WrenchIcon } from "@/components/icons";
import { SpecIcon } from "@/components/product/SpecIcons";

export type BookingState = {
  error?: string;
  // Horario que se llenó mientras el cliente completaba el formulario
  full?: { date: string; time: string };
  booked?: { date: string; time: string; services: string[]; name: string; bike?: string };
} | null;

type Props = {
  // Turnos ya tomados por horario ("AAAA-MM-DD HH:MM" → cantidad)
  taken: Record<string, number>;
  // Sin acción: vista previa estática, la reserva se simula
  action?: (prev: BookingState, form: FormData) => Promise<BookingState>;
};

const serviceIcons: Record<WorkshopService["icon"], React.ReactNode> = {
  service: <WrenchIcon size={28} />,
  full: <GearIcon size={28} />,
  tubeless: <SpecIcon part="cubiertas" size={28} />,
  liquido: <DropIcon size={28} />,
  centrado: <SpecIcon part="ruedas" size={28} />,
  lavado: <SparkleIcon size={28} />,
  frenos: <SpecIcon part="frenos" size={28} />,
};

const weekdayShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const priceText = (s: WorkshopService) =>
  s.price === null ? "A confirmar" : `${formatPrice(s.price)}${s.priceUnit ? ` ${s.priceUnit}` : ""}`;

function ServicePrice({ s }: { s: WorkshopService }) {
  const off = s.price !== null ? discountPct(s.price, s.compareAt) : null;
  return (
    <span className="service-price">
      {off && s.compareAt && <s>{formatPrice(s.compareAt)}</s>}
      {priceText(s)}
      {off && <em>{off}% OFF</em>}
    </span>
  );
}

function bookedMessage(b: NonNullable<BookingState>["booked"] & object) {
  const names = servicesById(b.services).map((s) => s.name).join(", ");
  return `Hola! Reservé un turno en el taller para el ${formatDay(b.date)} a las ${b.time} hs. Servicios: ${names}.` +
    ` Nombre: ${b.name}.${b.bike ? ` Bici: ${b.bike}.` : ""}`;
}

export function WorkshopBooking({ taken, action }: Props) {
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    action ?? (async (_prev, form) => ({
      booked: {
        date: String(form.get("date")), time: String(form.get("time")),
        services: form.getAll("services").map(String), name: String(form.get("name")),
        bike: String(form.get("bike") || "") || undefined,
      },
    })),
    null,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  // Los días se calculan en el navegador (la vista previa se genera antes, en otra fecha)
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayKey()), []);

  const days = useMemo(() => (today ? bookableDays(today) : []), [today]);
  const takenNow = useMemo(() => {
    const t = { ...taken };
    if (state?.full) t[slotKey(state.full.date, state.full.time)] = workshopSchedule.perSlot;
    return t;
  }, [taken, state]);
  const free = (d: string, t: string) => (takenNow[slotKey(d, t)] ?? 0) < workshopSchedule.perSlot;
  const dayHasSlots = (d: string) => slotsFor(d).some((t) => free(d, t));

  // Si el horario elegido se llenó, se deselecciona
  useEffect(() => {
    if (state?.full && date === state.full.date && time === state.full.time) setTime(null);
  }, [state, date, time]);

  const chosen = servicesById(selected);
  const minutes = chosen.reduce((sum, s) => sum + s.minutes, 0);
  const allPriced = chosen.length > 0 && chosen.every((s) => s.price !== null);
  const total = chosen.reduce((sum, s) => sum + (s.price ?? 0), 0);

  if (state?.booked) {
    const b = state.booked;
    return (
      <div className="booking-done">
        <span className="booking-done-icon"><CalendarIcon size={36} /></span>
        <h2 className="display">¡Turno reservado!</h2>
        <p className="booking-done-when">{formatDay(b.date)} · {b.time} hs</p>
        <p>{servicesById(b.services).map((s) => s.name).join(" · ")}</p>
        <p className="muted">
          Traé la bici al local en ese horario. Para que lo tengamos agendado, avisanos por WhatsApp con un toque.
        </p>
        <a className="btn btn-whatsapp" href={whatsappUrl(bookedMessage(b))} target="_blank" rel="noreferrer">
          <WhatsappIcon size={20} /> Avisar al taller por WhatsApp
        </a>
        {!action && <p className="muted" style={{ fontSize: 13 }}>Vista previa: el turno no se guardó.</p>}
      </div>
    );
  }

  return (
    <form action={formAction} className="booking">
      <input type="text" name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="booking-main">
        <fieldset className="booking-step">
          <legend><span>1</span> Elegí los servicios</legend>
          <div className="service-grid">
            {workshopServices.map((s) => (
              <label key={s.id} className="service-card">
                <input
                  type="checkbox"
                  name="services"
                  value={s.id}
                  checked={selected.includes(s.id)}
                  onChange={(e) => setSelected((list) => (e.target.checked ? [...list, s.id] : list.filter((id) => id !== s.id)))}
                />
                <span className="service-icon">{serviceIcons[s.icon]}</span>
                <span className="service-body">
                  <strong>{s.name}</strong>
                  <span>{s.description}</span>
                  <span className="service-meta">
                    <ServicePrice s={s} />
                    <span><ClockIcon size={14} /> ~{s.minutes} min</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="booking-step">
          <legend><span>2</span> Elegí el día</legend>
          {!today ? (
            <p className="muted">Cargando la agenda…</p>
          ) : (
            <div className="day-row">
              {days.map((d) => {
                const open = slotsFor(d).length > 0;
                const available = open && dayHasSlots(d);
                return (
                  <label key={d} className="day-chip" aria-disabled={!available}>
                    <input
                      type="radio"
                      name="date"
                      value={d}
                      checked={date === d}
                      disabled={!available}
                      onChange={() => { setDate(d); setTime(null); }}
                    />
                    <span>
                      <small>{weekdayShort[weekday(d)]}</small>
                      <strong>{Number(d.slice(8))}</strong>
                      <small>{open ? (available ? "" : "Completo") : "Cerrado"}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <fieldset className="booking-step" disabled={!date}>
          <legend><span>3</span> Elegí el horario</legend>
          {!date ? (
            <p className="muted">Primero elegí un día.</p>
          ) : (
            <>
              <p className="muted" style={{ margin: "0 0 12px" }}>{formatDay(date)} · horario para dejar la bici en el local</p>
              <div className="chip-row">
                {slotsFor(date).map((t) => (
                  <label key={t} className="size-chip time-chip" style={free(date, t) ? undefined : { opacity: 0.4 }}>
                    <input type="radio" name="time" value={t} checked={time === t} disabled={!free(date, t)} onChange={() => setTime(t)} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </fieldset>

        <fieldset className="booking-step">
          <legend><span>4</span> Tus datos</legend>
          <div className="field-row">
            <label className="field">Nombre y apellido<input className="input" name="name" required autoComplete="name" /></label>
            <label className="field">Teléfono / WhatsApp<input className="input" name="phone" required inputMode="tel" autoComplete="tel" /></label>
          </div>
          <div className="field-row">
            <label className="field">Email (opcional)<input className="input" name="email" type="email" autoComplete="email" /></label>
            <label className="field">Tu bici (opcional)<input className="input" name="bike" placeholder="Marca, modelo, rodado" /></label>
          </div>
          <label className="field">Comentarios (opcional)<textarea className="input" name="notes" placeholder="Contanos qué le pasa a la bici" /></label>
        </fieldset>
      </div>

      <aside className="summary booking-summary">
        <h2>Tu turno</h2>
        {chosen.length === 0 ? (
          <p className="muted">Elegí uno o más servicios.</p>
        ) : (
          chosen.map((s) => (
            <div key={s.id} className="summary-row"><span>{s.name}</span><ServicePrice s={s} /></div>
          ))
        )}
        <div className="summary-row"><span>Día</span><span>{date ? formatDay(date) : "—"}</span></div>
        <div className="summary-row"><span>Horario</span><span>{time ? `${time} hs` : "—"}</span></div>
        {minutes > 0 && <div className="summary-row"><span>Duración aprox.</span><span>{minutes} min</span></div>}
        <div className="summary-row total">
          <span>Total</span>
          <span>{allPriced ? `${chosen.some((s) => s.priceUnit) ? "Desde " : ""}${formatPrice(total)}` : chosen.length ? "A confirmar" : "—"}</span>
        </div>
        {state?.error && <p className="alert" role="alert">{state.error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={pending || !chosen.length || !date || !time}>
          {pending ? "Reservando…" : "Confirmar turno"}
        </button>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>El pago se hace en el local, cuando retirás la bici.</p>
      </aside>
    </form>
  );
}

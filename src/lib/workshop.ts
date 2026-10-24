import { workshopSchedule as schedule, workshopServices } from "@/config/workshop";

// Fechas como texto "AAAA-MM-DD" y horarios como "HH:MM", siempre en hora argentina.

/** Hoy en Argentina, como "AAAA-MM-DD". */
export function todayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: schedule.timeZone }).format(now);
}

export function addDays(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekday(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Horarios de turno de un día (vacío si está cerrado). */
export function slotsFor(key: string) {
  if (schedule.closedDates.includes(key)) return [];
  const ranges = schedule.hours[weekday(key)] ?? [];
  return ranges.flatMap(([from, to]) => {
    const out: string[] = [];
    for (let m = toMinutes(from); m < toMinutes(to); m += schedule.slotMinutes) out.push(toTime(m));
    return out;
  });
}

/** Días que se pueden reservar: de mañana a `daysAhead` días. */
export function bookableDays(today = todayKey()) {
  return Array.from({ length: schedule.daysAhead }, (_, i) => addDays(today, i + 1));
}

export function isBookable(date: string, time: string, today = todayKey()) {
  return bookableDays(today).includes(date) && slotsFor(date).includes(time);
}

export function servicesById(ids: string[]) {
  return workshopServices.filter((s) => ids.includes(s.id));
}

/** "Martes 28 de octubre" */
export function formatDay(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const text = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(y, m - 1, d)));
  return text.charAt(0).toUpperCase() + text.slice(1).replace(",", "");
}

export const slotKey = (date: string, time: string) => `${date} ${time}`;

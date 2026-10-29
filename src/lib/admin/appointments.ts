import "server-only";
import type { AppointmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { workshopServices } from "@/config/workshop";
import { addDays, slotsFor, todayKey } from "@/lib/workshop";
import { workshopSchedule } from "@/config/workshop";
import type { AppointmentRow } from "@/lib/admin/types";

/** Turnos de los últimos 60 días y los próximos 90 */
export async function listAppointments(): Promise<AppointmentRow[]> {
  const today = todayKey();
  const rows = await db.appointment.findMany({
    where: { date: { gte: addDays(today, -60), lte: addDays(today, 90) } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return rows.map((a) => ({
    id: a.id,
    date: a.date,
    time: a.time,
    services: a.services,
    name: a.name,
    phone: a.phone,
    email: a.email,
    bike: a.bike,
    notes: a.notes,
    status: a.status,
    adminNotes: a.adminNotes,
    createdAt: a.createdAt.toISOString(),
  }));
}

export const appointmentStatuses: AppointmentStatus[] = ["PENDING", "CONFIRMED", "DONE", "CANCELLED"];

export async function updateAppointment(id: string, data: { status?: AppointmentStatus; adminNotes?: string }) {
  const res = await db.appointment.updateMany({
    where: { id },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes.trim().slice(0, 2000) || null } : {}),
    },
  });
  return res.count > 0;
}

export type ManualAppointment = { date: string; time: string; services: string[]; name: string; phone: string; bike: string; notes: string };

/**
 * Turno cargado por el local (llamó por teléfono, vino al mostrador). Puede ser hoy y pasarse del
 * cupo si el taller lo decide, pero tiene que ser un horario de atención.
 */
export async function createManualAppointment(input: ManualAppointment) {
  const services = input.services.filter((id) => workshopServices.some((s) => s.id === id));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.date < todayKey()) return { ok: false as const, error: "Elegí un día de hoy en adelante." };
  if (!slotsFor(input.date).includes(input.time)) return { ok: false as const, error: "Ese día u horario el taller está cerrado." };
  if (!services.length) return { ok: false as const, error: "Elegí al menos un servicio." };
  if (!input.name.trim() || input.phone.replace(/\D/g, "").length < 8) return { ok: false as const, error: "Completá nombre y teléfono." };
  const taken = await db.appointment.count({ where: { date: input.date, time: input.time, status: { not: "CANCELLED" } } });
  const appointment = await db.appointment.create({
    data: {
      date: input.date,
      time: input.time,
      services,
      name: input.name.trim().slice(0, 200),
      phone: input.phone.replace(/\D/g, "").slice(0, 15),
      bike: input.bike.trim().slice(0, 200) || null,
      notes: input.notes.trim().slice(0, 1000) || null,
      status: "CONFIRMED",
    },
  });
  return { ok: true as const, id: appointment.id, overbooked: taken >= workshopSchedule.perSlot };
}

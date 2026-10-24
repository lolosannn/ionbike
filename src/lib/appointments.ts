import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { workshopSchedule } from "@/config/workshop";
import { bookableDays, slotKey, todayKey } from "@/lib/workshop";

export class SlotFullError extends Error {}

/** Turnos ocupados por horario ("AAAA-MM-DD HH:MM" → cantidad) en los días reservables. */
export async function takenSlots() {
  const days = bookableDays(todayKey());
  const rows = await db.appointment.groupBy({
    by: ["date", "time"],
    where: { date: { in: days }, status: { not: "CANCELLED" } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [slotKey(r.date, r.time), r._count._all]));
}

export type AppointmentInput = {
  date: string;
  time: string;
  services: string[];
  name: string;
  phone: string;
  email?: string;
  bike?: string;
  notes?: string;
};

/** Crea el turno si todavía hay cupo en ese horario (serializable: dos reservas a la vez no pasan el cupo). */
export async function createAppointment(input: AppointmentInput) {
  return db.$transaction(
    async (tx) => {
      const taken = await tx.appointment.count({
        where: { date: input.date, time: input.time, status: { not: "CANCELLED" } },
      });
      if (taken >= workshopSchedule.perSlot) throw new SlotFullError();
      return tx.appointment.create({ data: input });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

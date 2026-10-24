"use server";

import { Prisma } from "@prisma/client";
import { workshopServices } from "@/config/workshop";
import { createAppointment, SlotFullError } from "@/lib/appointments";
import { isBookable } from "@/lib/workshop";
import type { BookingState } from "./WorkshopBooking";

function text(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

export async function bookAppointment(_prev: BookingState, form: FormData): Promise<BookingState> {
  const services = form.getAll("services").map(String).filter((id) => workshopServices.some((s) => s.id === id));
  const date = text(form, "date", 10);
  const time = text(form, "time", 5);
  const data = {
    name: text(form, "name"),
    phone: text(form, "phone", 40),
    email: text(form, "email") || undefined,
    bike: text(form, "bike") || undefined,
    notes: text(form, "notes", 1000) || undefined,
  };

  if (services.length === 0) return { error: "Elegí al menos un servicio." };
  if (!isBookable(date, time)) return { error: "Elegí un día y un horario disponibles." };
  if (!data.name || !data.phone) return { error: "Completá tu nombre y teléfono." };
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) return { error: "Revisá el email." };

  try {
    await createAppointment({ date, time, services, ...data });
  } catch (e) {
    const conflict = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
    if (e instanceof SlotFullError || conflict) {
      return { error: "Ese horario se acaba de ocupar. Elegí otro, por favor.", full: { date, time } };
    }
    throw e;
  }
  return { booked: { date, time, services, name: data.name, bike: data.bike } };
}

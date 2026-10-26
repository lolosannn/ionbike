// Taller: servicios, horarios de la agenda y cupos. Cambiar acá impacta en /taller.

export type WorkshopService = {
  id: string;
  name: string;
  description: string;
  // Duración orientativa, en minutos
  minutes: number;
  // Precio en centavos; null = "A confirmar"
  price: number | null;
  icon: "service" | "full" | "tubeless" | "liquido" | "centrado" | "lavado" | "frenos";
};

// [DESCRIPCIONES, DURACIONES Y PRECIOS A CONFIRMAR CON EL TALLER]
export const workshopServices: WorkshopService[] = [
  {
    id: "service-general", name: "Service general", icon: "service", minutes: 60, price: null,
    description: "Limpieza, regulación de cambios y frenos, lubricación de cadena y revisión general de la bici.",
  },
  {
    id: "service-full", name: "Service full", icon: "full", minutes: 180, price: null,
    description: "Desarme completo, limpieza profunda y engrase de rodamientos (dirección, caja pedalera y mazas), con ajuste total.",
  },
  {
    id: "tubelizado", name: "Tubelizado de ruedas", icon: "tubeless", minutes: 60, price: null,
    description: "Pasamos tus ruedas a tubeless: cinta, válvulas y líquido sellador.",
  },
  {
    id: "liquido-tubeless", name: "Reposición de líquido tubeless", icon: "liquido", minutes: 20, price: null,
    description: "Cambio o reposición del líquido sellador para que tus cubiertas sigan sellando.",
  },
  {
    id: "centrado", name: "Centrado de ruedas", icon: "centrado", minutes: 40, price: null,
    description: "Centrado y tensado de rayos para que la rueda gire derecha y sin roces.",
  },
  {
    id: "lavado", name: "Lavado de bicicleta", icon: "lavado", minutes: 40, price: null,
    description: "Lavado completo, secado y lubricación de la transmisión.",
  },
  {
    id: "purgado", name: "Purgado de frenos", icon: "frenos", minutes: 40, price: null,
    description: "Purgado de frenos hidráulicos y cambio de líquido para recuperar el tacto de la palanca.",
  },
];

// Agenda: los turnos son para dejar la bici en el local.
// Mismos horarios que el local (lun a vie 8 a 17 h, sáb 8 a 13 h).
export const workshopSchedule = {
  // Horarios por día de la semana (0 = domingo … 6 = sábado). Sin entrada = cerrado.
  hours: {
    1: [["08:00", "17:00"]],
    2: [["08:00", "17:00"]],
    3: [["08:00", "17:00"]],
    4: [["08:00", "17:00"]],
    5: [["08:00", "17:00"]],
    6: [["08:00", "13:00"]],
  } as Record<number, [string, string][]>,
  // Cada cuántos minutos hay un turno
  slotMinutes: 30,
  // Cuántas bicis se reciben por turno
  perSlot: 2,
  // Hasta cuántos días para adelante se puede reservar (desde mañana)
  daysAhead: 21,
  // Días cerrados (feriados, vacaciones), formato "AAAA-MM-DD"
  closedDates: [] as string[],
  timeZone: "America/Argentina/Buenos_Aires",
};

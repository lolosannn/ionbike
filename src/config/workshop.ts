// Taller: servicios, horarios de la agenda y cupos. Cambiar acá impacta en /taller.

export type WorkshopService = {
  id: string;
  name: string;
  description: string;
  // Duración orientativa, en minutos
  minutes: number;
  // Precio en centavos; null = "A confirmar"
  price: number | null;
  // Precio anterior (tachado) en centavos, si el servicio tiene descuento
  compareAt?: number;
  // Aclaración del precio ("por rueda")
  priceUnit?: string;
  icon: "service" | "full" | "tubeless" | "liquido" | "centrado" | "lavado" | "frenos";
};

// [DESCRIPCIONES Y DURACIONES A CONFIRMAR CON EL TALLER]
export const workshopServices: WorkshopService[] = [
  {
    id: "service-general", name: "Service general", icon: "service", minutes: 60, price: 3000000, compareAt: 5000000,
    description: "Limpieza, regulación de cambios y frenos, lubricación de cadena y revisión general de la bici.",
  },
  {
    id: "service-full", name: "Service full", icon: "full", minutes: 180, price: 4200000, compareAt: 7000000,
    description: "Desarme completo, limpieza profunda y engrase de rodamientos (dirección, caja pedalera y mazas), con ajuste total.",
  },
  {
    id: "tubelizado", name: "Tubelizado de ruedas", icon: "tubeless", minutes: 60, price: 12000000,
    description: "Pasamos tus ruedas a tubeless: cinta, válvulas y líquido sellador.",
  },
  {
    id: "liquido-tubeless", name: "Reposición de líquido tubeless", icon: "liquido", minutes: 20, price: 2000000,
    description: "Cambio o reposición del líquido sellador para que tus cubiertas sigan sellando.",
  },
  {
    id: "centrado", name: "Centrado de ruedas", icon: "centrado", minutes: 40, price: 1500000, priceUnit: "por rueda",
    description: "Centrado y tensado de rayos para que la rueda gire derecha y sin roces.",
  },
  {
    id: "lavado", name: "Lavado de bicicleta", icon: "lavado", minutes: 40, price: 2500000,
    description: "Lavado completo, secado y lubricación de la transmisión.",
  },
  {
    id: "purgado", name: "Purgado de frenos", icon: "frenos", minutes: 40, price: 2700000,
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

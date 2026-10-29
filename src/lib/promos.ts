import { promos } from "@/config/promos";
import type { Promo } from "@/config/promos";
import { publicImage } from "@/lib/public-files";

export type PromoData = Promo & {
  image: string | null;
  // Milisegundos (hora de Argentina): las fechas se comparan en el navegador, porque la vista
  // previa se genera una sola vez y tiene que apagar sola las promos vencidas
  startsAt: number | null;
  endsAt: number | null;
};

const at = (date: string | undefined, time: string) => (date ? Date.parse(`${date}T${time}-03:00`) : null);

/** Promos con la foto y las fechas resueltas. Más adelante salen de la base de datos. */
export function getPromos(): PromoData[] {
  return [...promos]
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .map((p) => ({
      ...p,
      image: publicImage("promos", p.id),
      startsAt: at(p.from, "00:00:00"),
      endsAt: at(p.until, "23:59:59"),
    }));
}

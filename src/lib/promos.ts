import { promos as samplePromos, type Promo, type PromoPlacement } from "@/config/promos";
import { publicImage } from "@/lib/public-files";
import { isStaticDemo } from "@/lib/catalog";
import { db } from "@/lib/db";

export type PromoData = Promo & {
  image: string | null;
  // Milisegundos (hora de Argentina): las fechas se comparan en el navegador, porque la vista
  // previa se genera una sola vez y tiene que apagar sola las promos vencidas
  startsAt: number | null;
  endsAt: number | null;
};

const at = (date: string | null | undefined, time: string) => (date ? Date.parse(`${date}T${time}-03:00`) : null);

const resolve = (p: Promo, image: string | null): PromoData => ({
  ...p,
  image,
  startsAt: at(p.from, "00:00:00"),
  endsAt: at(p.until, "23:59:59"),
});

/**
 * Promos para la tienda, de mayor a menor prioridad. En la tienda real salen de la base (se cargan
 * desde el panel); en la vista previa estática, de los ejemplos de src/config/promos.ts.
 * Las fechas se filtran en el navegador: acá vienen todas las que no están pausadas.
 */
export async function getPromos(): Promise<PromoData[]> {
  if (isStaticDemo) {
    return [...samplePromos]
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .map((p) => resolve(p, publicImage("promos", p.id)));
  }
  try {
    const rows = await db.promo.findMany({ where: { active: true }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }] });
    return rows.map((p) =>
      resolve(
        {
          id: p.id,
          title: p.title,
          text: p.text ?? undefined,
          tag: p.tag ?? undefined,
          href: p.href ?? undefined,
          cta: p.cta ?? undefined,
          from: p.startsOn ?? undefined,
          until: p.endsOn ?? undefined,
          categories: p.categories,
          products: p.products,
          placements: p.placements as PromoPlacement[],
          priority: p.priority,
        },
        p.image,
      ),
    );
  } catch (e) {
    // Si la base no responde, la tienda sigue andando sin promos
    console.error("No se pudieron leer las promos", e);
    return [];
  }
}

import "server-only";
import { db } from "@/lib/db";
import type { PromoPlacement } from "@/config/promos";
import type { PromoForm } from "@/lib/admin/promo-form";

type PromoRecord = Awaited<ReturnType<typeof db.promo.findFirstOrThrow>>;

export const toPromoForm = (p: PromoRecord): PromoForm => ({
  id: p.id,
  title: p.title,
  text: p.text ?? "",
  tag: p.tag ?? "",
  href: p.href ?? "",
  cta: p.cta ?? "",
  image: p.image ?? "",
  startsOn: p.startsOn ?? "",
  endsOn: p.endsOn ?? "",
  placements: p.placements as PromoPlacement[],
  categories: p.categories,
  products: p.products,
  priority: p.priority,
  active: p.active,
});

export async function listPromos() {
  const rows = await db.promo.findMany({ orderBy: [{ active: "desc" }, { priority: "desc" }, { updatedAt: "desc" }] });
  return rows.map(toPromoForm);
}

export async function getPromoForm(id: string) {
  const p = await db.promo.findUnique({ where: { id } });
  return p ? toPromoForm(p) : null;
}

/** Productos y categorías para elegir a qué aplica una promo */
export async function getPromoTargets() {
  const [products, categories] = await Promise.all([
    db.product.findMany({ select: { slug: true, name: true, active: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ include: { parent: true }, orderBy: { sort: "asc" } }),
  ]);
  return {
    products: products.map((p) => ({ slug: p.slug, name: p.name, active: p.active })),
    categories: categories.map((c) => ({ slug: c.slug, name: c.parent ? `${c.parent.name} › ${c.name}` : c.name })),
  };
}

export async function savePromo(data: PromoForm) {
  const fields = {
    title: data.title,
    text: data.text || null,
    tag: data.tag || null,
    href: data.href || null,
    cta: data.cta || null,
    image: data.image || null,
    startsOn: data.startsOn || null,
    endsOn: data.endsOn || null,
    placements: data.placements,
    categories: data.categories,
    products: data.products,
    priority: data.priority,
    active: data.active,
  };
  if (data.id) {
    const updated = await db.promo.updateMany({ where: { id: data.id }, data: fields });
    if (!updated.count) return { ok: false as const, error: "La promo ya no existe." };
    return { ok: true as const, id: data.id };
  }
  const created = await db.promo.create({ data: fields });
  return { ok: true as const, id: created.id };
}

export async function deletePromo(id: string) {
  const res = await db.promo.deleteMany({ where: { id } });
  return res.count > 0;
}

export async function setPromoActive(id: string, active: boolean) {
  const res = await db.promo.updateMany({ where: { id }, data: { active } });
  return res.count > 0;
}

import { connection } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { demoCategories, demoProducts, withRelations } from "@/lib/demo-store";

// Vista previa estática (GitHub Pages): sin base de datos, lee el catálogo de ejemplo.
export const isStaticDemo = process.env.DEMO_STATIC === "1";

const cardInclude = {
  brand: true,
  category: true,
  variants: true,
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export type ProductCardData = {
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  categorySlug: string;
  price: number;
  compareAt: number | null;
  image: string | null;
  colors: { name: string; hex: string | null }[];
  sizes: string[];
  inStock: boolean;
  onRequest: boolean;
  salesCount: number;
  createdAt: string;
};

function toCard(p: ProductWithRelations): ProductCardData {
  const colors = new Map<string, string | null>();
  const sizes = new Set<string>();
  for (const v of p.variants) {
    if (v.color) colors.set(v.color, v.colorHex);
    if (v.size) sizes.add(v.size);
  }
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand?.name ?? null,
    category: p.category.name,
    categorySlug: p.category.slug,
    price: p.price,
    compareAt: p.compareAt,
    image: p.images[0] ?? null,
    colors: [...colors].map(([name, hex]) => ({ name, hex })),
    sizes: [...sizes],
    inStock: p.variants.some((v) => v.stock > 0),
    onRequest: p.onRequest,
    salesCount: p.salesCount,
    createdAt: p.createdAt.toISOString(),
  };
}

const bySales = (a: { salesCount: number }, b: { salesCount: number }) => b.salesCount - a.salesCount;
const demoCards = (filter: (p: (typeof demoProducts)[number]) => boolean = () => true) =>
  demoProducts.filter(filter).map(withRelations).sort(bySales).map(toCard);

// En el servidor real, las consultas se resuelven en cada visita (datos siempre frescos)
async function live() {
  if (!isStaticDemo) await connection();
}

export async function getFeaturedProducts(limit = 4) {
  if (isStaticDemo) return demoCards().slice(0, limit);
  await live();
  const products = await db.product.findMany({
    where: { active: true },
    include: cardInclude,
    orderBy: [{ featured: "desc" }, { salesCount: "desc" }],
    take: limit,
  });
  return products.map(toCard);
}

export async function getAllProducts() {
  if (isStaticDemo) return demoCards();
  await live();
  const products = await db.product.findMany({ where: { active: true }, include: cardInclude, orderBy: { salesCount: "desc" } });
  return products.map(toCard);
}

export async function getCategoryWithProducts(slug: string) {
  if (isStaticDemo) {
    const category = demoCategories.find((c) => c.slug === slug);
    if (!category) return null;
    const children = demoCategories.filter((c) => c.parentId === category.id).sort((a, b) => a.sort - b.sort);
    const ids = [category.id, ...children.map((c) => c.id)];
    return {
      category: { ...category, children, parent: demoCategories.find((c) => c.id === category.parentId) ?? null },
      products: demoCards((p) => ids.includes(p.categoryId)),
    };
  }
  await live();
  const category = await db.category.findUnique({
    where: { slug },
    include: { children: { orderBy: { sort: "asc" } }, parent: true },
  });
  if (!category) return null;
  const ids = [category.id, ...category.children.map((c) => c.id)];
  const products = await db.product.findMany({
    where: { active: true, categoryId: { in: ids } },
    include: cardInclude,
    orderBy: { salesCount: "desc" },
  });
  return { category, products: products.map(toCard) };
}

export async function getDisciplines() {
  if (isStaticDemo) {
    return [
      ...demoCategories.filter((c) => c.parentId === "bicicletas").sort((a, b) => a.sort - b.sort),
      ...demoCategories.filter((c) => c.slug === "e-bike"),
    ];
  }
  await live();
  const bikes = await db.category.findUnique({
    where: { slug: "bicicletas" },
    include: { children: { orderBy: { sort: "asc" } } },
  });
  const ebike = await db.category.findUnique({ where: { slug: "e-bike" } });
  return [...(bikes?.children ?? []), ...(ebike ? [ebike] : [])];
}

export async function getProduct(slug: string) {
  if (isStaticDemo) {
    const p = demoProducts.find((d) => d.slug === slug);
    return p ? withRelations(p) : null;
  }
  await live();
  return db.product.findFirst({
    where: { slug, active: true },
    include: {
      brand: true,
      category: { include: { parent: true } },
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
    },
  });
}

export async function getRelatedProducts(categoryId: string, excludeSlug: string) {
  if (isStaticDemo) return demoCards((p) => p.categoryId === categoryId && p.slug !== excludeSlug).slice(0, 4);
  await live();
  const products = await db.product.findMany({
    where: { active: true, categoryId, slug: { not: excludeSlug } },
    include: cardInclude,
    orderBy: { salesCount: "desc" },
    take: 4,
  });
  return products.map(toCard);
}

/** Rutas a generar en la vista previa estática. En el servidor real se resuelven al visitar. */
export function staticCategorySlugs() {
  return isStaticDemo ? demoCategories.map((c) => ({ slug: c.slug })) : [];
}

export function staticProductSlugs() {
  return isStaticDemo ? demoProducts.map((p) => ({ slug: p.slug })) : [];
}

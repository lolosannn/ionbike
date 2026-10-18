import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

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
    salesCount: p.salesCount,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function getFeaturedProducts(limit = 4) {
  const products = await db.product.findMany({
    where: { active: true },
    include: cardInclude,
    orderBy: [{ featured: "desc" }, { salesCount: "desc" }],
    take: limit,
  });
  return products.map(toCard);
}

export async function getCategoryWithProducts(slug: string) {
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
  const bikes = await db.category.findUnique({
    where: { slug: "bicicletas" },
    include: { children: { orderBy: { sort: "asc" } } },
  });
  const ebike = await db.category.findUnique({ where: { slug: "e-bike" } });
  return [...(bikes?.children ?? []), ...(ebike ? [ebike] : [])];
}

export async function getProduct(slug: string) {
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
  const products = await db.product.findMany({
    where: { active: true, categoryId, slug: { not: excludeSlug } },
    include: cardInclude,
    orderBy: { salesCount: "desc" },
    take: 4,
  });
  return products.map(toCard);
}

export async function searchProducts(q: string) {
  const products = await db.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { name: { contains: q, mode: "insensitive" } } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: cardInclude,
    orderBy: { salesCount: "desc" },
    take: 48,
  });
  return products.map(toCard);
}

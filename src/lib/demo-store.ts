// Catálogo en memoria con la misma forma que devuelve Prisma.
// Se usa en la vista previa estática (GitHub Pages), donde no hay base de datos.
import type { Brand, Category, Product, Variant } from "@prisma/client";
import { brands as brandNames, categories as categoryData, palette, products as productData, skuFor } from "@/data/catalog";

const createdAt = new Date("2026-01-01T00:00:00Z");

export const demoCategories: Category[] = categoryData.map((c) => ({
  id: c.slug,
  slug: c.slug,
  name: c.name,
  description: c.description,
  sort: c.sort,
  parentId: c.parent ?? null,
}));

export const demoBrands: Brand[] = brandNames.map((name) => ({ id: name.toLowerCase(), slug: name.toLowerCase(), name }));

export const demoProducts: (Product & { variants: Variant[] })[] = productData.map((p) => ({
  id: p.slug,
  slug: p.slug,
  name: p.name,
  description: p.description,
  price: p.price,
  compareAt: p.compareAt ?? null,
  specs: p.specs,
  images: p.images,
  active: true,
  featured: p.featured,
  onRequest: p.onRequest ?? false,
  salesCount: p.salesCount,
  createdAt,
  updatedAt: createdAt,
  categoryId: p.category,
  brandId: p.brand.toLowerCase(),
  variants: p.colors.flatMap((color) =>
    p.sizes.map((size) => ({
      id: skuFor(p.slug, color, size),
      sku: skuFor(p.slug, color, size),
      color,
      colorHex: palette[color] ?? null,
      size,
      stock: p.stock,
      productId: p.slug,
    })),
  ),
}));

export function withRelations(p: (typeof demoProducts)[number]) {
  const category = demoCategories.find((c) => c.id === p.categoryId)!;
  return {
    ...p,
    brand: demoBrands.find((b) => b.id === p.brandId) ?? null,
    category: { ...category, parent: demoCategories.find((c) => c.id === category.parentId) ?? null },
  };
}

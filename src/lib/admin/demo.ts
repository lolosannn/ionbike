// Datos del panel en la vista previa estática (GitHub Pages): el catálogo de ejemplo, sin base.
import { demoBrands, demoCategories, demoProducts, withRelations } from "@/lib/demo-store";
import { toCategoryOptions, toProductForm } from "@/lib/admin/product-form";
import type { ProductRow } from "@/lib/admin/products";

export function demoProductRows(): ProductRow[] {
  return demoProducts.map(withRelations).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? null,
    category: p.category.name,
    categoryId: p.categoryId,
    price: p.price,
    compareAt: p.compareAt,
    image: p.images[0] ?? null,
    stock: p.variants.reduce((n, v) => n + v.stock, 0),
    variants: p.variants.length,
    active: p.active,
    featured: p.featured,
    onRequest: p.onRequest,
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export function demoEditorOptions() {
  return { categories: toCategoryOptions(demoCategories), brands: demoBrands.map((b) => b.name).sort() };
}

export const demoProductIds = () => demoProducts.map((p) => p.id);

export function demoProductForm(id: string) {
  const p = demoProducts.find((d) => d.id === id);
  return p ? toProductForm(withRelations(p)) : null;
}

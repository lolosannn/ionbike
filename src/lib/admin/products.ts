import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { slugify, toCategoryOptions, toProductForm, type ProductForm, type SaveResult } from "@/lib/admin/product-form";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  categoryId: string;
  price: number;
  compareAt: number | null;
  image: string | null;
  stock: number;
  variants: number;
  active: boolean;
  featured: boolean;
  onRequest: boolean;
  updatedAt: string;
};

export async function listProductRows(): Promise<ProductRow[]> {
  const products = await db.product.findMany({
    include: { brand: true, category: true, variants: { where: { active: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return products.map((p) => ({
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

export async function getEditorOptions() {
  const [categories, brands] = await Promise.all([
    db.category.findMany({ include: { parent: true } }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { categories: toCategoryOptions(categories), brands: brands.map((b) => b.name) };
}

export async function getProductForm(id: string) {
  const product = await db.product.findUnique({ where: { id }, include: { brand: true, variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } } });
  return product ? toProductForm(product) : null;
}

class SaveError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
  }
}

const cents = (pesos: number) => Math.round(pesos * 100);

/** Qué cambió, para el registro de acciones (sin textos largos) */
function diff(before: ProductForm | null, after: ProductForm) {
  if (!before) return { creado: after.name };
  const changes: Record<string, unknown> = {};
  for (const key of ["name", "slug", "brand", "categoryId", "price", "compareAt", "active", "featured", "onRequest"] as const) {
    if (before[key] !== after[key]) changes[key] = [before[key], after[key]];
  }
  if (before.description !== after.description) changes.description = "editada";
  if (before.images.join() !== after.images.join()) changes.images = [before.images.length, after.images.length];
  if (JSON.stringify(before.specs) !== JSON.stringify(after.specs)) changes.specs = "editadas";
  const stock = (f: ProductForm) => Object.fromEntries(f.variants.map((v) => [v.sku, v.stock]));
  if (JSON.stringify(stock(before)) !== JSON.stringify(stock(after))) changes.variants = { antes: stock(before), despues: stock(after) };
  return changes;
}

/** Crea o actualiza un producto con sus variantes, todo junto (si algo falla no se guarda nada). */
export async function saveProduct(data: ProductForm): Promise<SaveResult & { changes?: Record<string, unknown> }> {
  try {
    return await db.$transaction(async (tx) => {
      const before = data.id ? await tx.product.findUnique({ where: { id: data.id }, include: { brand: true, variants: true } }) : null;
      if (data.id && !before) throw new SaveError("El producto ya no existe (¿lo borró otra persona?).");
      if (before && data.updatedAt && before.updatedAt.toISOString() !== data.updatedAt) {
        throw new SaveError("Otra persona guardó cambios en este producto mientras lo editabas. Recargá la página para ver la última versión.");
      }

      const category = await tx.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new SaveError("La categoría no existe.", "categoryId");

      const slugTaken = await tx.product.findFirst({ where: { slug: data.slug, NOT: data.id ? { id: data.id } : undefined } });
      if (slugTaken) throw new SaveError(`Ya hay otro producto con el link /${data.slug}: cambialo.`, "slug");

      let brandId: string | null = null;
      if (data.brand) {
        const slug = slugify(data.brand);
        const brand = await tx.brand.upsert({ where: { slug }, update: {}, create: { slug, name: data.brand } });
        brandId = brand.id;
      }

      const fields = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: cents(data.price!),
        compareAt: data.compareAt === null ? null : cents(data.compareAt),
        specs: data.specs,
        images: data.images,
        active: data.active,
        featured: data.featured,
        onRequest: data.onRequest,
        categoryId: category.id,
        brandId,
      };
      const product = before
        ? await tx.product.update({ where: { id: before.id }, data: fields })
        : await tx.product.create({ data: fields });

      // Variantes: las que siguen se actualizan, las nuevas se crean y las que se sacaron se borran
      // (o se archivan si ya se vendieron, porque quedan en los pedidos)
      const own = new Map((before?.variants ?? []).map((v) => [v.id, v]));
      const ownBySku = new Map((before?.variants ?? []).map((v) => [v.sku, v]));
      const kept = new Set<string>();
      for (const v of data.variants) {
        const existing = (v.id && own.get(v.id)) || ownBySku.get(v.sku);
        const skuOwner = await tx.variant.findUnique({ where: { sku: v.sku } });
        if (skuOwner && skuOwner.productId !== product.id) throw new SaveError(`El SKU ${v.sku} ya lo usa otro producto.`, "variants");
        const values = { sku: v.sku, color: v.color || null, colorHex: v.colorHex || null, size: v.size || null, stock: v.stock, active: true };
        if (existing) {
          // Si cambió el SKU y el nuevo ya lo tenía otra variante archivada de este producto, se libera
          if (skuOwner && skuOwner.id !== existing.id) await tx.variant.update({ where: { id: skuOwner.id }, data: { sku: `${skuOwner.sku}-archivada-${Date.now()}` } });
          await tx.variant.update({ where: { id: existing.id }, data: values });
          kept.add(existing.id);
        } else {
          const created = await tx.variant.create({ data: { ...values, productId: product.id } });
          kept.add(created.id);
        }
      }
      for (const v of before?.variants ?? []) {
        if (kept.has(v.id) || !v.active) continue;
        const sold = await tx.orderItem.count({ where: { variantId: v.id } });
        if (sold) await tx.variant.update({ where: { id: v.id }, data: { active: false, stock: 0 } });
        else await tx.variant.delete({ where: { id: v.id } });
      }

      const saved = await tx.product.findUniqueOrThrow({ where: { id: product.id }, include: { brand: true, variants: true } });
      const changes = diff(before ? toProductForm(before) : null, toProductForm(saved));
      return { ok: true as const, id: saved.id, slug: saved.slug, updatedAt: saved.updatedAt.toISOString(), changes };
    });
  } catch (e) {
    if (e instanceof SaveError) return { ok: false, error: e.message, field: e.field };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Hay un dato repetido (link o SKU) con otro producto. Revisalo y volvé a guardar." };
    }
    throw e;
  }
}

/** Borra un producto. Si ya tiene ventas no se puede (quedan en los pedidos): hay que ocultarlo. */
export async function deleteProduct(id: string) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return { ok: false as const, error: "El producto ya no existe." };
  const sold = await db.orderItem.count({ where: { variant: { productId: id } } });
  if (sold) return { ok: false as const, error: "Este producto ya tiene ventas y no se puede borrar: ocultalo para que no se vea en la tienda." };
  await db.product.delete({ where: { id } });
  return { ok: true as const, name: product.name };
}

export async function setProductActive(id: string, active: boolean) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return null;
  await db.product.update({ where: { id }, data: { active } });
  return { name: product.name };
}

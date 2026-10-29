// Formulario de producto del panel: forma de los datos, conversión desde la base y validación.
// Se usa en el navegador (editor) y en el servidor (que vuelve a validar todo antes de guardar).
import type { Brand, Category, Product, Variant } from "@prisma/client";

export type VariantForm = {
  // Vacío en las variantes nuevas
  id: string;
  color: string;
  colorHex: string;
  size: string;
  stock: number;
  sku: string;
};

export type SpecForm = { label: string; value: string };

export type ProductForm = {
  id: string;
  // Para avisar si otra persona guardó cambios mientras tanto
  updatedAt: string;
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  description: string;
  // En pesos (pueden llevar centavos)
  price: number | null;
  compareAt: number | null;
  active: boolean;
  featured: boolean;
  onRequest: boolean;
  images: string[];
  specs: SpecForm[];
  variants: VariantForm[];
};

export type CategoryOption = { id: string; name: string; slug: string; parentSlug: string | null; parentName: string | null };

export type SaveResult =
  | { ok: true; id: string; updatedAt: string; slug: string }
  | { ok: false; error: string; field?: string };

export const limits = {
  name: 120,
  slug: 120,
  brand: 60,
  description: 5000,
  images: 20,
  specs: 60,
  specLabel: 60,
  specValue: 1000,
  variants: 200,
  variantText: 40,
  maxPrice: 1_000_000_000,
  maxStock: 100_000,
};

export const emptyProduct: ProductForm = {
  id: "",
  updatedAt: "",
  name: "",
  slug: "",
  brand: "",
  categoryId: "",
  description: "",
  price: null,
  compareAt: null,
  active: false,
  featured: false,
  onRequest: false,
  images: [],
  specs: [],
  variants: [{ id: "", color: "", colorHex: "", size: "", stock: 0, sku: "" }],
};

type ProductWithRelations = Product & { brand: Brand | null; variants: Variant[] };

export function toProductForm(p: ProductWithRelations): ProductForm {
  const specs = Array.isArray(p.specs) ? (p.specs as SpecForm[]) : [];
  return {
    id: p.id,
    updatedAt: p.updatedAt.toISOString(),
    name: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? "",
    categoryId: p.categoryId,
    description: p.description,
    price: p.price / 100,
    compareAt: p.compareAt === null ? null : p.compareAt / 100,
    active: p.active,
    featured: p.featured,
    onRequest: p.onRequest,
    images: p.images,
    specs: specs.map((s) => ({ label: String(s.label ?? ""), value: String(s.value ?? "") })),
    variants: p.variants
      .filter((v) => v.active)
      .map((v) => ({ id: v.id, color: v.color ?? "", colorHex: v.colorHex ?? "", size: v.size ?? "", stock: v.stock, sku: v.sku })),
  };
}

export function toCategoryOptions(categories: (Category & { parent?: Category | null })[]): CategoryOption[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return categories
    .map((c) => {
      const parent = c.parentId ? byId.get(c.parentId) ?? null : null;
      return { id: c.id, name: c.name, slug: c.slug, parentSlug: parent?.slug ?? null, parentName: parent?.name ?? null, sort: c.sort, parentSort: parent?.sort ?? c.sort };
    })
    .sort((a, b) => a.parentSort - b.parentSort || Number(!!a.parentSlug) - Number(!!b.parentSlug) || a.sort - b.sort)
    .map(({ id, name, slug, parentSlug, parentName }) => ({ id, name, slug, parentSlug, parentName }));
}

/** Copia para "Duplicar": mismo contenido, oculta y con link y SKUs nuevos */
export function duplicateProduct(p: ProductForm): ProductForm {
  return {
    ...p,
    id: "",
    updatedAt: "",
    name: `${p.name} (copia)`.slice(0, limits.name),
    slug: `${p.slug}-copia`.slice(0, limits.slug),
    active: false,
    variants: p.variants.map((v) => ({ ...v, id: "", sku: "" })),
  };
}

/** "Bicicleta MTB Zion Ñandú R29" → "bicicleta-mtb-zion-nandu-r29" */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, limits.slug);
}

export const skuFor = (slug: string, color: string, size: string) =>
  [slug, color, size].filter(Boolean).map(slugify).join("-").slice(0, 160) || "variante";

/** Texto con formato argentino → pesos: "632.583,60" → 632583.6 */
export function parsePesos(text: string): number | null {
  const clean = text.replace(/[$\s.]/g, "").replace(",", ".");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

const hex = /^#[0-9a-f]{6}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Fotos subidas al panel (/media/…) o archivos propios del sitio (/demo/…, /productos/…)
const imagePattern = /^\/(?:media\/[a-f0-9]{32}\.webp|[a-z0-9][a-z0-9/_.-]*\.(?:webp|jpg|jpeg|png|svg))$/i;

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Valida y limpia lo que llega del navegador. En el servidor esto es lo único que se guarda:
 * cualquier dato de más se descarta y cualquier dato inválido corta con un mensaje.
 */
export function validateProduct(raw: unknown): { ok: true; data: ProductForm } | { ok: false; error: string; field?: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Datos inválidos." };
  const r = raw as Record<string, unknown>;
  const name = text(r.name, limits.name);
  const slug = text(r.slug, limits.slug).toLowerCase();
  const price = typeof r.price === "number" ? Math.round(r.price * 100) / 100 : NaN;
  const compareAt = r.compareAt === null || r.compareAt === undefined || r.compareAt === "" ? null : typeof r.compareAt === "number" ? Math.round(r.compareAt * 100) / 100 : NaN;

  if (!name) return { ok: false, error: "Poné el nombre del producto.", field: "name" };
  if (!slugPattern.test(slug)) return { ok: false, error: "El link solo puede tener minúsculas, números y guiones.", field: "slug" };
  if (!text(r.categoryId, 40)) return { ok: false, error: "Elegí la categoría.", field: "categoryId" };
  if (!Number.isFinite(price) || price <= 0 || price > limits.maxPrice) return { ok: false, error: "Revisá el precio.", field: "price" };
  if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt > limits.maxPrice)) return { ok: false, error: "Revisá el precio anterior.", field: "compareAt" };
  if (compareAt !== null && compareAt <= price) {
    return { ok: false, error: "El precio anterior tiene que ser mayor que el precio actual (o dejalo vacío).", field: "compareAt" };
  }

  const images = Array.isArray(r.images) ? r.images.filter((i): i is string => typeof i === "string") : [];
  if (images.length > limits.images) return { ok: false, error: `Máximo ${limits.images} fotos.`, field: "images" };
  if (images.some((i) => !imagePattern.test(i) || i.includes(".."))) return { ok: false, error: "Hay una foto inválida.", field: "images" };

  const specsRaw = Array.isArray(r.specs) ? r.specs : [];
  if (specsRaw.length > limits.specs) return { ok: false, error: `Máximo ${limits.specs} especificaciones.`, field: "specs" };
  const specs = specsRaw
    .map((s) => ({ label: text((s as SpecForm)?.label, limits.specLabel), value: text((s as SpecForm)?.value, limits.specValue) }))
    .filter((s) => s.label && s.value);

  const variantsRaw = Array.isArray(r.variants) ? r.variants : [];
  if (variantsRaw.length > limits.variants) return { ok: false, error: `Máximo ${limits.variants} variantes.`, field: "variants" };
  const variants: VariantForm[] = [];
  const combos = new Set<string>();
  const skus = new Set<string>();
  for (const v of variantsRaw as Record<string, unknown>[]) {
    const color = text(v?.color, limits.variantText);
    const size = text(v?.size, limits.variantText);
    const colorHex = text(v?.colorHex, 7);
    const stock = typeof v?.stock === "number" ? v.stock : NaN;
    const sku = text(v?.sku, 160).toLowerCase() || skuFor(slug, color, size);
    const combo = `${color.toLowerCase()}|${size.toLowerCase()}`;
    const label = [color, size].filter(Boolean).join(" / ") || "sin color ni talle";
    if (!Number.isInteger(stock) || stock < 0 || stock > limits.maxStock) return { ok: false, error: `Revisá el stock de la variante ${label}.`, field: "variants" };
    if (colorHex && !hex.test(colorHex)) return { ok: false, error: `Revisá el color de la variante ${label}.`, field: "variants" };
    if (!/^[a-z0-9][a-z0-9-]*$/.test(sku)) return { ok: false, error: `El SKU de ${label} solo puede tener minúsculas, números y guiones.`, field: "variants" };
    if (combos.has(combo)) return { ok: false, error: `La variante ${label} está repetida.`, field: "variants" };
    if (skus.has(sku)) return { ok: false, error: `El SKU ${sku} está repetido.`, field: "variants" };
    combos.add(combo);
    skus.add(sku);
    variants.push({ id: text(v?.id, 40), color, colorHex: colorHex.toLowerCase(), size, stock, sku });
  }
  if (variants.length === 0) return { ok: false, error: "Tiene que haber al menos una variante (aunque sea sin color ni talle).", field: "variants" };

  return {
    ok: true,
    data: {
      id: text(r.id, 40),
      updatedAt: text(r.updatedAt, 40),
      name,
      slug,
      brand: text(r.brand, limits.brand),
      categoryId: text(r.categoryId, 40),
      description: text(r.description, limits.description),
      price,
      compareAt,
      active: r.active === true,
      featured: r.featured === true,
      onRequest: r.onRequest === true,
      images,
      specs,
      variants,
    },
  };
}

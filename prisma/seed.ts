// Carga el catálogo de ejemplo de src/data/catalog.ts en la base de datos.
import { PrismaClient } from "@prisma/client";
import { brands, categories, demoImages, palette, products, skuFor } from "../src/data/catalog";
import { promos } from "../src/config/promos";

const db = new PrismaClient();

async function main() {
  // Primero las categorías raíz, después las hijas
  for (const c of [...categories].sort((a, b) => Number(!!a.parent) - Number(!!b.parent))) {
    const parentId = c.parent ? (await db.category.findUniqueOrThrow({ where: { slug: c.parent } })).id : null;
    const data = { name: c.name, sort: c.sort, description: c.description, parentId };
    await db.category.upsert({ where: { slug: c.slug }, update: data, create: { slug: c.slug, ...data } });
  }
  for (const name of brands) {
    const slug = name.toLowerCase();
    await db.brand.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  }

  for (const p of products) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: p.category } });
    const brand = await db.brand.findUniqueOrThrow({ where: { slug: p.brand.toLowerCase() } });
    const data = {
      name: p.name,
      price: p.price,
      compareAt: p.compareAt ?? null,
      specs: p.specs,
      images: p.images.length ? p.images : demoImages(p),
      featured: p.featured,
      onRequest: p.onRequest ?? false,
      salesCount: p.salesCount,
      description: p.description,
      categoryId: category.id,
      brandId: brand.id,
    };
    const product = await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
    for (const color of p.colors) {
      for (const size of p.sizes) {
        const sku = skuFor(p.slug, color, size);
        await db.variant.upsert({
          where: { sku },
          update: {},
          create: { sku, color, colorHex: palette[color], size, stock: p.stock, productId: product.id },
        });
      }
    }
  }
  // Promos de ejemplo, solo si todavía no se cargó ninguna desde el panel
  if ((await db.promo.count()) === 0) {
    for (const p of promos) {
      await db.promo.create({
        data: {
          title: p.title, text: p.text, tag: p.tag, href: p.href, cta: p.cta, startsOn: p.from, endsOn: p.until,
          placements: p.placements, categories: p.categories ?? [], products: p.products ?? [], priority: p.priority ?? 0,
        },
      });
    }
  }
  console.log("Seed listo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

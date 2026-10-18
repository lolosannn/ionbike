// Datos de ejemplo para desarrollo. Los precios son los publicados en la web actual;
// colores, stock y especificaciones son de muestra hasta importar el catálogo real.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const categories = [
  { slug: "bicicletas", name: "Bicicletas", sort: 1, description: "Mountain bike, gravel, ruta, dirt jump y usados seleccionados." },
  { slug: "e-bike", name: "E-Bike", sort: 2, description: "Bicicletas eléctricas con asistencia al pedaleo." },
  { slug: "repuestos", name: "Repuestos", sort: 3, description: "Transmisión, frenos, cubiertas y todo para que tu bici siga rodando." },
  { slug: "accesorios", name: "Accesorios", sort: 4, description: "Cascos, luces, candados, bolsos y más." },
  { slug: "indumentaria", name: "Indumentaria", sort: 5, description: "Ropa y calzado para salir a rodar cómodo." },
];

const bikeChildren = [
  { slug: "mtb", name: "Mountain Bike", sort: 1, description: "Para terrenos irregulares, con suspensión y cubiertas anchas para mayor agarre." },
  { slug: "gravel", name: "Gravel", sort: 2, description: "Versátiles para ripio y asfalto: cuadro liviano y cubiertas semianchas." },
  { slug: "ruta", name: "Ruta", sort: 3, description: "Livianas y aerodinámicas, con cubiertas finas para máxima velocidad." },
  { slug: "dirt-jump", name: "Dirt Jump", sort: 4, description: "Para trucos y saltos, con cuadros reforzados y geometría compacta." },
  { slug: "usados-outlet", name: "Usados / Outlet", sort: 5, description: "Usado seleccionado y oportunidades de temporada." },
];

const brands = ["Zion", "SPY", "Eurobike", "Gravity"];

const palette: Record<string, string> = {
  Negro: "#111111", Rojo: "#C62828", Verde: "#2E7D32", Gris: "#9E9E9E", Azul: "#1E4FD8",
  Celeste: "#5BB8E8", Blanco: "#F2F2F2", Violeta: "#6A3FA0", Naranja: "#F57C00",
};

const products = [
  {
    slug: "bicicleta-mtb-zion-aspro-rodado-29-21v",
    name: "Bicicleta MTB Zion Aspro Rodado 29 21V",
    brand: "Zion", category: "mtb", price: 565_978_00, salesCount: 40, featured: true,
    colors: ["Negro", "Naranja", "Gris"], sizes: ["29"],
    specs: [{ label: "Rodado", value: "29" }, { label: "Velocidades", value: "21" }, { label: "Frenos", value: "[A CONFIRMAR]" }],
  },
  {
    slug: "bicicleta-mtb-zion-ovanta-r29-monoplato",
    name: "Bicicleta MTB Zion Ovanta R29 Monoplato",
    brand: "Zion", category: "mtb", price: 750_428_00, salesCount: 32, featured: true,
    colors: ["Verde", "Azul", "Gris", "Negro"], sizes: ["29"],
    specs: [{ label: "Rodado", value: "29" }, { label: "Transmisión", value: "Monoplato" }],
  },
  {
    slug: "bicicleta-mtb-rodado-26-spy-ridder-shimano",
    name: "Bicicleta MTB Rodado 26 SPY Ridder Shimano",
    brand: "SPY", category: "mtb", price: 632_583_60, salesCount: 28, featured: true,
    colors: ["Blanco", "Violeta", "Rojo"], sizes: ["26"],
    specs: [{ label: "Rodado", value: "26" }, { label: "Componentes", value: "Shimano" }],
  },
  {
    slug: "bicicleta-spy-ridder-r26-2026",
    name: "Bicicleta SPY Ridder R26 2026",
    brand: "SPY", category: "dirt-jump", price: 632_583_60, salesCount: 25, featured: true,
    colors: ["Celeste", "Negro", "Gris"], sizes: ["26"],
    specs: [{ label: "Rodado", value: "26" }, { label: "Uso", value: "MTB / Dirt" }],
  },
];

async function main() {
  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  const bikes = await db.category.findUniqueOrThrow({ where: { slug: "bicicletas" } });
  for (const c of bikeChildren) {
    await db.category.upsert({ where: { slug: c.slug }, update: { ...c, parentId: bikes.id }, create: { ...c, parentId: bikes.id } });
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
      specs: p.specs,
      featured: p.featured,
      salesCount: p.salesCount,
      categoryId: category.id,
      brandId: brand.id,
      description: "[DESCRIPCIÓN DEL PRODUCTO]",
    };
    const product = await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
    for (const color of p.colors) {
      for (const size of p.sizes) {
        const sku = `${p.slug}-${color}-${size}`.toLowerCase();
        await db.variant.upsert({
          where: { sku },
          update: {},
          create: { sku, color, colorHex: palette[color], size, stock: 3, productId: product.id },
        });
      }
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

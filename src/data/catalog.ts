// Catálogo de ejemplo: lo usan el seed de la base de datos y la vista previa estática.
// Los precios son los publicados en la web actual; colores, stock y especificaciones
// son de muestra hasta importar el catálogo real.

export type CategoryData = { slug: string; name: string; sort: number; description: string; parent?: string };

export type ProductData = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  // Centavos
  price: number;
  compareAt?: number;
  salesCount: number;
  featured: boolean;
  // A pedido: sin stock, se consulta por WhatsApp
  onRequest?: boolean;
  colors: string[];
  sizes: string[];
  stock: number;
  specs: { label: string; value: string }[];
  description: string;
  images: string[];
};

export const categories: CategoryData[] = [
  { slug: "bicicletas", name: "Bicicletas", sort: 1, description: "Mountain bike, gravel, ruta, dirt jump y usados seleccionados." },
  { slug: "e-bike", name: "E-Bike", sort: 2, description: "Bicicletas eléctricas con asistencia al pedaleo." },
  { slug: "repuestos", name: "Repuestos", sort: 3, description: "Transmisión, frenos, cubiertas y todo para que tu bici siga rodando." },
  { slug: "accesorios", name: "Accesorios", sort: 4, description: "Cascos, luces, candados, bolsos y más." },
  { slug: "indumentaria", name: "Indumentaria", sort: 5, description: "Ropa y calzado para salir a rodar cómodo." },
  { slug: "mtb", name: "Mountain Bike", sort: 1, parent: "bicicletas", description: "Para terrenos irregulares, con suspensión y cubiertas anchas para mayor agarre." },
  { slug: "gravel", name: "Gravel", sort: 2, parent: "bicicletas", description: "Versátiles para ripio y asfalto: cuadro liviano y cubiertas semianchas." },
  { slug: "ruta", name: "Ruta", sort: 3, parent: "bicicletas", description: "Livianas y aerodinámicas, con cubiertas finas para máxima velocidad." },
  { slug: "dirt-jump", name: "Dirt Jump", sort: 4, parent: "bicicletas", description: "Para trucos y saltos, con cuadros reforzados y geometría compacta." },
  { slug: "usados-outlet", name: "Usados / Outlet", sort: 5, parent: "bicicletas", description: "Usado seleccionado y oportunidades de temporada." },
];

export const brands = ["Zion", "SPY", "Eurobike", "Gravity"];

export const palette: Record<string, string> = {
  Negro: "#111111", Rojo: "#C62828", Verde: "#2E7D32", Gris: "#9E9E9E", Azul: "#1E4FD8",
  Celeste: "#5BB8E8", Blanco: "#F2F2F2", Violeta: "#6A3FA0", Naranja: "#F57C00",
};

export const products: ProductData[] = [
  {
    slug: "bicicleta-mtb-zion-aspro-rodado-29-21v",
    name: "Bicicleta MTB Zion Aspro Rodado 29 21V",
    brand: "Zion", category: "mtb", price: 565_978_00, salesCount: 40, featured: true,
    colors: ["Negro", "Naranja", "Gris"], sizes: ["29"], stock: 3,
    specs: [{ label: "Rodado", value: "29" }, { label: "Velocidades", value: "21" }, { label: "Frenos", value: "[A CONFIRMAR]" }],
    description: "[DESCRIPCIÓN DEL PRODUCTO]", images: [],
  },
  {
    slug: "bicicleta-mtb-zion-ovanta-r29-monoplato",
    name: "Bicicleta MTB Zion Ovanta R29 Monoplato",
    brand: "Zion", category: "mtb", price: 750_428_00, salesCount: 32, featured: true,
    colors: ["Verde", "Azul", "Gris", "Negro"], sizes: ["29"], stock: 3,
    specs: [{ label: "Rodado", value: "29" }, { label: "Transmisión", value: "Monoplato" }],
    description: "[DESCRIPCIÓN DEL PRODUCTO]", images: [],
  },
  {
    slug: "bicicleta-mtb-rodado-26-spy-ridder-shimano",
    name: "Bicicleta MTB Rodado 26 SPY Ridder Shimano",
    brand: "SPY", category: "mtb", price: 632_583_60, salesCount: 28, featured: true,
    colors: ["Blanco", "Violeta", "Rojo"], sizes: ["26"], stock: 3,
    specs: [{ label: "Rodado", value: "26" }, { label: "Componentes", value: "Shimano" }],
    description: "[DESCRIPCIÓN DEL PRODUCTO]", images: [],
  },
  {
    slug: "bicicleta-spy-ridder-r26-2026",
    name: "Bicicleta SPY Ridder R26 2026",
    brand: "SPY", category: "dirt-jump", price: 632_583_60, salesCount: 25, featured: true,
    colors: ["Celeste", "Negro", "Gris"], sizes: ["26"], stock: 3,
    specs: [{ label: "Rodado", value: "26" }, { label: "Uso", value: "MTB / Dirt" }],
    description: "[DESCRIPCIÓN DEL PRODUCTO]", images: [],
  },
  {
    slug: "bicicleta-mtb-doble-suspension-carbono-r29-12v",
    name: "Bicicleta MTB Doble Suspensión Carbono R29 12V",
    brand: "Gravity", category: "mtb", price: 4_850_000_00, salesCount: 0, featured: false, onRequest: true,
    colors: ["Negro"], sizes: ["29"], stock: 0,
    specs: [{ label: "Rodado", value: "29" }, { label: "Cuadro", value: "Carbono" }, { label: "Suspensión", value: "Doble" }, { label: "Velocidades", value: "12" }],
    description: "[EJEMPLO DE PRODUCTO DE GAMA ALTA A PEDIDO]", images: [],
  },
];

export const skuFor = (slug: string, color: string, size: string) => `${slug}-${color}-${size}`.toLowerCase();

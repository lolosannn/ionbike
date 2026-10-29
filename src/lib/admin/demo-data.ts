// Datos inventados para recorrer el panel en la vista previa estática (GitHub Pages).
// Se generan siempre iguales (semilla fija), relativos al momento en que se publica la vista previa.
import type { AppointmentStatus, InquiryStatus, OrderStatus, PaymentMethod, ShippingMethod } from "@prisma/client";
import { demoCategories, demoProducts } from "@/lib/demo-store";
import { promos as samplePromos } from "@/config/promos";
import type { PromoForm } from "@/lib/admin/promo-form";
import type { StatsData } from "@/lib/admin/stats-types";
import { holdUntil } from "@/lib/orders";
import type { OrderDetail, OrderRow } from "@/lib/admin/orders";
import type { AppointmentRow, InquiryRow } from "@/lib/admin/types";

export const demoNow = Date.now();

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const names = [
  "Martín Gómez", "Lucía Fernández", "Diego Romero", "Sofía Álvarez", "Nicolás Pereyra", "Valentina Ruiz",
  "Joaquín Sosa", "Camila Torres", "Facundo Díaz", "Agustina Morales", "Tomás Herrera", "Florencia Castro",
  "Matías Acosta", "Julieta Medina", "Lautaro Benítez", "Micaela Suárez",
];
const provinces = ["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Neuquén"];
const methods: PaymentMethod[] = ["CARD", "TRANSFER", "MERCADOPAGO", "QR", "CASH", "CARD", "TRANSFER"];

function buildOrders(): OrderDetail[] {
  const r = rng(7);
  const buyable = demoProducts.filter((p) => !p.onRequest);
  const orders: OrderDetail[] = [];
  for (let i = 0; i < 26; i++) {
    const ageDays = i < 3 ? r() * 0.8 : (i / 26) * 45 + r() * 2;
    const created = new Date(demoNow - ageDays * 864e5);
    const product = buyable[Math.floor(r() * buyable.length)];
    const variant = product.variants[Math.floor(r() * product.variants.length)];
    const paymentMethod = methods[Math.floor(r() * methods.length)];
    const shippingMethod: ShippingMethod = r() < 0.55 ? "DELIVERY" : "PICKUP";
    const status: OrderStatus =
      i < 2 ? "PENDING" : i < 6 ? "PAID" : i < 8 && shippingMethod === "DELIVERY" ? "SHIPPED" : i % 9 === 4 ? "CANCELLED" : i < 9 ? "PENDING" : "DELIVERED";
    const cash = ["TRANSFER", "QR", "CASH"].includes(paymentMethod);
    const subtotal = product.price;
    const discount = cash ? Math.round(subtotal * 0.25) : 0;
    const name = names[i % names.length];
    orders.push({
      id: `demo-pedido-${120 - i}`,
      number: 120 - i,
      createdAt: created.toISOString(),
      name,
      phone: `11${String(40000000 + Math.floor(r() * 9999999))}`,
      email: `${name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@ejemplo.com`,
      dni: String(30000000 + Math.floor(r() * 9000000)),
      total: subtotal - discount,
      status,
      paymentMethod,
      shippingMethod,
      summary: product.name,
      units: 1,
      province: shippingMethod === "DELIVERY" ? provinces[Math.floor(r() * provinces.length)] : null,
      address: shippingMethod === "DELIVERY" ? `Av. Siempreviva ${Math.floor(r() * 3000)}` : null,
      city: shippingMethod === "DELIVERY" ? "Ciudad de ejemplo" : null,
      zip: shippingMethod === "DELIVERY" ? "1842" : null,
      notes: i === 3 ? "¿Me la pueden dejar armada? Gracias!" : null,
      subtotal,
      discount,
      shippingCost: 0,
      mpPaymentId: !cash && status !== "PENDING" && status !== "CANCELLED" ? String(90000000000 + i) : null,
      paidAt: ["PAID", "SHIPPED", "DELIVERED"].includes(status) ? new Date(created.getTime() + 3 * 36e5).toISOString() : null,
      updatedAt: created.toISOString(),
      holdUntil: holdUntil(paymentMethod, created).toISOString(),
      trackingCode: status === "SHIPPED" || (status === "DELIVERED" && shippingMethod === "DELIVERY") ? `3600000${1000 + i}` : null,
      adminNotes: i === 5 ? "Pasa el sábado a la mañana." : null,
      publicToken: "",
      items: [{ id: `item-${i}`, productName: product.name, variantLabel: [variant.color, variant.size && `R${variant.size}`].filter(Boolean).join(" · "), unitPrice: product.price, quantity: 1, productId: product.id }],
    });
  }
  return orders;
}

const orders = buildOrders();

export const demoOrderRows = (): OrderRow[] => orders;
export const demoOrder = (id: string) => orders.find((o) => o.id === id) ?? null;
export const demoOrderIds = () => orders.map((o) => o.id);

// ---- Consultas a pedido ----


export function demoInquiries(): InquiryRow[] {
  const premium = demoProducts.find((p) => p.onRequest) ?? demoProducts[0];
  const rows: [number, string | null, string | null, string | null, InquiryStatus, string | null][] = [
    [0.1, "Negro, talle M", "Mido 1,76. La quiero para hacer rally en Córdoba. ¿Qué plazo de entrega tiene?", null, "NEW", null],
    [0.4, "Talle L", null, "lu.fernandez@ejemplo.com", "NEW", null],
    [1.5, "Negro", "¿Toman mi bici usada en parte de pago?", null, "CONTACTED", "Le pasé precio. Tiene una Venzo 2021 para entregar."],
    [4, "Talle M", "Busco algo para enduro liviano.", "diegor@ejemplo.com", "RESERVED", "Señó $500.000 por transferencia. Llega en 3 semanas."],
    [9, "Talle S", null, null, "WON", "Entregada el sábado."],
    [14, null, "¿Viene en otro color?", null, "LOST", "Quería en azul, no hay."],
  ];
  return rows.map(([days, preference, message, email, status, adminNotes], i) => ({
    id: `demo-consulta-${i}`,
    createdAt: new Date(demoNow - days * 864e5).toISOString(),
    productId: premium.id,
    productName: premium.name,
    productSlug: premium.slug,
    preference,
    name: names[(i * 3 + 2) % names.length],
    phone: `11${45000000 + i * 131313}`,
    email,
    message,
    status,
    adminNotes,
  }));
}

// ---- Turnos del taller ----


export function demoAppointments(todayKey: string, addDays: (key: string, n: number) => string, weekday: (key: string) => number): AppointmentRow[] {
  const r = rng(11);
  const services = ["service-general", "service-full", "tubelizado", "liquido-tubeless", "centrado", "lavado", "purgado"];
  const bikes = ["Zion Aspro R29", "SPY Ridder R26", "Venzo Raptor", "Trek Marlin 5", "Specialized Rockhopper", null];
  const rows: AppointmentRow[] = [];
  for (let d = -6; d <= 12; d++) {
    const date = addDays(todayKey, d);
    if (weekday(date) === 0) continue;
    const count = Math.floor(r() * 4);
    for (let k = 0; k < count; k++) {
      const hour = 8 + Math.floor(r() * (weekday(date) === 6 ? 4 : 8));
      const status: AppointmentStatus = d < 0 ? (r() < 0.85 ? "DONE" : "CANCELLED") : d === 0 && k === 0 ? "CONFIRMED" : r() < 0.5 ? "PENDING" : "CONFIRMED";
      const picked = [services[Math.floor(r() * services.length)]];
      if (r() < 0.3) picked.push(services[Math.floor(r() * services.length)]);
      rows.push({
        id: `demo-turno-${rows.length}`,
        date,
        time: `${String(hour).padStart(2, "0")}:${r() < 0.5 ? "00" : "30"}`,
        services: [...new Set(picked)],
        name: names[(rows.length * 5 + 1) % names.length],
        phone: `11${46000000 + rows.length * 70707}`,
        email: null,
        bike: bikes[Math.floor(r() * bikes.length)],
        notes: rows.length % 4 === 1 ? "El freno trasero hace ruido." : null,
        status,
        adminNotes: null,
        createdAt: new Date(demoNow - (6 - d) * 864e5).toISOString(),
      });
    }
  }
  return rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

// ---- Promociones ----

export function demoPromos(): PromoForm[] {
  return samplePromos.map((p) => ({
    id: p.id,
    title: p.title,
    text: p.text ?? "",
    tag: p.tag ?? "",
    href: p.href ?? "",
    cta: p.cta ?? "",
    image: "",
    startsOn: p.from ?? "",
    endsOn: p.until ?? "",
    placements: p.placements,
    categories: p.categories ?? [],
    products: p.products ?? [],
    priority: p.priority ?? 0,
    active: true,
  }));
}

export function demoPromoTargets() {
  return {
    products: demoProducts.map((p) => ({ slug: p.slug, name: p.name, active: p.active })),
    categories: demoCategories.map((c) => {
      const parent = demoCategories.find((x) => x.id === c.parentId);
      return { slug: c.slug, name: parent ? `${parent.name} › ${c.name}` : c.name };
    }),
  };
}

// ---- Estadísticas (simuladas) ----

export function demoStats(days: number): StatsData {
  const r = rng(days * 31 + 5);
  const today = new Date(demoNow).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  const keyAt = (offset: number) => new Date(Date.parse(`${today}T12:00:00Z`) + offset * 864e5).toISOString().slice(0, 10);
  const dayPoint = (offset: number) => {
    const date = keyAt(offset);
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    const trend = 1 + (offset + 120) / 400;
    const visitors = Math.round((150 + (dow === 0 || dow === 6 ? 60 : 0) + r() * 70) * trend);
    const orders = Math.round(visitors * (0.006 + r() * 0.012));
    const paid = Math.max(0, orders - (r() < 0.3 ? 1 : 0));
    return { date, visitors, views: Math.round(visitors * (2.8 + r() * 1.2)), orders, revenue: paid * Math.round((380_000 + r() * 420_000) * 100), paid };
  };
  const current = Array.from({ length: days }, (_, i) => dayPoint(i - days + 1));
  const prev = Array.from({ length: days }, (_, i) => dayPoint(i - 2 * days + 1));
  const sum = (list: typeof current, k: "visitors" | "views" | "orders" | "revenue" | "paid") => list.reduce((s, d) => s + d[k], 0);
  const totals = (list: typeof current) => ({
    visitors: sum(list, "visitors"),
    views: sum(list, "views"),
    orders: sum(list, "orders"),
    paidOrders: sum(list, "paid"),
    revenue: sum(list, "revenue"),
    bookings: Math.round(list.length * 1.6),
    inquiries: Math.round(list.length * 0.4),
  });
  const t = totals(current);
  const productViews = Math.round(t.visitors * 0.62);
  const carts = Math.round(t.visitors * 0.07);
  return {
    days,
    from: current[0].date,
    to: current[current.length - 1].date,
    series: current.map(({ paid: _paid, ...d }) => d),
    totals: t,
    previous: totals(prev),
    funnel: [
      { label: "Entraron a la tienda", value: t.visitors },
      { label: "Vieron un producto", value: productViews },
      { label: "Agregaron al carrito", value: carts },
      { label: "Llegaron al checkout", value: Math.round(carts * 0.55) },
      { label: "Hicieron el pedido", value: t.orders },
      { label: "Pagaron", value: t.paidOrders },
    ],
    sources: [
      ["Instagram", 0.34], ["Google", 0.29], ["Directo (escribieron la dirección o un link guardado)", 0.2], ["WhatsApp", 0.1], ["Facebook", 0.04], ["Mercado Libre", 0.03],
    ].map(([name, share]) => ({ name: name as string, visits: Math.round(t.visitors * 0.72 * (share as number)) })),
    devices: [
      { device: "mobile", visitors: Math.round(t.visitors * 0.71) },
      { device: "desktop", visitors: Math.round(t.visitors * 0.25) },
      { device: "tablet", visitors: Math.round(t.visitors * 0.04) },
    ],
    products: demoProducts
      .map((p, i) => ({ slug: p.slug, name: p.name, views: Math.round(productViews * [0.31, 0.24, 0.18, 0.15, 0.12][i % 5]), carts: Math.round(carts * [0.3, 0.26, 0.2, 0.16, 0.08][i % 5]), sold: p.onRequest ? 0 : Math.round(t.paidOrders * [0.35, 0.28, 0.2, 0.17, 0][i % 5]) }))
      .sort((a, b) => b.views - a.views),
    pages: [
      ["/", 0.3], ["/categoria/bicicletas", 0.19], [`/producto/${demoProducts[0].slug}`, 0.08], ["/taller", 0.07], ["/ofertas", 0.06], ["/guia-de-talles", 0.05], ["/carrito", 0.04], ["/contacto", 0.03],
    ].map(([path, share]) => ({ path: path as string, views: Math.round(t.views * (share as number)), label: demoProducts.find((d) => `/producto/${d.slug}` === path)?.name })),
  };
}

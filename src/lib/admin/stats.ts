import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { addDays, todayKey } from "@/lib/workshop";
import { sourceLabel, type DayPoint, type StatsData, type Totals } from "@/lib/admin/stats-types";

const tz = "America/Argentina/Buenos_Aires";
// Día argentino de una columna de fecha (Prisma la guarda en UTC sin zona)
const day = (col: string) => Prisma.raw(`to_char(("${col}" AT TIME ZONE 'UTC') AT TIME ZONE '${tz}', 'YYYY-MM-DD')`);
/** Inicio de un día argentino, en UTC */
const startOf = (key: string) => new Date(`${key}T00:00:00-03:00`);

const n = (v: unknown) => Number(v ?? 0);

async function totalsBetween(from: Date, to: Date): Promise<Totals> {
  const [visits] = await db.$queryRaw<{ visitors: bigint; views: bigint }[]>`
    SELECT COALESCE(SUM(v), 0) AS visitors, COALESCE(SUM(c), 0) AS views FROM (
      SELECT COUNT(DISTINCT visitor) AS v, COUNT(*) AS c FROM "AnalyticsEvent"
      WHERE type = 'view' AND "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY ${day("createdAt")}
    ) d`;
  const [orders, paid, bookings, inquiries] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: from, lt: to } } }),
    db.order.aggregate({ where: { paidAt: { gte: from, lt: to }, status: { not: "CANCELLED" } }, _count: true, _sum: { total: true } }),
    db.appointment.count({ where: { createdAt: { gte: from, lt: to } } }),
    db.inquiry.count({ where: { createdAt: { gte: from, lt: to } } }),
  ]);
  return {
    visitors: n(visits?.visitors),
    views: n(visits?.views),
    orders,
    paidOrders: paid._count,
    revenue: paid._sum.total ?? 0,
    bookings,
    inquiries,
  };
}

const anonymous = "(anonimizado)";

/**
 * Lo que promete la política de privacidad: las estadísticas se borran a los 13 meses y los datos
 * personales de turnos y consultas se anonimizan a los 2 años. Corre al abrir el tablero.
 */
async function purgeOldData() {
  const twoYears = new Date(Date.now() - 730 * 864e5);
  await Promise.all([
    db.analyticsEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 400 * 864e5) } } }),
    db.appointment.updateMany({
      where: { date: { lt: twoYears.toISOString().slice(0, 10) }, NOT: { name: anonymous } },
      data: { name: anonymous, phone: "", email: null, bike: null, notes: null, adminNotes: null },
    }),
    db.inquiry.updateMany({
      where: { createdAt: { lt: twoYears }, NOT: { name: anonymous } },
      data: { name: anonymous, phone: "", email: null, message: null, adminNotes: null },
    }),
  ]);
}

/** Todo el tablero para los últimos `days` días (hoy incluido), comparado con el período anterior */
export async function getStats(days: number): Promise<StatsData> {
  const today = todayKey();
  const firstDay = addDays(today, -(days - 1));
  const from = startOf(firstDay);
  const to = startOf(addDays(today, 1));
  const prevFrom = startOf(addDays(firstDay, -days));

  await purgeOldData();

  const [totals, previous, dailyVisits, dailyOrders, dailyRevenue, funnelRows, sources, devices, productViews, carts, sold, pages] = await Promise.all([
    totalsBetween(from, to),
    totalsBetween(prevFrom, from),
    db.$queryRaw<{ d: string; visitors: bigint; views: bigint }[]>`
      SELECT ${day("createdAt")} AS d, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views
      FROM "AnalyticsEvent" WHERE type = 'view' AND "createdAt" >= ${from} AND "createdAt" < ${to} GROUP BY 1`,
    db.$queryRaw<{ d: string; c: bigint }[]>`
      SELECT ${day("createdAt")} AS d, COUNT(*) AS c FROM "Order" WHERE "createdAt" >= ${from} AND "createdAt" < ${to} GROUP BY 1`,
    db.$queryRaw<{ d: string; s: bigint }[]>`
      SELECT ${day("paidAt")} AS d, SUM(total) AS s FROM "Order"
      WHERE "paidAt" >= ${from} AND "paidAt" < ${to} AND status <> 'CANCELLED' GROUP BY 1`,
    // Embudo: personas distintas por día que llegaron a cada paso, sumadas
    db.$queryRaw<{ step: string; c: bigint }[]>`
      SELECT step, SUM(c) AS c FROM (
        SELECT CASE WHEN type = 'view' AND path LIKE '/producto/%' THEN 'product'
                    WHEN type = 'view' AND path = '/checkout' THEN 'checkout'
                    ELSE type END AS step,
               ${day("createdAt")} AS d, COUNT(DISTINCT visitor) AS c
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${from} AND "createdAt" < ${to} AND type IN ('view', 'cart')
        GROUP BY 1, 2
      ) x GROUP BY step`,
    db.$queryRaw<{ source: string; c: bigint }[]>`
      SELECT source, COUNT(*) AS c FROM "AnalyticsEvent"
      WHERE type = 'view' AND source IS NOT NULL AND "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 30`,
    db.$queryRaw<{ device: string; c: bigint }[]>`
      SELECT device, SUM(c) AS c FROM (
        SELECT device, ${day("createdAt")} AS d, COUNT(DISTINCT visitor) AS c FROM "AnalyticsEvent"
        WHERE type = 'view' AND device IS NOT NULL AND "createdAt" >= ${from} AND "createdAt" < ${to} GROUP BY 1, 2
      ) x GROUP BY device`,
    db.$queryRaw<{ slug: string; c: bigint }[]>`
      SELECT substring(path from 11) AS slug, COUNT(*) AS c FROM "AnalyticsEvent"
      WHERE type = 'view' AND path LIKE '/producto/%' AND "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 15`,
    db.$queryRaw<{ productId: string; c: bigint }[]>`
      SELECT "productId", COUNT(*) AS c FROM "AnalyticsEvent"
      WHERE type = 'cart' AND "productId" IS NOT NULL AND "createdAt" >= ${from} AND "createdAt" < ${to} GROUP BY 1`,
    db.$queryRaw<{ productId: string; c: bigint }[]>`
      SELECT v."productId", SUM(i.quantity) AS c FROM "OrderItem" i
      JOIN "Order" o ON o.id = i."orderId" JOIN "Variant" v ON v.id = i."variantId"
      WHERE o."paidAt" >= ${from} AND o."paidAt" < ${to} AND o.status <> 'CANCELLED' GROUP BY 1`,
    db.$queryRaw<{ path: string; c: bigint }[]>`
      SELECT path, COUNT(*) AS c FROM "AnalyticsEvent"
      WHERE type = 'view' AND path IS NOT NULL AND "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
  ]);

  const series: DayPoint[] = Array.from({ length: days }, (_, i) => {
    const date = addDays(firstDay, i);
    const v = dailyVisits.find((r) => r.d === date);
    return {
      date,
      visitors: n(v?.visitors),
      views: n(v?.views),
      orders: n(dailyOrders.find((r) => r.d === date)?.c),
      revenue: n(dailyRevenue.find((r) => r.d === date)?.s),
    };
  });

  const step = (k: string) => n(funnelRows.find((r) => r.step === k)?.c);
  const funnel = [
    { label: "Entraron a la tienda", value: totals.visitors },
    { label: "Vieron un producto", value: step("product") },
    { label: "Agregaron al carrito", value: step("cart") },
    { label: "Llegaron al checkout", value: step("checkout") },
    { label: "Hicieron el pedido", value: totals.orders },
    { label: "Pagaron", value: totals.paidOrders },
  ];

  // Productos: los más vistos, con carritos y ventas
  const ids = [...new Set([...carts.map((c) => c.productId), ...sold.map((s) => s.productId)])];
  const pageSlugs = pages.filter((p) => p.path.startsWith("/producto/")).map((p) => p.path.slice(10));
  const catalog = await db.product.findMany({
    where: { OR: [{ slug: { in: [...productViews.map((p) => p.slug), ...pageSlugs] } }, { id: { in: ids } }] },
    select: { id: true, slug: true, name: true },
  });
  const products = catalog
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      views: n(productViews.find((v) => v.slug === p.slug)?.c),
      carts: n(carts.find((c) => c.productId === p.id)?.c),
      sold: n(sold.find((s) => s.productId === p.id)?.c),
    }))
    .filter((p) => p.views || p.carts || p.sold)
    .sort((a, b) => b.views - a.views || b.sold - a.sold)
    .slice(0, 10);

  // Fuentes agrupadas por nombre (google.com.ar y google.com son Google)
  const grouped = new Map<string, number>();
  for (const s of sources) grouped.set(sourceLabel(s.source), (grouped.get(sourceLabel(s.source)) ?? 0) + n(s.c));

  return {
    days,
    from: firstDay,
    to: today,
    series,
    totals,
    previous,
    funnel,
    sources: [...grouped].map(([name, visits]) => ({ name, visits })).sort((a, b) => b.visits - a.visits),
    devices: (["mobile", "desktop", "tablet"] as const).map((device) => ({ device, visitors: n(devices.find((d) => d.device === device)?.c) })),
    products,
    pages: pages.map((p) => ({ path: p.path, views: n(p.c), label: catalog.find((c) => `/producto/${c.slug}` === p.path)?.name })),
  };
}

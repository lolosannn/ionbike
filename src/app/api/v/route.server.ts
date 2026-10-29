import { NextResponse, type NextRequest } from "next/server";
import { sourceFrom, track } from "@/lib/analytics";
import { allowed } from "@/lib/rate-limit";
import { db } from "@/lib/db";

// Visitas que manda el navegador (componente Analytics) y productos agregados al carrito
export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length") ?? 0) > 2000) return new NextResponse(null, { status: 413 });
  if (!(await allowed("stats"))) return new NextResponse(null, { status: 204 });
  let body: { t?: unknown; p?: unknown; r?: unknown; u?: unknown; s?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const path = typeof body.p === "string" && body.p.startsWith("/") && !body.p.startsWith("//") ? body.p.split("?")[0].slice(0, 300) : null;
  if (!path || path.startsWith("/admin")) return new NextResponse(null, { status: 204 });

  if (body.t === "view") {
    const source = sourceFrom(typeof body.r === "string" ? body.r : null, typeof body.u === "string" ? body.u : null, req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
    await track("view", { path, source });
  } else if (body.t === "cart" && typeof body.s === "string" && body.s.length <= 160) {
    const product = await db.product.findUnique({ where: { slug: body.s }, select: { id: true } });
    if (product) await track("cart", { path, productId: product.id });
  }
  return new NextResponse(null, { status: 204 });
}

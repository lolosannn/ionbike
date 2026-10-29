import "server-only";
import { db } from "@/lib/db";

export type ActivityRow = { id: string; createdAt: string; user: string | null; action: string; target: string | null; detail: string | null; ip: string | null };

/** Últimas acciones del panel (las más nuevas primero) */
export async function listActivity(limit = 300): Promise<ActivityRow[]> {
  const rows = await db.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: { user: { select: { name: true } } } });
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    user: r.user?.name ?? null,
    action: r.action,
    target: r.target,
    detail: r.detail ? JSON.stringify(r.detail).slice(0, 300) : null,
    ip: r.ip,
  }));
}

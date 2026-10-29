import "server-only";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/workshop";
import type { AdminCounts } from "@/components/admin/AdminNav";

/** Pendientes para los numeritos del menú */
export async function getAdminCounts(): Promise<AdminCounts> {
  const [pedidos, consultas, turnos] = await Promise.all([
    db.order.count({ where: { status: "PAID" } }),
    db.inquiry.count({ where: { status: "NEW" } }),
    db.appointment.count({ where: { status: "PENDING", date: { gte: todayKey() } } }),
  ]);
  return { pedidos, consultas, turnos };
}

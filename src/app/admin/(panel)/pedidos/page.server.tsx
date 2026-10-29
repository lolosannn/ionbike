import { requireAdmin } from "@/lib/admin/session";
import { listOrders } from "@/lib/admin/orders";
import { OrdersTable } from "@/components/admin/OrdersTable";

export const metadata = { title: "Pedidos" };

export default async function OrdersPage() {
  await requireAdmin();
  return <OrdersTable rows={await listOrders()} now={Date.now()} />;
}

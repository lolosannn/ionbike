import { OrdersTable } from "@/components/admin/OrdersTable";
import { demoNow, demoOrderRows } from "@/lib/admin/demo-data";

export const metadata = { title: "Pedidos" };

export default function OrdersPreview() {
  return <OrdersTable rows={demoOrderRows()} now={demoNow} />;
}

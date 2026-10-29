import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { getOrderDetail } from "@/lib/admin/orders";
import { OrderView } from "@/components/admin/OrderView";
import { orderNotesAction, orderStatusAction } from "../../../actions";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Pedido" };

export default async function OrderPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = id.length <= 40 ? await getOrderDetail(id) : null;
  if (!order) notFound();
  return <OrderView order={order} now={Date.now()} changeStatus={orderStatusAction} saveNotes={orderNotesAction} />;
}

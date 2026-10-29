import { notFound } from "next/navigation";
import { OrderView } from "@/components/admin/OrderView";
import { demoNow, demoOrder, demoOrderIds } from "@/lib/admin/demo-data";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Pedido" };

export function generateStaticParams() {
  return demoOrderIds().map((id) => ({ id }));
}

export default async function OrderPreview({ params }: Props) {
  const order = demoOrder((await params).id);
  if (!order) notFound();
  return <OrderView order={order} now={demoNow} />;
}

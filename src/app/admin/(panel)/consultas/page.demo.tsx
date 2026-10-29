import { InquiriesBoard } from "@/components/admin/InquiriesBoard";
import { demoInquiries, demoNow } from "@/lib/admin/demo-data";

export const metadata = { title: "Consultas a pedido" };

export default function InquiriesPreview() {
  return <InquiriesBoard rows={demoInquiries()} now={demoNow} />;
}

import { requireAdmin } from "@/lib/admin/session";
import { listInquiries } from "@/lib/admin/inquiries";
import { InquiriesBoard } from "@/components/admin/InquiriesBoard";
import { inquiryAction } from "../../actions";

export const metadata = { title: "Consultas a pedido" };

export default async function InquiriesPage() {
  await requireAdmin();
  return <InquiriesBoard rows={await listInquiries()} now={Date.now()} update={inquiryAction} />;
}

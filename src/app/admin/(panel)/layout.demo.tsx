import { AdminShell } from "@/components/admin/AdminShell";

export default function PanelPreviewLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell current="productos" adminName="Vista previa" demo>{children}</AdminShell>;
}

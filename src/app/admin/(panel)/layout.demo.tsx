import { AdminShell } from "@/components/admin/AdminShell";
import { demoAppointments, demoInquiries, demoNow, demoOrderRows } from "@/lib/admin/demo-data";
import { addDays, todayKey, weekday } from "@/lib/workshop";

export default function PanelPreviewLayout({ children }: { children: React.ReactNode }) {
  const today = todayKey(new Date(demoNow));
  const counts = {
    pedidos: demoOrderRows().filter((o) => o.status === "PAID").length,
    consultas: demoInquiries().filter((i) => i.status === "NEW").length,
    turnos: demoAppointments(today, addDays, weekday).filter((a) => a.status === "PENDING" && a.date >= today).length,
  };
  return <AdminShell counts={counts} adminName="Vista previa" demo>{children}</AdminShell>;
}

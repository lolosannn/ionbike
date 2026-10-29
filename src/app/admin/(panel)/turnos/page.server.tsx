import { requireAdmin } from "@/lib/admin/session";
import { listAppointments } from "@/lib/admin/appointments";
import { todayKey } from "@/lib/workshop";
import { AppointmentsAgenda } from "@/components/admin/AppointmentsAgenda";
import { appointmentAction, createAppointmentAction } from "../../actions";

export const metadata = { title: "Turnos del taller" };

export default async function AppointmentsPage() {
  await requireAdmin();
  return <AppointmentsAgenda rows={await listAppointments()} today={todayKey()} update={appointmentAction} create={createAppointmentAction} />;
}

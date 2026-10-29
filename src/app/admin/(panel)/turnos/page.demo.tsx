import { AppointmentsAgenda } from "@/components/admin/AppointmentsAgenda";
import { demoAppointments, demoNow } from "@/lib/admin/demo-data";
import { addDays, todayKey, weekday } from "@/lib/workshop";

export const metadata = { title: "Turnos del taller" };

export default function AppointmentsPreview() {
  const today = todayKey(new Date(demoNow));
  return <AppointmentsAgenda rows={demoAppointments(today, addDays, weekday)} today={today} />;
}

import { takenSlots } from "@/lib/appointments";
import { TallerContent } from "./TallerContent";
import { bookAppointment } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Taller: sacá turno",
  description: "Service, tubeless, centrado de ruedas, lavado y purgado de frenos. Sacá turno online en Monte Grande.",
};

export default async function TallerPage() {
  return <TallerContent taken={await takenSlots()} action={bookAppointment} />;
}

import { TallerContent } from "./TallerContent";

export const metadata = {
  title: "Taller: sacá turno",
  description: "Service, tubeless, centrado de ruedas, lavado y purgado de frenos. Sacá turno online en Monte Grande.",
};

// Vista previa estática: la agenda arranca vacía y la reserva se simula
export default function TallerPage() {
  return <TallerContent taken={{}} />;
}

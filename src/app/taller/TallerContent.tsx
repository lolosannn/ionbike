import Link from "next/link";
import { whatsappUrl } from "@/config/store";
import { WhatsappIcon } from "@/components/icons";
import { WorkshopBooking, type BookingState } from "./WorkshopBooking";

type Props = {
  taken: Record<string, number>;
  action?: (prev: BookingState, form: FormData) => Promise<BookingState>;
};

export function TallerContent({ taken, action }: Props) {
  return (
    <div className="container">
      <div className="page-head">
        <nav aria-label="Ruta de navegación" className="breadcrumb">
          <Link href="/">Inicio</Link> / <span style={{ color: "var(--text)" }}>Taller</span>
        </nav>
        <h1 className="display">Taller</h1>
        <p className="muted" style={{ maxWidth: 640 }}>
          Sacá turno online para dejar tu bici: elegí el servicio, el día y el horario, y nosotros nos encargamos.
          ¿Dudas? <a href={whatsappUrl("Hola! Tengo una consulta sobre el taller")} target="_blank" rel="noreferrer">
            <WhatsappIcon size={16} /> Escribinos
          </a>.
        </p>
      </div>
      <WorkshopBooking taken={taken} action={action} />
    </div>
  );
}

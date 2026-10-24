import { store, whatsappUrl } from "@/config/store";
import { WhatsappIcon } from "@/components/icons";
import { StoreMap, directionsUrl } from "@/components/layout/StoreMap";

export const metadata = { title: "Contacto" };

export default function ContactPage() {
  return (
    <div className="container">
      <div className="page-head">
        <h1 className="display">Contacto</h1>
        <p className="muted" style={{ maxWidth: 560 }}>
          ¿Dudas con el talle, el envío o el pago? Escribinos y te respondemos a la brevedad.
        </p>
      </div>
      <div className="visit" style={{ marginTop: 28 }}>
        <div className="visit-copy">
          <a className="btn btn-whatsapp" href={whatsappUrl()} target="_blank" rel="noreferrer" style={{ alignSelf: "flex-start" }}>
            <WhatsappIcon size={20} /> Escribinos por WhatsApp
          </a>
          <div>
            <div><a href={`tel:${store.phone.replace(/[^+\d]/g, "")}`}>{store.phone}</a></div>
            <div><a href={`mailto:${store.email}`}>{store.email}</a></div>
          </div>
          <div>
            <div>{store.address}</div>
            <div className="muted">Horarios: {store.hours}</div>
            <a href={directionsUrl} target="_blank" rel="noreferrer">Cómo llegar →</a>
          </div>
        </div>
        <StoreMap />
      </div>
    </div>
  );
}

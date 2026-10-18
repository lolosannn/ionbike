import { store } from "@/config/store";
import { PinIcon, WhatsappIcon } from "@/components/icons";

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
          <a className="btn btn-whatsapp" href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer" style={{ alignSelf: "flex-start" }}>
            <WhatsappIcon size={20} /> Escribinos por WhatsApp
          </a>
          <div>
            <div><a href={`tel:${store.phone.replace(/[^+\d]/g, "")}`}>{store.phone}</a></div>
            <div><a href={`mailto:${store.email}`}>{store.email}</a></div>
          </div>
          <div>
            <div>{store.address}</div>
            <div className="muted">Horarios: {store.hours}</div>
          </div>
        </div>
        <div className="visit-map ph ph-dark"><PinIcon size={40} /><span>Mapa del local</span></div>
      </div>
    </div>
  );
}

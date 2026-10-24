import { about, store, whatsappUrl } from "@/config/store";
import { BikeIcon, WhatsappIcon } from "@/components/icons";
import { publicImage } from "@/lib/public-files";
import { StoreMap, directionsUrl } from "@/components/layout/StoreMap";

export const metadata = {
  title: "Contacto y quiénes somos",
  description: "Escribinos por WhatsApp o vení al local en Monte Grande. Conocé quiénes somos.",
};

const photos = about.photoSlots.map((label, i) => ({ label, src: publicImage("nosotros", String(i + 1)) }));

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

      <section id="quienes-somos" className="section about">
        <div className="about-copy">
          <span className="eyebrow">Quiénes somos</span>
          <h2 className="display">{about.title}</h2>
          {about.paragraphs.map((p) => <p key={p}>{p}</p>)}
          <ul className="about-highlights">
            {about.highlights.map((h) => (
              <li key={h.title}><strong>{h.title}</strong><span>{h.text}</span></li>
            ))}
          </ul>
        </div>
        <div className="about-gallery">
          {photos.map((ph, i) => (
            <figure key={i} className="about-photo">
              {ph.src
                ? <img src={ph.src} alt={ph.label} loading="lazy" />
                : <div className="ph ph-dark"><BikeIcon size={48} /><span>{ph.label}</span></div>}
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}

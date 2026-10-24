import { about, store, whatsappUrl } from "@/config/store";
import Link from "next/link";
import { ArrowIcon, BikeIcon, ClockIcon, MailIcon, PhoneIcon, PinIcon, PlayIcon, RulerIcon, ShieldIcon, StarIcon, TruckIcon, WhatsappIcon, WrenchIcon } from "@/components/icons";
import { publicFile, publicImage } from "@/lib/public-files";
import { AutoplayVideo } from "@/components/media/AutoplayVideo";
import { StoreMap, directionsUrl } from "@/components/layout/StoreMap";

export const metadata = {
  title: "Contacto y quiénes somos",
  description: "Escribinos por WhatsApp o vení al local en Monte Grande. Conocé quiénes somos.",
};

const highlightIcons: Record<string, React.ReactNode> = {
  taller: <WrenchIcon size={26} />,
  asesoramiento: <StarIcon size={26} />,
  envios: <TruckIcon size={28} />,
};

const contactCards = [
  { icon: <PhoneIcon />, label: "Teléfono", value: store.phone, action: "Llamanos", href: `tel:${store.phone.replace(/[^+\d]/g, "")}` },
  { icon: <MailIcon size={24} />, label: "Email", value: store.email, action: "Escribinos", href: `mailto:${store.email}` },
  { icon: <PinIcon />, label: "Dirección", value: store.address, action: "Cómo llegar", href: directionsUrl, external: true },
  { icon: <ClockIcon size={24} />, label: "Horarios", value: store.hours, action: "Consultá por feriados", href: whatsappUrl("Hola! ¿Abren en el feriado?"), external: true },
];

const photos = about.photos.map((alt, i) => ({ alt, src: publicImage("nosotros", String(i + 1)) }));
const video = publicFile("nosotros", "local", ["mp4", "webm"]);
const videoPoster = publicFile("nosotros", "local", ["jpg", "webp"]) ?? undefined;

export default function ContactPage() {
  return (
    <div className="container">
      <div className="page-head contact-head">
        <span className="eyebrow">Estamos para ayudarte</span>
        <h1 className="display">Contacto</h1>
        <p>¿Dudas con el talle, el envío, el pago o el taller? Escribinos y te asesoramos para que elijas bien.</p>
      </div>

      <a className="contact-wa" href={whatsappUrl("Hola! Tengo una consulta")} target="_blank" rel="noreferrer">
        <span className="contact-wa-icon"><WhatsappIcon size={40} /></span>
        <span className="contact-wa-text">
          <strong>Escribinos por WhatsApp</strong>
          <span>Es la forma más rápida: consultas, stock, talles y turnos del taller.</span>
        </span>
        <span className="contact-wa-cta">{store.phone} <ArrowIcon /></span>
      </a>

      <div className="contact-cards">
        {contactCards.map((c) => (
          <a key={c.label} className="contact-card" href={c.href} {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}>
            <span className="contact-card-icon">{c.icon}</span>
            <span className="contact-card-label">{c.label}</span>
            <strong>{c.value}</strong>
            <span className="contact-card-action">{c.action} <ArrowIcon size={16} /></span>
          </a>
        ))}
      </div>

      <div className="contact-map">
        <StoreMap />
        <div className="contact-map-card">
          <PinIcon size={22} />
          <span>
            <strong>{store.address}</strong>
            <span>Retirá tu compra sin cargo o vení a probar la bici.</span>
          </span>
        </div>
      </div>

      <div className="contact-quick">
        <Link href="/taller" className="contact-quick-link"><WrenchIcon size={22} /> Sacá turno en el taller <ArrowIcon size={16} /></Link>
        <Link href="/guia-de-talles" className="contact-quick-link"><RulerIcon size={22} /> ¿Qué talle me va? <ArrowIcon size={16} /></Link>
        <Link href="/arrepentimiento" className="contact-quick-link"><ShieldIcon size={22} /> Botón de arrepentimiento <ArrowIcon size={16} /></Link>
      </div>

      <section id="quienes-somos" className="section about">
        <div className="about-copy">
          <span className="eyebrow">Quiénes somos</span>
          <h2 className="display">{about.title}</h2>
          {about.paragraphs.map((p) => <p key={p}>{p}</p>)}
          <ul className="about-highlights">
            {about.highlights.map((h) => (
              <li key={h.title}>
                <span className="about-highlight-icon">{highlightIcons[h.icon]}</span>
                <span><strong>{h.title}</strong><span>{h.text}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="about-video">
          {video ? (
            <AutoplayVideo src={video} poster={videoPoster} controls aria-label="Recorrida por el local" />
          ) : (
            <div className="ph ph-dark"><PlayIcon size={56} /><span>Video del local</span></div>
          )}
        </div>

        <div className="about-gallery">
          {photos.map((ph) => (
            <figure key={ph.alt} className="about-photo">
              {ph.src
                ? <img src={ph.src} alt={ph.alt} loading="lazy" />
                : <div className="ph ph-dark"><BikeIcon size={48} /><span>{ph.alt}</span></div>}
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}

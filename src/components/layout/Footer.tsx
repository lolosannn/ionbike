import Link from "next/link";
import { nav, store, whatsappUrl } from "@/config/store";
import { directionsUrl } from "@/components/layout/StoreMap";
import { ClockIcon, FacebookIcon, InstagramIcon, MailIcon, PinIcon, StarIcon, TiktokIcon, WhatsappIcon } from "@/components/icons";
import logo from "@/assets/logo-ion.png";

const links = [
  ...nav.filter((n) => n.href !== "/" && n.href !== "/contacto"),
  { label: "Quiénes somos", href: "/contacto#quienes-somos" },
  { label: "Contacto", href: "/contacto" },
  { label: "Botón de arrepentimiento", href: "/arrepentimiento" },
];

export function Footer() {
  return (
    <footer className="footer">
      <nav className="footer-links" aria-label="Pie de página">
        <div className="container">
          {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        </div>
      </nav>

      <div className="container footer-main">
        <div className="footer-col">
          <img src={logo.src} width={logo.width} height={logo.height} alt={store.name} className="footer-logo" />
          <p className="muted">Bicicletas, repuestos, accesorios y taller en Monte Grande.</p>
          <a href={store.googleReviewsUrl} className="footer-review" target="_blank" rel="noreferrer">
            <StarIcon /> Dejanos tu reseña en Google
          </a>
        </div>

        <div className="footer-col">
          <h2>Contacto</h2>
          <ul className="footer-contact">
            <li><WhatsappIcon size={20} /><a href={whatsappUrl()} target="_blank" rel="noreferrer">{store.phone}</a></li>
            <li><MailIcon /><a href={`mailto:${store.email}`}>{store.email}</a></li>
            <li><PinIcon size={20} /><a href={directionsUrl} target="_blank" rel="noreferrer">{store.address}</a></li>
            <li><ClockIcon /><span>{store.hours}</span></li>
          </ul>
        </div>

        <div className="footer-col">
          <h2>Suscribite para recibir novedades</h2>
          {/* TODO: conectar con la herramienta de email marketing */}
          <form className="newsletter" action="#">
            <label htmlFor="news" className="sr-only">Tu email</label>
            <input id="news" name="email" type="email" placeholder="Tu email" required />
            <button type="submit">Enviar</button>
          </form>
          <div className="social">
            <a href={store.social.instagram} aria-label="Instagram"><InstagramIcon /></a>
            <a href={store.social.facebook} aria-label="Facebook"><FacebookIcon /></a>
            <a href={store.social.tiktok} aria-label="TikTok"><TiktokIcon /></a>
          </div>
        </div>
      </div>

      <div className="container footer-pay">
        <div>
          <h2>Medios de pago</h2>
          <div className="pay-chips">
            {store.paymentBrands.map((p) => <span key={p}>{p}</span>)}
          </div>
        </div>
        <div>
          <h2>Envíos</h2>
          <span>Andreani a todo el país · Retiro en el local</span>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} {store.name}. Todos los derechos reservados.</span>
          <nav aria-label="Legales">
            <Link href="/terminos">Términos y condiciones</Link>
            <Link href="/privacidad">Política de privacidad</Link>
            <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noreferrer">
              Defensa del consumidor
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

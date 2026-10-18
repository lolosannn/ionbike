import Link from "next/link";
import { nav, store } from "@/config/store";
import { FacebookIcon, InstagramIcon, TiktokIcon } from "@/components/icons";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div className="footer-col wide">
          <p className="newsletter-title">NO TE PIERDAS<br />LAS PROMOS</p>
          <label htmlFor="news">Dejanos tu email y te avisamos de ofertas y novedades.</label>
          {/* TODO: conectar con la herramienta de email marketing */}
          <form className="newsletter" action="#">
            <input id="news" name="email" type="email" placeholder="tu@email.com" required />
            <button type="submit">Suscribirme</button>
          </form>
        </div>
        <div className="footer-col">
          <h2>Tienda</h2>
          <nav aria-label="Pie de página">
            {nav.filter((n) => n.href !== "/").map((n) => (
              <Link key={n.href} href={n.href}>{n.label}</Link>
            ))}
          </nav>
        </div>
        <div className="footer-col">
          <h2>Contacto</h2>
          <a href={`tel:${store.phone.replace(/[^+\d]/g, "")}`}>{store.phone}</a>
          <a href={`mailto:${store.email}`}>{store.email}</a>
          <span>{store.address}</span>
          <div className="social">
            <a href={store.social.instagram} aria-label="Instagram"><InstagramIcon /></a>
            <a href={store.social.facebook} aria-label="Facebook"><FacebookIcon /></a>
            <a href={store.social.tiktok} aria-label="TikTok"><TiktokIcon /></a>
          </div>
        </div>
        <div className="footer-col wide">
          <h2>Medios de pago</h2>
          <div className="pay-chips">
            {store.paymentBrands.map((p) => <span key={p}>{p}</span>)}
          </div>
          <h2 style={{ marginTop: 8 }}>Envíos</h2>
          <span>Andreani a todo el país · Retiro en el local</span>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} {store.name}. Todos los derechos reservados.</span>
          <nav aria-label="Legales">
            <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noreferrer">
              Defensa del consumidor
            </a>
            <Link href="/arrepentimiento">Botón de arrepentimiento</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

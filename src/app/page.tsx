import Link from "next/link";
import { getDisciplines, getFeaturedProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import { store } from "@/config/store";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowIcon, BikeIcon, CardIcon, PercentIcon, PinIcon, TruckIcon, WhatsappIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const brands = ["Zion", "SPY", "Eurobike", "Gravity"];

const sections = [
  { name: "Repuestos", slug: "repuestos", desc: "Transmisión, frenos, cubiertas y todo para que tu bici siga rodando.", tone: "tile-light" },
  { name: "Accesorios", slug: "accesorios", desc: "Cascos, luces, candados, bolsos y más.", tone: "tile-dark" },
  { name: "Indumentaria", slug: "indumentaria", desc: "Ropa y calzado para salir a rodar cómodo.", tone: "tile-accent" },
];

export default async function HomePage() {
  const [disciplines, featured] = await Promise.all([getDisciplines(), getFeaturedProducts(4)]);

  const benefits = [
    { icon: <TruckIcon />, title: "Envío gratis", text: `A todo el país desde ${formatPrice(store.freeShippingFrom)}` },
    { icon: <CardIcon />, title: `${store.installments} cuotas sin interés`, text: "Con todas las tarjetas" },
    { icon: <PercentIcon />, title: `${store.transferDiscountPct}% off`, text: "Pagando con transferencia" },
    { icon: <PinIcon />, title: "Retiro en el local", text: "Gratis en Monte Grande" },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-slab" aria-hidden="true" />
        <div className="container">
          <div className="hero-copy">
            <span className="hero-kicker">OFERTA ESPECIAL</span>
            <h1 className="display">2 bicis.<br /><span>1 oportunidad.</span></h1>
            <p>
              Eurobike Dallas y Gravity Benz con <strong>20% de descuento</strong>. Envío gratis a todo el país o retiro en el local.
            </p>
            <div className="hero-actions">
              <Link href="/categoria/bicicletas" className="btn btn-primary">Ver ofertas <ArrowIcon /></Link>
              <Link href="/categoria/bicicletas" className="btn btn-outline">Todas las bicis</Link>
            </div>
          </div>
          <div className="hero-media">
            <div className="ph ph-dark">
              <BikeIcon size={96} />
              <span>Foto del banner</span>
            </div>
            <div className="hero-badge"><strong>20%</strong><span>OFF</span></div>
          </div>
        </div>
      </section>

      <section className="benefits" aria-label="Beneficios">
        <div className="container">
          {benefits.map((b) => (
            <div className="benefit" key={b.title}>
              <span className="benefit-icon">{b.icon}</span>
              <span><strong>{b.title}</strong><span>{b.text}</span></span>
            </div>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Elegí tu disciplina</span>
            <h2 className="display">¿Por dónde vas a rodar?</h2>
          </div>
          <Link href="/categoria/bicicletas">Ver todas las bicicletas →</Link>
        </div>
        <div className="disciplines">
          {disciplines.map((d) => (
            <Link key={d.id} href={`/categoria/${d.slug}`} className="discipline">
              <div className="ph ph-dark"><BikeIcon size={80} /></div>
              <div className="discipline-body">
                <div className="discipline-title">
                  <span>{d.name}</span>
                  <span className="arrow-dot"><ArrowIcon /></span>
                </div>
                {d.description && <p>{d.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Los que más salen</span>
              <h2 className="display">Más vendidos</h2>
            </div>
            <Link href="/categoria/bicicletas">Ver todo →</Link>
          </div>
          <div className="product-grid">
            {featured.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}

      <section className="section container">
        <div className="tiles">
          {sections.map((s) => (
            <Link key={s.slug} href={`/categoria/${s.slug}`} className={`tile ${s.tone}`}>
              <strong>{s.name}</strong>
              <p>{s.desc}</p>
              <span>Ver productos →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container" aria-label="Marcas">
        <span className="eyebrow brands-title">Marcas que trabajamos</span>
        <div className="brands">
          {brands.map((b) => <span key={b} className="brand-chip">{b}</span>)}
        </div>
      </section>

      <section className="section container">
        <div className="visit">
          <div className="visit-copy">
            <span className="eyebrow">Vení al local</span>
            <h2 className="display">Probala antes de llevarla</h2>
            <p>Comprá online y retirá sin cargo en nuestro local, o acercate a ver las bicis y te asesoramos con el talle.</p>
            <div>
              <div>{store.address}</div>
              <div className="muted">Horarios: {store.hours}</div>
            </div>
            <div className="hero-actions">
              <a href={`https://wa.me/${store.whatsapp}`} className="btn btn-whatsapp" target="_blank" rel="noreferrer">
                <WhatsappIcon size={20} /> Escribinos por WhatsApp
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                className="btn btn-outline"
                target="_blank"
                rel="noreferrer"
              >
                Cómo llegar
              </a>
            </div>
          </div>
          <div className="visit-map ph ph-dark"><PinIcon size={40} /><span>Mapa / foto del local</span></div>
        </div>
      </section>
    </>
  );
}

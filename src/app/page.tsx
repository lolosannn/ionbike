import Link from "next/link";
import { getDisciplines, getFeaturedProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import { about, store, whatsappUrl } from "@/config/store";
import { ProductCard } from "@/components/product/ProductCard";
import { StoreMap, directionsUrl } from "@/components/layout/StoreMap";
import { BrandMarquee } from "@/components/layout/BrandMarquee";
import { publicImage } from "@/lib/public-files";
import { ArrowIcon, BikeIcon, PlayIcon, CardIcon, PercentIcon, PinIcon, RulerIcon, TruckIcon, WhatsappIcon } from "@/components/icons";

const brands = ["Zion", "SPY", "Polygon", "Eurobike", "Gravity"];

const sections = [
  { name: "Repuestos", slug: "repuestos", desc: "Transmisión, frenos, cubiertas y todo para que tu bici siga rodando.", tone: "tile-light" },
  { name: "Accesorios", slug: "accesorios", desc: "Cascos, luces, candados, bolsos y más.", tone: "tile-dark" },
  { name: "Indumentaria", slug: "indumentaria", desc: "Ropa y calzado para salir a rodar cómodo.", tone: "tile-accent" },
];

// Foto de la sección "Vení al local": public/local/cliente.jpg (o .png / .webp)
const riderPhoto = publicImage("local", "cliente");

// Adelanto de "Quiénes somos": las primeras fotos de public/nosotros/
const aboutPhotos = about.photos
  .map((alt, i) => ({ alt, src: publicImage("nosotros", String(i + 1)) }))
  .filter((p) => p.src)
  .slice(0, 3);

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getDisciplines(), getFeaturedProducts(4)]);
  // Foto de cada disciplina: public/disciplinas/<slug>.jpg
  // Las subcategorías llevan al listado de la categoría madre con esa disciplina ya filtrada
  const disciplines = categories.map((c) => ({
    ...c,
    image: publicImage("disciplinas", c.slug),
    href: c.parent ? `/categoria/${c.parent.slug}?disciplina=${c.slug}` : `/categoria/${c.slug}`,
  }));

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

      <section className="container brands-strip" aria-label="Marcas">
        <span className="eyebrow brands-title">Marcas que trabajamos</span>
        <BrandMarquee brands={brands} />
      </section>

      {featured.length > 0 && (
        <section className="section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Los que más salen</span>
              <h2 className="display">Más vendidos</h2>
            </div>
            <Link href="/categoria/bicicletas" className="btn btn-primary see-all-btn">Ver todo <ArrowIcon /></Link>
          </div>
          <div className="product-grid">
            {featured.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
          <Link href="/categoria/bicicletas" className="see-all-band">
            <span>
              <strong>Esto es solo una parte</strong>
              <span>Mirá todas las bicis, con filtros por disciplina, rodado, marca y precio.</span>
            </span>
            <span className="btn btn-dark">Ver todas las bicis <ArrowIcon /></span>
          </Link>
        </section>
      )}

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
            <Link key={d.id} href={d.href} className="discipline">
              <div className="discipline-media">
                {d.image
                  ? <img src={d.image} alt="" loading="lazy" />
                  : <div className="ph ph-dark"><BikeIcon size={80} /></div>}
              </div>
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

      <section className="section container">
        <div className="size-band">
          <div className="size-band-copy">
            <span className="size-band-icon"><RulerIcon size={28} /></span>
            <div>
              <span className="eyebrow">Guía de talles</span>
              <h2 className="display">¿Cuál es tu talle?</h2>
              <p>Poné tu altura y te decimos qué cuadro te va. Con tabla y video explicativo.</p>
            </div>
          </div>
          <Link href="/guia-de-talles" className="btn btn-dark size-band-cta">Ver mi talle <ArrowIcon /></Link>
        </div>
      </section>

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
              <a href={whatsappUrl()} className="btn btn-whatsapp" target="_blank" rel="noreferrer">
                <WhatsappIcon size={20} /> Escribinos por WhatsApp
              </a>
              <a href={directionsUrl} className="btn btn-outline" target="_blank" rel="noreferrer">
                Cómo llegar
              </a>
            </div>
          </div>
          <div className="visit-photo">
            {riderPhoto ? (
              <img src={riderPhoto} alt="Cliente probando una bici en la calle, frente al local" loading="lazy" />
            ) : (
              <div className="ph ph-dark"><BikeIcon size={64} /><span>Foto de cliente probando la bici</span></div>
            )}
          </div>
          <StoreMap />
        </div>
      </section>

      <section className="section container">
        <div className="about-teaser">
          <div className="about-teaser-copy">
            <span className="eyebrow">Quiénes somos</span>
            <h2 className="display">Conocé IonBikeStore</h2>
            <p>{about.paragraphs[0]}</p>
            <Link href="/contacto#quienes-somos" className="btn btn-primary">
              Conocenos <ArrowIcon />
            </Link>
          </div>
          {aboutPhotos.length > 0 && (
            <Link href="/contacto#quienes-somos" className="about-teaser-photos" aria-label="Ver fotos y video del local">
              {aboutPhotos.map((p) => <img key={p.alt} src={p.src!} alt="" loading="lazy" />)}
              <span className="about-teaser-play"><PlayIcon size={22} /> Mirá el video del local</span>
            </Link>
          )}
        </div>
      </section>
    </>
  );
}

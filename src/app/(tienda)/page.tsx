import Link from "next/link";
import { getDisciplines, getFeaturedProducts, getSaleProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import { about, store, whatsappUrl } from "@/config/store";
import { ProductCard } from "@/components/product/ProductCard";
import { StoreMap, directionsUrl } from "@/components/layout/StoreMap";
import { BrandMarquee } from "@/components/layout/BrandMarquee";
import { AutoplayVideo } from "@/components/media/AutoplayVideo";
import { PromoBanner } from "@/components/promos/Promos";
import { publicFile, publicImage } from "@/lib/public-files";
import { ArrowIcon, BikeIcon, PlayIcon, CardIcon, PercentIcon, PinIcon, RulerIcon, TruckIcon, WhatsappIcon, HelmetIcon, ShirtIcon, SprocketIcon } from "@/components/icons";

const brands = ["Zion", "SPY", "Polygon", "Eurobike", "Gravity"];

const sections = [
  { name: "Repuestos", slug: "repuestos", Icon: SprocketIcon, desc: "Transmisión, frenos, cubiertas y todo para que tu bici siga rodando.", tone: "tile-light" },
  { name: "Accesorios", slug: "accesorios", Icon: HelmetIcon, desc: "Cascos, luces, candados, bolsos y más.", tone: "tile-dark" },
  { name: "Indumentaria", slug: "indumentaria", Icon: ShirtIcon, desc: "Ropa y calzado para salir a rodar cómodo.", tone: "tile-accent" },
];

// Foto de la sección "Vení al local": public/local/cliente.jpg (o .png / .webp)
const riderPhoto = publicImage("local", "cliente");

// Adelanto de "Quiénes somos": local, asesoramiento y la salida grupal (fotos 1, 2 y 4)
const aboutPhotos = [1, 2, 4]
  .map((n) => ({ alt: about.photos[n - 1], src: publicImage("nosotros", String(n)) }))
  .filter((p) => p.src);

// Video del hero: public/hero/hero.mp4 (sin audio), con portada public/hero/hero.jpg
const heroVideo = publicFile("hero", "hero", ["mp4"]);
const heroPoster = publicImage("hero", "hero");

export default async function HomePage() {
  const [categories, featured, onSale] = await Promise.all([getDisciplines(), getFeaturedProducts(4), getSaleProducts(4)]);
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
      {heroVideo && (
        <section className="hero-video">
          <h1 className="sr-only">{store.name}: bicicletas, repuestos y taller en Monte Grande</h1>
          <AutoplayVideo src={heroVideo} poster={heroPoster ?? undefined} preload="auto" aria-hidden="true" />
        </section>
      )}

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

      <PromoBanner />

      {onSale.length > 0 && (
        <section className="section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Precios rebajados</span>
              <h2 className="display">Ofertas</h2>
            </div>
            <Link href="/ofertas" className="btn btn-primary see-all-btn">Ver todas <ArrowIcon /></Link>
          </div>
          <div className="product-grid">
            {onSale.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}

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
            <Link key={s.slug} href={`/categoria/${s.slug}`} className={`tile tile-icon ${s.tone}`}>
              <span className="tile-badge"><s.Icon size={30} /></span>
              <span className="tile-watermark"><s.Icon size={190} /></span>
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

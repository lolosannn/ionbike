import Link from "next/link";
import { store, whatsappUrl } from "@/config/store";
import { PlayIcon, WhatsappIcon } from "@/components/icons";
import { publicFile } from "@/lib/public-files";
import { SizeFinder } from "./SizeFinder";
import { SizeGuidePlayer } from "./SizeGuidePlayer";

export const metadata = {
  title: "Guía de talles",
  description: "Qué talle de bicicleta te corresponde según tu altura: Mountain Bike, ruta, gravel e infantiles.",
};

// Video propio en public/talles/guia-de-talles.mp4 (con portada .jpg); se genera desde video/guia-de-talles
const localVideo = publicFile("talles", "guia-de-talles", ["mp4"]);
const localPoster = publicFile("talles", "guia-de-talles", ["jpg"]) ?? undefined;

function SizeGuideVideo() {
  const video = (store.sizeGuideVideo as string) || localVideo;
  if (!video) {
    return (
      <div className="video-frame ph ph-dark">
        <PlayIcon size={56} />
        <span>Video explicativo en preparación</span>
      </div>
    );
  }
  if (video === localVideo) return <SizeGuidePlayer src={video} poster={localPoster} />;
  if (video.endsWith(".mp4")) {
    return <video className="video-frame" src={video} controls playsInline preload="metadata" />;
  }
  return (
    <iframe
      className="video-frame"
      src={`https://www.youtube-nocookie.com/embed/${video}`}
      title="Cómo elegir el talle de tu bicicleta"
      loading="lazy"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

export default function SizeGuidePage() {
  return (
    <div className="container">
      <div className="page-head">
        <nav aria-label="Ruta de navegación" className="breadcrumb">
          <Link href="/">Inicio</Link> / <span style={{ color: "var(--text)" }}>Guía de talles</span>
        </nav>
        <h1 className="display">Guía de talles</h1>
        <p className="muted" style={{ maxWidth: 640 }}>
          Elegí el tipo de bici, poné tu altura y te decimos qué talle de cuadro te corresponde.
        </p>
      </div>

      <section className="size-guide">
        <div className="size-guide-video">
          <SizeGuideVideo />
        </div>
        <div className="size-guide-table">
          <SizeFinder />
        </div>
      </section>

      <section className="section">
        <div className="tiles">
          <div className="tile tile-dark">
            <strong>Medí tu altura</strong>
            <p>Descalzo, de espaldas a la pared. Es el dato principal para elegir el talle.</p>
          </div>
          <div className="tile tile-dark">
            <strong>Mirá la entrepierna</strong>
            <p>Parado sobre la bici tiene que quedarte un espacio de 5 a 10 cm entre el caño superior y la entrepierna.</p>
          </div>
          <div className="tile tile-accent">
            <strong>¿Entre dos talles?</strong>
            <p>El más chico es más ágil y el más grande, más estable. Cada marca tiene su medida: consultanos por el modelo.</p>
            <a href={whatsappUrl("Hola! Quiero que me asesoren con el talle de una bici")} target="_blank" rel="noreferrer">
              <WhatsappIcon size={18} /> Consultanos por WhatsApp
            </a>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 14, marginTop: 20 }}>
          La tabla es orientativa. También podés venir a probarla a {store.address}.
        </p>
      </section>
    </div>
  );
}

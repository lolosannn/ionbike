import { reviews, type Review } from "@/config/reviews";
import { store } from "@/config/store";
import { StarIcon } from "@/components/icons";
import { directionsUrl } from "@/components/layout/StoreMap";

// Colores de los avatares con la inicial, como en Google
const avatarColors = ["#e8590c", "#2f9e44", "#1971c2", "#9c36b5", "#c2255c", "#0c8599", "#5c940d", "#6741d9"];

function Stars({ n }: { n: number }) {
  return (
    <span className="review-stars" aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" aria-hidden className={i < n ? "on" : ""}>
          <path d="M12 2.8l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.4l-5.72 3 1.1-6.37-4.63-4.5 6.4-.93z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <figure className="review-card">
      <Stars n={review.stars} />
      <blockquote>“{review.text}”</blockquote>
      <figcaption>
        <span className="review-avatar" style={{ background: avatarColors[index % avatarColors.length] }} aria-hidden>
          {review.name.charAt(0).toUpperCase()}
        </span>
        <span>
          <strong>{review.name}</strong>
          <small>{review.localGuide ? "Local Guide · " : ""}Reseña en Google</small>
        </span>
      </figcaption>
    </figure>
  );
}

/** Dos filas de reseñas que se deslizan en sentidos opuestos (se frenan al pasar el mouse o tocar). */
export function ReviewsMarquee() {
  const rows = [reviews.filter((_, i) => i % 2 === 0), reviews.filter((_, i) => i % 2 === 1)];
  return (
    <div className="reviews-marquee">
      {rows.map((row, r) => (
        <div key={r} className={`marquee reviews-row${r === 1 ? " reverse" : ""}`}>
          {/* La fila se duplica para que el desplazamiento no tenga cortes; la copia no se lee en voz alta */}
          <div className="marquee-track reviews-track">
            {[...row, ...row].map((review, i) => (
              <div key={i} className={i >= row.length ? "dup" : undefined} aria-hidden={i >= row.length || undefined}>
                <ReviewCard review={review} index={reviews.indexOf(review)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Sección completa de reseñas (inicio y contacto), a todo el ancho de la pantalla. */
export function ReviewsSection() {
  return (
    <section className="section reviews-section" aria-labelledby="resenas-titulo">
      <div className="container reviews-head">
        <span className="eyebrow">Reseñas en Google</span>
        <h2 id="resenas-titulo" className="display">Lo que dicen nuestros clientes</h2>
        <div className="reviews-actions">
          <a href={directionsUrl} className="btn btn-outline" target="_blank" rel="noreferrer">Ver todas en Google</a>
          <a href={store.googleReviewsUrl} className="btn btn-primary" target="_blank" rel="noreferrer">
            <StarIcon size={20} /> Dejanos tu reseña
          </a>
        </div>
      </div>
      <ReviewsMarquee />
    </section>
  );
}

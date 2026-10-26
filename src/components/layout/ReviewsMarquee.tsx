import { reviews, type Review } from "@/config/reviews";
import { store } from "@/config/store";
import { StarIcon } from "@/components/icons";
import { directionsUrl } from "@/components/layout/StoreMap";
import { publicImage } from "@/lib/public-files";

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
  const photos = (review.photos ?? []).map((p) => publicImage("resenas", p)).filter((p): p is string => Boolean(p));
  const avatar = review.avatar ? publicImage("resenas", review.avatar) : null;
  return (
    <figure className={`review-card${photos.length ? " has-photos" : ""}`}>
      {photos.length > 0 && (
        <div className="review-photos">
          {photos.slice(0, 2).map((src) => <img key={src} src={src} alt={`Foto de la reseña de ${review.name}`} loading="lazy" />)}
        </div>
      )}
      <div className="review-body">
        <Stars n={review.stars} />
        <blockquote>“{review.text}”</blockquote>
        <figcaption>
          {avatar ? (
            <img className="review-avatar" src={avatar} alt="" loading="lazy" />
          ) : (
            <span className="review-avatar" style={{ background: avatarColors[index % avatarColors.length] }} aria-hidden>
              {review.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span>
            <strong>{review.name}</strong>
            <small>{review.localGuide ? "Local Guide · " : ""}Reseña en Google</small>
          </span>
        </figcaption>
      </div>
    </figure>
  );
}

/** Reparte las reseñas en dos filas, con las de foto intercaladas entre las de solo texto. */
function splitRows(list: Review[]): Review[][] {
  const withPhotos = list.filter((r) => r.photos?.length);
  const textOnly = list.filter((r) => !r.photos?.length);
  return [0, 1].map((row) => {
    const photos = withPhotos.filter((_, i) => i % 2 === row);
    const texts = textOnly.filter((_, i) => i % 2 === row);
    const out: Review[] = [];
    const every = Math.max(1, Math.round(texts.length / Math.max(1, photos.length)));
    photos.forEach((p, i) => out.push(p, ...texts.slice(i * every, (i + 1) * every)));
    return [...out, ...texts.slice(photos.length * every)];
  });
}

/** Dos filas de reseñas que se deslizan en sentidos opuestos (se frenan al pasar el mouse o tocar). */
export function ReviewsMarquee() {
  const rows = splitRows(reviews);
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

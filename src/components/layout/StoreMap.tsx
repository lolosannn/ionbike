import { store } from "@/config/store";

const query = encodeURIComponent(`${store.address}, Buenos Aires`);

export const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

/** Mapa de Google con la ubicación del local (no necesita clave de API). */
export function StoreMap() {
  return (
    <iframe
      className="visit-map store-map"
      title={`Mapa: ${store.address}`}
      src={`https://maps.google.com/maps?q=${query}&z=16&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

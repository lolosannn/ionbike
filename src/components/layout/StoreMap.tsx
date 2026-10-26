import { store } from "@/config/store";

// Se busca por el nombre del local + la dirección, así Maps abre la ficha de Ion Bike Store
const query = encodeURIComponent(`${store.mapsName}, ${store.address}, Buenos Aires`);
const placeId = store.mapsPlaceId as string;

export const directionsUrl =
  `https://www.google.com/maps/search/?api=1&query=${query}` + (placeId ? `&query_place_id=${placeId}` : "");

/** Mapa de Google con la ubicación del local (no necesita clave de API). */
export function StoreMap() {
  return (
    <iframe
      className="visit-map store-map"
      title={`Mapa: ${store.mapsName}, ${store.address}`}
      src={`https://maps.google.com/maps?q=${query}&z=16&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

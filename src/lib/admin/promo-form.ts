// Formulario de promociones del panel: forma de los datos y validación (navegador y servidor)
import type { PromoPlacement } from "@/config/promos";

export type PromoForm = {
  id: string;
  title: string;
  text: string;
  tag: string;
  href: string;
  cta: string;
  image: string;
  startsOn: string;
  endsOn: string;
  placements: PromoPlacement[];
  categories: string[];
  products: string[];
  priority: number;
  active: boolean;
};

export const placementInfo: { id: PromoPlacement; label: string; hint: string }[] = [
  { id: "barra", label: "Barra de arriba", hint: "El mensaje que rota arriba de todo, en todas las páginas." },
  { id: "inicio", label: "Banner del inicio", hint: "La franja grande debajo del video. Ideal con foto." },
  { id: "listado", label: "Tarjeta en los listados", hint: "Ocupa un lugar entre los productos de las categorías a las que aplica." },
  { id: "producto", label: "Sello en los productos", hint: "Etiqueta en la foto y recuadro en la ficha de los productos a los que aplica." },
  { id: "carrito", label: "Aviso en el carrito", hint: "Arriba de la lista del carrito." },
];

export const emptyPromo: PromoForm = {
  id: "", title: "", text: "", tag: "", href: "", cta: "", image: "", startsOn: "", endsOn: "",
  placements: ["barra", "inicio"], categories: [], products: [], priority: 1, active: true,
};

export type PromoStatus = "activa" | "programada" | "vencida" | "pausada";

export function promoStatus(p: Pick<PromoForm, "active" | "startsOn" | "endsOn">, today: string): PromoStatus {
  if (!p.active) return "pausada";
  if (p.startsOn && p.startsOn > today) return "programada";
  if (p.endsOn && p.endsOn < today) return "vencida";
  return "activa";
}

export const promoStatusLabels: Record<PromoStatus, string> = {
  activa: "Activa ahora",
  programada: "Programada",
  vencida: "Vencida",
  pausada: "Pausada",
};

const date = /^\d{4}-\d{2}-\d{2}$/;
const slug = /^[a-z0-9-]{1,120}$/;
const placements = placementInfo.map((p) => p.id);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Link interno (/ofertas) o externo con https. Nada de javascript:, data: ni //otro-sitio. */
export const isSafeHref = (href: string) => /^\/(?!\/)[\w\-./?=&%#]*$/.test(href) || /^https:\/\/[\w.-]+(\/[\w\-./?=&%#]*)?$/.test(href);

export function validatePromo(raw: unknown): { ok: true; data: PromoForm } | { ok: false; error: string; field?: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Datos inválidos." };
  const r = raw as Record<string, unknown>;
  const data: PromoForm = {
    id: text(r.id, 40),
    title: text(r.title, 80),
    text: text(r.text, 220),
    tag: text(r.tag, 20),
    href: text(r.href, 300),
    cta: text(r.cta, 30),
    image: text(r.image, 200),
    startsOn: text(r.startsOn, 10),
    endsOn: text(r.endsOn, 10),
    placements: (Array.isArray(r.placements) ? r.placements : []).filter((p): p is PromoPlacement => placements.includes(p as PromoPlacement)),
    categories: [...new Set((Array.isArray(r.categories) ? r.categories : []).map((c) => text(c, 120)).filter((c) => slug.test(c)))].slice(0, 30),
    products: [...new Set((Array.isArray(r.products) ? r.products : []).map((c) => text(c, 120)).filter((c) => slug.test(c)))].slice(0, 100),
    priority: typeof r.priority === "number" && Number.isInteger(r.priority) ? Math.min(Math.max(r.priority, 0), 10) : 1,
    active: r.active !== false,
  };
  if (!data.title) return { ok: false, error: "Poné el título de la promo.", field: "title" };
  if (!data.placements.length) return { ok: false, error: "Elegí al menos un lugar donde mostrarla.", field: "placements" };
  if (data.href && !isSafeHref(data.href)) return { ok: false, error: "El link tiene que empezar con / (una página de la tienda) o con https://.", field: "href" };
  if (data.image && !/^\/(?:media\/[a-f0-9]{32}\.webp|[a-z0-9][a-z0-9/_.-]*\.(?:webp|jpg|jpeg|png))$/i.test(data.image)) return { ok: false, error: "La foto no es válida.", field: "image" };
  if ((data.startsOn && !date.test(data.startsOn)) || (data.endsOn && !date.test(data.endsOn))) return { ok: false, error: "Revisá las fechas.", field: "dates" };
  if (data.startsOn && data.endsOn && data.endsOn < data.startsOn) return { ok: false, error: "La fecha de fin es anterior a la de inicio.", field: "dates" };
  const needsTarget = data.placements.includes("producto");
  if (needsTarget && !data.categories.length && !data.products.length) {
    return { ok: false, error: "Para mostrar el sello en los productos, elegí a qué categorías o productos aplica.", field: "targets" };
  }
  return { ok: true, data };
}

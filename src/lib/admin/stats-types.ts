// Datos del tablero de estadísticas (los arma el servidor; los dibuja el navegador)

export type DayPoint = { date: string; visitors: number; views: number; orders: number; revenue: number };

export type Totals = {
  visitors: number;
  views: number;
  orders: number;
  paidOrders: number;
  revenue: number;
  bookings: number;
  inquiries: number;
};

export type StatsData = {
  days: number;
  from: string;
  to: string;
  series: DayPoint[];
  totals: Totals;
  previous: Totals;
  funnel: { label: string; value: number }[];
  sources: { name: string; visits: number }[];
  devices: { device: "mobile" | "desktop" | "tablet"; visitors: number }[];
  products: { slug: string; name: string; views: number; carts: number; sold: number }[];
  // label: nombre del producto para las fichas
  pages: { path: string; views: number; label?: string }[];
};

export const periodOptions = [7, 30, 90] as const;

/** Conversión: pedidos sobre visitantes, en % */
export const conversion = (t: Pick<Totals, "orders" | "visitors">) => (t.visitors ? (t.orders / t.visitors) * 100 : 0);

/** Nombre lindo para la fuente de tráfico */
export function sourceLabel(source: string) {
  const known: Record<string, string> = {
    directo: "Directo (escribieron la dirección o un link guardado)",
    "google.com": "Google",
    "instagram.com": "Instagram",
    "facebook.com": "Facebook",
    "wa.me": "WhatsApp",
    "web.whatsapp.com": "WhatsApp",
    "api.whatsapp.com": "WhatsApp",
    "mercadolibre.com.ar": "Mercado Libre",
    "tiktok.com": "TikTok",
    "youtube.com": "YouTube",
    "bing.com": "Bing",
    "t.co": "X (Twitter)",
  };
  if (known[source]) return known[source];
  if (/^google\./.test(source)) return "Google";
  return source;
}

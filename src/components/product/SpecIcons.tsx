import type { BikePartKey } from "@/lib/specs";

// Íconos de línea (24x24) para cada parte de la bici en las especificaciones.
const paths: Record<BikePartKey, React.ReactNode> = {
  cuadro: <><path d="M5 17l5-9h8l-4 9z" /><path d="M10 8L8.5 5H6.5M18 8l1-3" /><circle cx="5" cy="17" r="1.5" /><circle cx="14" cy="17" r="1.5" /></>,
  horquilla: <><path d="M12 2v5" /><path d="M7 7h10" /><path d="M8 7v11M16 7v11" /><path d="M8 11h0M16 11h0" /><circle cx="8" cy="19.5" r="1.5" /><circle cx="16" cy="19.5" r="1.5" /></>,
  frenos: <><circle cx="11" cy="13" r="7" /><circle cx="11" cy="13" r="2" /><path d="M11 6v2M11 18v2M4 13h2M16 13h2" /><path d="M15 4h4a2 2 0 0 1 2 2v4h-3l-3-3z" /></>,
  cambios: <><circle cx="15" cy="7" r="2.5" /><circle cx="9" cy="17" r="2.5" /><path d="M13.5 9L10.5 15" /><path d="M17 5l3-2" /></>,
  shifter: <><path d="M2 9h14" /><path d="M16 7v4" /><path d="M12 9l4 10" /><path d="M14 9l5 7" /><circle cx="19" cy="17" r="1.5" /></>,
  ruedas: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="1.5" /><path d="M12 3v7.5M12 13.5V21M3 12h7.5M13.5 12H21M5.6 5.6l5.3 5.3M13.1 13.1l5.3 5.3M18.4 5.6l-5.3 5.3M10.9 13.1l-5.3 5.3" /></>,
  cubiertas: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.5" /><path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6l2.5 2.5M15.9 15.9l2.5 2.5M18.4 5.6l-2.5 2.5M8.1 15.9l-2.5 2.5" /></>,
  peso: <><path d="M9 7a3 3 0 1 1 6 0" /><path d="M6 9h12l2 11H4z" /><path d="M10 15h4" /></>,
  plato: <><circle cx="9" cy="12" r="6" strokeDasharray="2 1.6" /><circle cx="9" cy="12" r="2" /><path d="M10.5 13.5L19 20" /><path d="M17 20h4" /></>,
  pinon: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1.5" /></>,
  descarrilador: <><path d="M5 9h11l3 5H8z" /><path d="M11 9V5" /><circle cx="11" cy="4" r="1.5" /><path d="M3 18h18" strokeDasharray="2 2" /></>,
  cadena: <><rect x="2" y="8.5" width="10" height="7" rx="3.5" /><rect x="12" y="8.5" width="10" height="7" rx="3.5" /><path d="M9 12h6" /></>,
  caja: <><ellipse cx="6" cy="12" rx="2" ry="4" /><path d="M6 8h12M6 16h12" /><ellipse cx="18" cy="12" rx="2" ry="4" /><path d="M2 12h2M20 12h2" /></>,
  manillar: <><path d="M2 11c3-3 6-3 10-1s7 2 10-1" /><path d="M12 10v8" /><path d="M9 18h6" /></>,
  portasilla: <><path d="M10 3h6" /><path d="M13 3v18" /><path d="M10 13h6" /><path d="M11 21h4" /></>,
  asiento: <><path d="M3 9c4-2 10-2 15-1l3 2c-2 2-6 2-9 2-3 1-6 1-9-1z" /><path d="M11 12v8M8 20h6" /></>,
  otros: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
};

export function SpecIcon({ part, size = 24 }: { part: BikePartKey; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[part]}
    </svg>
  );
}

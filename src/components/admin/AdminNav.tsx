"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminCounts = { pedidos?: number; consultas?: number; turnos?: number };

const sections = [
  { href: "/admin/estadisticas", label: "Estadísticas" },
  { href: "/admin/pedidos", label: "Pedidos", count: "pedidos", hint: "cobrados sin entregar" },
  { href: "/admin/consultas", label: "Consultas a pedido", count: "consultas", hint: "nuevas" },
  { href: "/admin/turnos", label: "Turnos del taller", count: "turnos", hint: "por confirmar" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/promociones", label: "Promociones" },
  { href: "/admin/actividad", label: "Actividad" },
] as const;

export function AdminNav({ counts }: { counts: AdminCounts }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones del panel" className="adm-nav">
      {sections.map((s) => {
        const n = "count" in s ? counts[s.count] ?? 0 : 0;
        return (
          <Link key={s.href} href={s.href} aria-current={pathname.startsWith(s.href) ? "page" : undefined}>
            {s.label}
            {n > 0 && "hint" in s && <span className="adm-nav-count" title={`${n} ${s.hint}`}>{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

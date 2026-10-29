import { StoreShell } from "@/components/layout/StoreShell";

// Tienda real: las promos salen de la base y cambian desde el panel, así que todas las páginas
// se arman en cada visita (son livianas y la base está al lado)
export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}

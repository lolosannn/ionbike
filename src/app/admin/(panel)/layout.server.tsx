import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/session";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

// Cada página y cada acción vuelven a chequear la sesión: este control es para no mostrar el menú
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell current="productos" adminName={admin.name} logout={logout}>{children}</AdminShell>;
}

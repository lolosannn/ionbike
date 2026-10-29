import Link from "next/link";
import logo from "@/assets/logo-ion.png";
import { AdminNav, type AdminCounts } from "./AdminNav";

/** Marco del panel: menú lateral (arriba en el celular) y contenido */
export function AdminShell({
  counts = {},
  adminName,
  logout,
  demo = false,
  children,
}: {
  counts?: AdminCounts;
  adminName: string;
  logout?: () => Promise<void>;
  demo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="adm">
      <aside className="adm-side">
        <Link href="/admin/estadisticas" className="adm-logo" aria-label="Panel de IonBikeStore">
          <img src={logo.src} width={logo.width} height={logo.height} alt="" />
          <span>Panel</span>
        </Link>
        <AdminNav counts={counts} />
        <div className="adm-side-foot">
          <Link href="/" target="_blank" rel="noreferrer" className="adm-store-link">Ver la tienda ↗</Link>
          <div className="adm-user">
            <span className="adm-avatar" aria-hidden>{adminName.charAt(0).toUpperCase()}</span>
            <span className="adm-user-name">{adminName}</span>
            {logout ? (
              <form action={logout}><button type="submit" className="adm-logout">Salir</button></form>
            ) : (
              <Link href="/admin/ingresar" className="adm-logout">Salir</Link>
            )}
          </div>
        </div>
      </aside>
      <div className="adm-main">
        {demo && (
          <div className="adm-demo">
            <strong>Vista previa del panel.</strong> Podés recorrerlo y probar todo, pero los cambios no se guardan:
            en la tienda real, el panel pide usuario, contraseña y código de la app de autenticación.
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

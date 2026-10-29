import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";

export default function NotFound() {
  return (
    <StoreShell>
      <div className="container" style={{ padding: "96px 24px", textAlign: "center" }}>
        <h1 className="display" style={{ fontSize: 88 }}>404</h1>
        <p className="muted">No encontramos lo que buscabas.</p>
        <Link href="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    </StoreShell>
  );
}

import { store } from "@/config/store";

export const metadata = { title: "Botón de arrepentimiento" };

export default function RegretPage() {
  const mail = `mailto:${store.email}?subject=${encodeURIComponent("Botón de arrepentimiento - Revocación de compra")}`;
  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <h1 className="display" style={{ fontSize: "clamp(44px, 7vw, 72px)" }}>Botón de arrepentimiento</h1>
      </div>
      <div className="notice" style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0 }}>
          Podés revocar tu compra dentro de los 10 días corridos desde que recibiste el producto o se celebró el contrato,
          sin costo ni responsabilidad (Ley 24.240, art. 34 y Resolución 424/2020).
        </p>
        <p style={{ margin: 0 }}>
          Envianos tu número de pedido, nombre y DNI. Te respondemos con un código de identificación del trámite dentro de las 24 horas.
        </p>
        <a className="btn btn-primary" href={mail} style={{ alignSelf: "flex-start" }}>Solicitar la revocación</a>
      </div>
    </div>
  );
}

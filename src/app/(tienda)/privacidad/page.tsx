import Link from "next/link";
import { store } from "@/config/store";

export const metadata = {
  title: "Política de privacidad",
  description: "Qué datos personales guardamos, para qué los usamos y cómo ejercer tus derechos (Ley 25.326).",
};

const updated = "29 de octubre de 2026";

export default function PrivacyPage() {
  const { legal } = store;
  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <h1 className="display" style={{ fontSize: "clamp(44px, 7vw, 72px)" }}>Política de privacidad</h1>
        <p className="muted">Última actualización: {updated}</p>
      </div>

      <div className="legal">
        <h2>Quién es responsable de tus datos</h2>
        <p>
          {legal.razonSocial} (CUIT {legal.cuit}), con domicilio en {legal.domicilio}, que opera la tienda {store.name}.
          Para cualquier consulta sobre tus datos escribinos a <a href={`mailto:${store.email}`}>{store.email}</a>.
        </p>

        <h2>Qué datos guardamos</h2>
        <ul>
          <li><strong>Cuando comprás:</strong> nombre y apellido, DNI, email, teléfono, dirección de envío, los productos del pedido y el medio de pago elegido.</li>
          <li><strong>Cuando sacás un turno en el taller:</strong> nombre, teléfono y, si los completás, email, datos de tu bici y comentarios.</li>
          <li><strong>Cuando consultás por una bici a pedido:</strong> nombre, teléfono y, si los completás, email, el color o talle que te interesa y tu mensaje.</li>
          <li><strong>Estadísticas de visitas:</strong> qué páginas se ven, desde qué sitio se llegó (por ejemplo Google o Instagram) y el tipo de dispositivo (celular o computadora). No guardamos la IP: cada visitante se cuenta con un código anónimo que cambia todos los días, así que no se puede saber quién sos ni seguirte de un día a otro.</li>
          <li><strong>Datos técnicos:</strong> la dirección IP y la fecha de cada visita quedan en los registros del servidor por seguridad (para frenar ataques y abusos).</li>
        </ul>
        <p>
          <strong>No guardamos datos de tarjetas.</strong> Los pagos con tarjeta, Mercado Pago, QR y cupones los procesa
          Mercado Pago en su propia plataforma.
        </p>
        <p>
          No usamos cookies de seguimiento ni publicidad, ni servicios de estadísticas de terceros. El carrito y el código postal que cargás se guardan solo en tu
          navegador para que no los pierdas al recargar la página.
        </p>

        <h2>Para qué los usamos</h2>
        <ul>
          <li>Preparar, cobrar, facturar y entregar tu pedido, y atender cambios, devoluciones y garantías.</li>
          <li>Reservar y gestionar tu turno del taller, y responder tus consultas por bicis a pedido.</li>
          <li>Saber cuántas personas visitan la tienda y qué les interesa, para mejorarla (con datos anónimos).</li>
          <li>Comunicarnos con vos por WhatsApp, teléfono o email sobre tu pedido o turno.</li>
          <li>Cumplir obligaciones legales, contables e impositivas.</li>
        </ul>
        <p>No vendemos ni alquilamos tus datos, y no los usamos para enviarte publicidad sin tu consentimiento.</p>

        <h2>Con quién los compartimos</h2>
        <ul>
          <li><strong>Mercado Pago</strong>, para procesar el cobro (tu email y el detalle del pedido).</li>
          <li><strong>Andreani</strong>, para el envío (nombre, dirección y teléfono).</li>
          <li>Organismos públicos, solo cuando la ley lo exige (por ejemplo, ARCA para la facturación).</li>
        </ul>

        <h2>Cuánto tiempo los guardamos</h2>
        <p>
          Los datos de los pedidos se conservan durante el plazo que exigen las normas contables e impositivas (hasta 10 años).
          Los turnos del taller y las consultas por bicis a pedido se conservan hasta 2 años. Las estadísticas anónimas de
          visitas, hasta 13 meses. Los registros técnicos del servidor, hasta 90 días.
        </p>

        <h2>Cómo los protegemos</h2>
        <p>
          El sitio funciona solo con conexión cifrada (HTTPS), la base de datos no es accesible desde internet y solo el
          personal autorizado de la tienda puede ver los pedidos. El link de cada pedido es único y secreto: no lo compartas.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Podés pedir en cualquier momento <strong>acceder</strong> a tus datos, <strong>corregirlos</strong>, <strong>actualizarlos</strong> o
          que los <strong>borremos</strong> (salvo los que la ley nos obliga a conservar), escribiendo a{" "}
          <a href={`mailto:${store.email}?subject=${encodeURIComponent("Datos personales")}`}>{store.email}</a> desde el email que usaste e
          indicando tu nombre y DNI. Respondemos los pedidos de acceso dentro de los 10 días corridos y los de corrección o
          borrado dentro de los 5 días hábiles (Ley 25.326, arts. 14 a 16).
        </p>
        <p className="legal-note">
          El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita
          a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido
          en el artículo 14, inciso 3 de la Ley Nº 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de
          Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan
          quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de
          datos personales.
        </p>

        <h2>Cambios en esta política</h2>
        <p>
          Si cambiamos esta política, publicamos la nueva versión en esta página con su fecha. Ver también los{" "}
          <Link href="/terminos">términos y condiciones</Link>.
        </p>
      </div>
    </div>
  );
}

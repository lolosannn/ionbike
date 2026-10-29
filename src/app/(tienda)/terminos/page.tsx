import Link from "next/link";
import { store } from "@/config/store";

export const metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de compra, envíos, cambios, devoluciones y garantía de IonBikeStore.",
};

const updated = "26 de octubre de 2026";

const holdText = (hours: number) => (hours % 24 === 0 ? `${hours / 24} días` : `${hours} horas`);

export default function TermsPage() {
  const { legal, orderHoldHours: hold } = store;
  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <h1 className="display" style={{ fontSize: "clamp(44px, 7vw, 72px)" }}>Términos y condiciones</h1>
        <p className="muted">Última actualización: {updated}</p>
      </div>

      <div className="legal">
        <h2>Quiénes somos</h2>
        <p>
          {store.name} es una tienda de {legal.razonSocial} (CUIT {legal.cuit}), con domicilio en {legal.domicilio}.
          Contacto: <a href={`mailto:${store.email}`}>{store.email}</a> · {store.phone}. Al comprar o sacar un turno en este
          sitio aceptás estas condiciones y la <Link href="/privacidad">política de privacidad</Link>.
        </p>

        <h2>Precios</h2>
        <p>
          Los precios están en pesos argentinos e incluyen IVA. El precio publicado es el de lista (tarjeta y Mercado Pago).
          Pagando con transferencia o en efectivo tenés un {store.transferDiscountPct}% de descuento sobre los productos (no sobre
          el envío). El precio que vale es el que figura al confirmar el pedido. Si hubiera un error evidente de precio o de
          stock, te avisamos y podés elegir seguir con el precio correcto o cancelar con la devolución total de lo pagado.
        </p>

        <h2>Reserva de stock y plazos de pago</h2>
        <p>Al confirmar un pedido te reservamos los productos durante este plazo para que completes el pago:</p>
        <ul>
          <li>Tarjeta, Mercado Pago o QR: {holdText(hold.CARD)}.</li>
          <li>Transferencia al alias o CBU: {holdText(hold.TRANSFER)} (mandanos el comprobante por WhatsApp).</li>
          <li>Efectivo en el local: {holdText(hold.CASH)}.</li>
          <li>Cupón de Pago Fácil o Rapipago: el cupón vence a los {holdText(hold.TICKET - 24)}.</li>
        </ul>
        <p>Si en ese plazo no se acredita el pago, el pedido se cancela solo y los productos vuelven a estar a la venta.</p>

        <h2>Pagos</h2>
        <p>
          Los pagos con tarjeta, Mercado Pago, QR y cupón los procesa Mercado Pago; nosotros nunca vemos ni guardamos los
          datos de tu tarjeta. Las cuotas sin interés son las que figuran en cada producto al momento de la compra.
        </p>

        <h2>Envíos y retiro</h2>
        <p>
          Enviamos a todo el país con Andreani; los plazos de entrega son estimados y corren desde que se acredita el pago.
          Al recibir, revisá que el paquete esté cerrado y sin daños; si no, dejalo asentado y avisanos. También podés retirar
          gratis en {store.address} ({store.hours}) presentando el DNI del comprador y el número de pedido.
        </p>

        <h2>Derecho de arrepentimiento</h2>
        <p>
          Tenés 10 días corridos desde que recibís el producto para arrepentirte de la compra, sin dar motivos y sin costo
          (Ley 24.240, art. 34, y Código Civil y Comercial, art. 1110). El producto tiene que estar sin uso y con su embalaje.
          Nos hacemos cargo del costo de la devolución y te reintegramos el total por el mismo medio de pago. Podés pedirlo
          desde el <Link href="/arrepentimiento">botón de arrepentimiento</Link>.
        </p>

        <h2>Cambios</h2>
        <p>
          Podés cambiar un producto por talle, color o modelo dentro de los 30 días de recibido, sin uso, con su embalaje y
          etiquetas, y con el número de pedido. El envío del cambio corre por tu cuenta, salvo que el producto tenga una falla
          o te hayamos mandado uno equivocado. La indumentaria interior, los consumibles abiertos y los productos hechos o
          ajustados a medida no tienen cambio, salvo falla.
        </p>

        <h2>Garantía</h2>
        <p>
          Todos los productos nuevos tienen la garantía legal de 6 meses por defectos de fabricación (Ley 24.240, art. 11),
          además de la garantía del fabricante cuando es mayor. Los productos usados tienen 3 meses. La garantía no cubre el
          desgaste normal, golpes, caídas, mal uso, ni modificaciones o reparaciones hechas fuera de nuestro taller.
        </p>

        <h2>Turnos del taller</h2>
        <p>
          El turno es para dejar la bici en el local. Los precios publicados son orientativos: el presupuesto final te lo
          confirmamos después de revisar la bici y antes de hacer cualquier trabajo extra. Si no podés venir, avisanos por
          WhatsApp para liberar el horario.
        </p>

        <h2>Reclamos</h2>
        <p>
          Ante cualquier problema escribinos primero a <a href={`mailto:${store.email}`}>{store.email}</a> y lo resolvemos.
          También podés hacer un reclamo ante{" "}
          <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noreferrer">Defensa del Consumidor</a>.
          Estas condiciones se rigen por las leyes de la República Argentina.
        </p>
      </div>
    </div>
  );
}

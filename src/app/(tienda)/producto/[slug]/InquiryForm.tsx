"use client";

import { useActionState } from "react";
import { whatsappUrl } from "@/config/store";
import { WhatsappIcon } from "@/components/icons";

export type InquiryState = { error?: string; sent?: boolean; name?: string };

type Props = {
  productId: string;
  productName: string;
  // Opciones para "color / talle que te interesa"
  options: string[];
  // Sin acción (vista previa): el formulario se ve, pero no envía
  action?: (prev: InquiryState, form: FormData) => Promise<InquiryState>;
};

export function InquiryForm({ productId, productName, options, action }: Props) {
  const [state, formAction, pending] = useActionState<InquiryState, FormData>(
    action ?? (async () => ({ error: "Vista previa: en la tienda real la consulta llega al panel del local." })),
    {},
  );
  const wa = (
    <a className="btn btn-whatsapp btn-block" href={whatsappUrl(`Hola! Quiero consultar por la ${productName}`)} target="_blank" rel="noreferrer">
      <WhatsappIcon size={20} /> Contactanos por WhatsApp
    </a>
  );

  if (state.sent) {
    return (
      <div className="on-request">
        <span className="badge badge-accent">Consulta enviada</span>
        <p>
          ¡Gracias, {state.name}! Te contactamos dentro de las próximas 24 h hábiles con colores, talles, precio final y
          plazo de entrega. Si lo necesitás antes, escribinos:
        </p>
        {wa}
      </div>
    );
  }

  return (
    <div className="on-request">
      <span className="badge badge-accent">A pedido</span>
      <p>
        Este modelo lo traemos por pedido. Dejanos tus datos y te confirmamos colores, talles, precio final y plazo de
        entrega, o escribinos directo por WhatsApp.
      </p>
      {wa}
      <form action={formAction} className="inquiry-form">
        <input type="hidden" name="productId" value={productId} />
        {/* Campo trampa para bots: las personas no lo ven */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <div className="inquiry-grid">
          <label className="field">
            <span>Nombre</span>
            <input className="input" name="name" autoComplete="name" required maxLength={200} />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input className="input" name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={40} placeholder="11 5555 4444" />
          </label>
          <label className="field">
            <span>Email <em>(opcional)</em></span>
            <input className="input" name="email" type="email" autoComplete="email" maxLength={200} />
          </label>
          <label className="field">
            <span>Color / talle que te interesa</span>
            <input className="input" name="preference" list="inquiry-options" maxLength={120} placeholder="Ej. Negro, talle M" />
            <datalist id="inquiry-options">{options.map((o) => <option key={o} value={o} />)}</datalist>
          </label>
        </div>
        <label className="field">
          <span>Mensaje <em>(opcional)</em></span>
          <textarea className="input" name="message" rows={3} maxLength={1000} placeholder="Tu altura, para qué la vas a usar, si entregás tu bici en parte de pago…" />
        </label>
        {state.error && <p className="alert" role="alert">{state.error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? "Enviando…" : "Quiero que me contacten"}
        </button>
      </form>
    </div>
  );
}

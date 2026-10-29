import { CheckoutForm } from "./CheckoutForm";

export const metadata = { title: "Finalizar compra" };

// Vista previa estática: el checkout se simula, sin pedidos ni pagos
export default function CheckoutPage() {
  return (
    <div className="container">
      <div className="page-head">
        <h1 className="display">Finalizar compra</h1>
      </div>
      <CheckoutForm mercadoPagoEnabled qrEnabled />
    </div>
  );
}

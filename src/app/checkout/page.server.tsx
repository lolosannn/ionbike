import { isMercadoPagoConfigured, isQrConfigured } from "@/lib/mercadopago";
import { CheckoutForm } from "./CheckoutForm";
import { placeOrder, quoteShippingAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finalizar compra" };

export default function CheckoutPage() {
  return (
    <div className="container">
      <div className="page-head">
        <h1 className="display">Finalizar compra</h1>
      </div>
      <CheckoutForm mercadoPagoEnabled={isMercadoPagoConfigured()} qrEnabled={isQrConfigured()} action={placeOrder} quoteAction={quoteShippingAction} />
    </div>
  );
}

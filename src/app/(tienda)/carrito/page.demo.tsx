import { CartView } from "./CartView";

export const metadata = { title: "Tu carrito" };

// Vista previa estática: el envío se calcula en el navegador con la tabla por zona
export default function CartPage() {
  return <CartView />;
}

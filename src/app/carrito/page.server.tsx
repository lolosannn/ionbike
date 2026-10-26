import { CartView } from "./CartView";
import { quoteShippingAction } from "../checkout/actions";

export const metadata = { title: "Tu carrito" };

export default function CartPage() {
  return <CartView quoteAction={quoteShippingAction} />;
}

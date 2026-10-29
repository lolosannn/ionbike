// Tienda real: se renderiza en cada visita con los datos de la base.
import ProductPage from "./ProductPage";
import { sendInquiry } from "./actions";

export { generateMetadata } from "./ProductPage";
export const dynamic = "force-dynamic";

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <ProductPage {...props} inquire={sendInquiry} />;
}

import { requireAdmin } from "@/lib/admin/session";
import { getEditorOptions, getProductForm } from "@/lib/admin/products";
import { duplicateProduct, emptyProduct } from "@/lib/admin/product-form";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { saveProductAction } from "../../../actions";

export const metadata = { title: "Nuevo producto" };

type Props = { searchParams: Promise<{ desde?: string }> };

export default async function NewProductPage({ searchParams }: Props) {
  await requireAdmin();
  const { desde } = await searchParams;
  const [options, source] = await Promise.all([
    getEditorOptions(),
    typeof desde === "string" && desde.length <= 40 ? getProductForm(desde) : null,
  ]);
  return <ProductEditor initial={source ? duplicateProduct(source) : emptyProduct} {...options} save={saveProductAction} />;
}

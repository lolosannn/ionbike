import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { getEditorOptions, getProductForm } from "@/lib/admin/products";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { deleteProductAction, saveProductAction } from "../../../actions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = id.length <= 40 ? await getProductForm(id) : null;
  return { title: product?.name ?? "Producto" };
}

export default async function EditProductPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  if (id.length > 40) notFound();
  const [product, options] = await Promise.all([getProductForm(id), getEditorOptions()]);
  if (!product) notFound();
  // key: al guardar un producto nuevo se pasa a su página y el editor arranca de cero con los datos guardados
  return <ProductEditor key={product.id} initial={product} {...options} save={saveProductAction} remove={deleteProductAction} />;
}

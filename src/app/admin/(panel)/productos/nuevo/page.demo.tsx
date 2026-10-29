import { ProductEditor } from "@/components/admin/ProductEditor";
import { emptyProduct } from "@/lib/admin/product-form";
import { demoEditorOptions } from "@/lib/admin/demo";

export const metadata = { title: "Nuevo producto" };

export default function NewProductPreview() {
  return <ProductEditor initial={emptyProduct} {...demoEditorOptions()} />;
}

import { ProductsTable } from "@/components/admin/ProductsTable";
import { demoEditorOptions, demoProductRows } from "@/lib/admin/demo";

export const metadata = { title: "Productos" };

export default function ProductsPreview() {
  return <ProductsTable rows={demoProductRows()} categories={demoEditorOptions().categories} />;
}

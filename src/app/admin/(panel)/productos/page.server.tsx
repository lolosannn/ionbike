import { requireAdmin } from "@/lib/admin/session";
import { getEditorOptions, listProductRows } from "@/lib/admin/products";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { setProductActiveAction } from "../../actions";

export const metadata = { title: "Productos" };

export default async function ProductsPage() {
  await requireAdmin();
  const [rows, { categories }] = await Promise.all([listProductRows(), getEditorOptions()]);
  return <ProductsTable rows={rows} categories={categories} setActive={setProductActiveAction} />;
}

import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { demoEditorOptions, demoProductForm, demoProductIds } from "@/lib/admin/demo";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return demoProductIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props) {
  return { title: demoProductForm((await params).id)?.name ?? "Producto" };
}

export default async function EditProductPreview({ params }: Props) {
  const product = demoProductForm((await params).id);
  if (!product) notFound();
  return <ProductEditor initial={product} {...demoEditorOptions()} />;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryWithProducts } from "@/lib/catalog";
import { ProductListing } from "@/components/product/ProductListing";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryWithProducts(slug);
  return { title: data?.category.name ?? "Categoría" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCategoryWithProducts(slug);
  if (!data) notFound();
  const { category, products } = data;

  return (
    <div className="container">
      <div className="page-head">
        <nav aria-label="Ruta de navegación" className="breadcrumb">
          <Link href="/">Inicio</Link>
          {category.parent && <> / <Link href={`/categoria/${category.parent.slug}`}>{category.parent.name}</Link></>}
          {" / "}<span style={{ color: "var(--text)" }}>{category.name}</span>
        </nav>
        <h1 className="display">{category.name}</h1>
        {category.description && <p className="muted" style={{ maxWidth: 640 }}>{category.description}</p>}
        {[category.slug, category.parent?.slug].some((s) => s === "bicicletas" || s === "e-bike") && (
          <Link href="/guia-de-talles" className="size-guide-link">¿No sabés qué talle te va? Ver la guía de talles →</Link>
        )}
      </div>
      <ProductListing
        products={products}
        subcategories={category.children.map((c) => ({ slug: c.slug, name: c.name }))}
      />
    </div>
  );
}

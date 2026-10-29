import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryWithProducts } from "@/lib/catalog";
import { ProductListing } from "@/components/product/ProductListing";
import { ArrowIcon, RulerIcon } from "@/components/icons";

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
      <div className="page-head category-head">
        <nav aria-label="Ruta de navegación" className="breadcrumb">
          <Link href="/">Inicio</Link>
          {category.parent && <> / <Link href={`/categoria/${category.parent.slug}`}>{category.parent.name}</Link></>}
          {" / "}<span style={{ color: "var(--text)" }}>{category.name}</span>
        </nav>
        <h1 className="display">{category.name}</h1>
        {category.description && <p className="category-desc">{category.description}</p>}
      </div>
      {[category.slug, category.parent?.slug].some((s) => s === "bicicletas" || s === "e-bike") && (
        <Link href="/guia-de-talles" className="size-guide-cta">
          <span className="size-guide-cta-icon"><RulerIcon size={30} /></span>
          <span className="size-guide-cta-text">
            <strong>¿No sabés qué talle te va?</strong>
            <span>Poné tu altura en nuestra guía y te decimos el talle de cuadro justo, con video explicativo.</span>
          </span>
          <span className="btn btn-primary size-guide-cta-btn">Ver la guía de talles <ArrowIcon size={20} /></span>
        </Link>
      )}
      <ProductListing
        products={products}
        subcategories={category.children.map((c) => ({ slug: c.slug, name: c.name }))}
        categorySlugs={[category.slug, ...(category.parent ? [category.parent.slug] : [])]}
      />
    </div>
  );
}

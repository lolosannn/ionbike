// Vista previa estática: genera una página por cada ítem del catálogo de ejemplo.
import { staticCategorySlugs } from "@/lib/catalog";

export { default, generateMetadata } from "./CategoryPage";

export function generateStaticParams() {
  return staticCategorySlugs();
}

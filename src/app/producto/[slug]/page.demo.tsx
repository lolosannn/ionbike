// Vista previa estática: genera una página por cada ítem del catálogo de ejemplo.
import { staticProductSlugs } from "@/lib/catalog";

export { default, generateMetadata } from "./ProductPage";

export function generateStaticParams() {
  return staticProductSlugs();
}

import { Suspense } from "react";
import { getAllProducts } from "@/lib/catalog";
import { SearchResults } from "./SearchResults";

export const metadata = { title: "Buscar" };

export default async function SearchPage() {
  const products = await getAllProducts();
  return (
    <div className="container">
      <Suspense>
        <SearchResults products={products} />
      </Suspense>
    </div>
  );
}

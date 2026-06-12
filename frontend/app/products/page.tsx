import Link from "next/link";

import { ProductGrid } from "@/components/ProductGrid";
import { API_URL } from "@/lib/api";
import { type Product } from "@/lib/types";

// Revalidate the product list at most once per minute (ISR).
export const revalidate = 60;

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return (await res.json()) as Product[];
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Products</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
          ← Home
        </Link>
      </div>

      <ProductGrid products={products} />
    </main>
  );
}

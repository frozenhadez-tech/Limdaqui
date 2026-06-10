import Link from "next/link";

import { API_URL } from "@/lib/api";
import { formatPrice, type Product } from "@/lib/types";

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
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
          ← Home
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
          No products yet. Seed the database with{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">
            npm run db:seed
          </code>{" "}
          in the backend.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
            >
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800" />
              )}
              <div className="p-4">
                {product.categoryName && (
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    {product.categoryName}
                  </p>
                )}
                <h2 className="font-semibold">{product.name}</h2>
                {product.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {product.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold">
                    {formatPrice(product.priceCents, product.currency)}
                  </span>
                  <span
                    className={
                      product.stock > 0
                        ? "text-xs text-green-600"
                        : "text-xs text-red-500"
                    }
                  >
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

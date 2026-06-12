"use client";

import { useMemo, useState } from "react";

import { AddToCartButton } from "@/components/AddToCartButton";
import { PriceTag } from "@/components/PriceTag";
import { resolveImageUrl } from "@/lib/api";
import { type Product } from "@/lib/types";

export function ProductGrid({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.description ?? "", p.categoryName ?? "", p.slug]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [products, search]);

  if (products.length === 0) {
    return (
      <>
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">Products</h1>
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
          No products yet — check back soon.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Products</h1>
        <div className="relative w-full sm:max-w-xs">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <path
              d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products by name, description, or category"
            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
          <p>
            No products match <span className="font-semibold text-ink">“{search}”</span>.
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-3 text-sm font-semibold text-brand hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <li
              key={product.id}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg"
            >
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveImageUrl(product.imageUrl)!}
                  alt={product.name}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="aspect-square w-full bg-gray-100" />
              )}
              <div className="p-4">
                {product.categoryName && (
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    {product.categoryName}
                  </p>
                )}
                <h2 className="font-semibold text-ink">{product.name}</h2>
                {product.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {product.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <PriceTag
                    cents={product.priceCents}
                    currency={product.currency}
                  />
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
                <div className="mt-3 flex justify-end">
                  <AddToCartButton
                    productId={product.id}
                    disabled={product.stock === 0}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

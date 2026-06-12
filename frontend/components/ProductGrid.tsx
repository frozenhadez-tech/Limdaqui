"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { AddToCartButton } from "@/components/AddToCartButton";
import { PriceTag } from "@/components/PriceTag";
import { resolveImageUrl } from "@/lib/api";
import { type Product } from "@/lib/types";

const PAGE_SIZE = 12;

export function ProductGrid({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  // A new search starts back at the first page of its results.
  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function goToPage(next: number) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
          {visible.map((product) => (
            <li
              key={product.id}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg"
            >
              <Link href={`/products/${product.slug}`}>
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
              </Link>
              <div className="p-4">
                {product.categoryName && (
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    {product.categoryName}
                  </p>
                )}
                <h2 className="font-semibold text-ink">
                  <Link
                    href={`/products/${product.slug}`}
                    className="transition hover:text-brand"
                  >
                    {product.name}
                  </Link>
                </h2>
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
                  {(product.colors?.length ?? 0) > 0 ||
                  (product.sizes?.length ?? 0) > 0 ? (
                    <Link
                      href={`/products/${product.slug}`}
                      title="Choose color, size, and quantity"
                      className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-600"
                    >
                      Select options
                    </Link>
                  ) : (
                    <AddToCartButton
                      productId={product.id}
                      disabled={product.stock === 0}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > PAGE_SIZE && (
        <nav
          aria-label="Product pages"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
          >
            ‹ Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => goToPage(n)}
              aria-current={n === currentPage ? "page" : undefined}
              className={`h-10 w-10 rounded-full text-sm font-bold transition ${
                n === currentPage
                  ? "bg-brand text-white shadow-sm shadow-brand/20"
                  : "border border-gray-200 text-gray-600 hover:border-brand hover:text-brand"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
          >
            Next ›
          </button>
        </nav>
      )}

      {filtered.length > 0 && (
        <p className="mt-4 text-center text-xs text-gray-400">
          Showing {(currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
          products
        </p>
      )}
    </>
  );
}

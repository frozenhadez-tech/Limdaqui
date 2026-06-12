"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { PriceTag } from "@/components/PriceTag";
import { apiFetch, resolveImageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { type Product } from "@/lib/types";

function OptionPills({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            aria-pressed={selected === opt}
            className={`rounded-lg border px-4 py-2 text-sm transition ${
              selected === opt
                ? "border-brand bg-brand/5 font-semibold text-brand"
                : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { add } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<Product>(`/api/products/${params.slug}`)
      .then(setProduct)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Product not found"),
      );
  }, [params.slug]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (error) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h1 className="font-display text-xl font-extrabold text-ink">
            Product not found
          </h1>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            Back to the shop
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-gray-100" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  const needsColor = (product.colors?.length ?? 0) > 0;
  const needsSize = (product.sizes?.length ?? 0) > 0;
  const optionsChosen = (!needsColor || color) && (!needsSize || size);
  const outOfStock = product.stock === 0;
  const variant =
    [color, size].filter(Boolean).join(" / ") || null;

  function addToCart() {
    add(product!.id, quantity, variant);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/products"
        className="text-sm text-gray-500 transition hover:text-brand"
      >
        ← Back to products
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImageUrl(product.imageUrl)!}
              alt={product.name}
              className="aspect-square w-full rounded-2xl border border-gray-100 object-cover"
            />
          ) : (
            <div className="aspect-square w-full rounded-2xl bg-gray-100" />
          )}
        </div>

        <div>
          {product.categoryName && (
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {product.categoryName}
            </p>
          )}
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">
            {product.name}
          </h1>
          {product.description && (
            <p className="mt-3 leading-relaxed text-gray-600">
              {product.description}
            </p>
          )}

          <div className="mt-5 flex items-center gap-4">
            <PriceTag
              cents={product.priceCents}
              currency={product.currency}
              className="font-display text-3xl font-extrabold tracking-tight text-brand"
            />
            <span
              className={`text-sm font-medium ${
                outOfStock ? "text-red-500" : "text-green-600"
              }`}
            >
              {outOfStock ? "Out of stock" : `${product.stock} in stock`}
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {needsColor && (
              <OptionPills
                label="Color"
                options={product.colors!}
                selected={color}
                onSelect={setColor}
              />
            )}
            {needsSize && (
              <OptionPills
                label="Size"
                options={product.sizes!}
                selected={size}
                onSelect={setSize}
              />
            )}

            <div>
              <p className="text-sm font-semibold text-ink">Quantity</p>
              <div className="mt-2 flex items-center gap-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-12 text-center font-bold text-ink">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            {user ? (
              <button
                onClick={addToCart}
                disabled={outOfStock || !optionsChosen}
                title={
                  outOfStock
                    ? "This product is out of stock"
                    : !optionsChosen
                      ? "Choose your options first"
                      : "Add this item to your cart"
                }
                className={`w-full rounded-full py-3 text-sm font-bold text-white transition disabled:opacity-50 sm:w-72 ${
                  added ? "bg-green-600" : "bg-brand hover:bg-brand-600"
                }`}
              >
                {added
                  ? "Added to cart ✓"
                  : outOfStock
                    ? "Out of stock"
                    : !optionsChosen
                      ? "Select options"
                      : "Add to cart"}
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-block w-full rounded-full bg-brand py-3 text-center text-sm font-bold text-white transition hover:bg-brand-600 sm:w-72"
              >
                Log in to shop
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

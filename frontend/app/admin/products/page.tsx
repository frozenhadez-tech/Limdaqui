"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { formatPrice, type Category, type Product } from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

const field =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

type FormState = {
  name: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  price: string;
  currency: string;
  stock: string;
  imageUrl: string;
  categoryId: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  slugTouched: false,
  description: "",
  price: "",
  currency: "PHP",
  stock: "0",
  imageUrl: "",
  categoryId: "",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toForm(p: Product): FormState {
  return {
    name: p.name,
    slug: p.slug,
    slugTouched: true,
    description: p.description ?? "",
    price: (p.priceCents / 100).toFixed(2),
    currency: p.currency,
    stock: String(p.stock),
    imageUrl: p.imageUrl ?? "",
    categoryId: p.categoryId ?? "",
  };
}

function StockPill({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
        Out of stock
      </span>
    );
  if (stock < 10)
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
        Low · {stock}
      </span>
    );
  return (
    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
      {stock} in stock
    </span>
  );
}

export default function AdminProductsPage() {
  const authedFetch = useAuthedFetch();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Editor state: null = closed, "new" = creating, otherwise product being edited.
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      apiFetch<Product[]>("/api/products?limit=100"),
      apiFetch<Category[]>("/api/categories"),
    ])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, []);

  useEffect(load, [load]);

  function openEditor(target: Product | "new") {
    setEditing(target);
    setForm(target === "new" ? EMPTY_FORM : toForm(target));
    setFormError(null);
    setConfirmDelete(false);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !f.slugTouched) next.slug = slugify(value as string);
      if (key === "slug") next.slugTouched = true;
      return next;
    });
  }

  async function save() {
    setFormError(null);
    const priceCents = Math.round(parseFloat(form.price) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setFormError("Enter a valid price");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      priceCents,
      currency: form.currency,
      stock: parseInt(form.stock, 10) || 0,
      imageUrl: form.imageUrl.trim() || null,
      categoryId: form.categoryId || null,
    };

    setSaving(true);
    try {
      if (editing === "new") {
        await authedFetch("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await authedFetch(`/api/products/${editing!.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (editing === "new" || !editing) return;
    setSaving(true);
    try {
      await authedFetch(`/api/products/${editing.id}`, { method: "DELETE" });
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="animate-fade-up text-[0.65rem] font-bold uppercase tracking-[0.24em] text-gray-400">
        Back office
      </p>
      <div className="animate-fade-up delay-1 mt-1 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Products
        </h1>
        <button
          onClick={() => openEditor("new")}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-600"
        >
          + New product
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
          {error}
        </div>
      )}

      <div className="animate-fade-up delay-2 mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {!products ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-14 text-center">
            <p className="font-display text-lg font-bold text-ink">No products yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Create your first product to start building the catalog.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3.5">Product</th>
                <th className="hidden px-4 py-3.5 md:table-cell">Category</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="hidden px-4 py-3.5 sm:table-cell">Stock</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => openEditor(p)}
                  className="cursor-pointer transition hover:bg-gray-50"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{p.name}</p>
                        <p className="truncate font-mono text-xs text-gray-400">
                          /{p.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                    {p.categoryName ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">
                    {formatPrice(p.priceCents, p.currency)}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <StockPill stock={p.stock} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-over editor */}
      {editing && (
        <div className="fixed inset-0 z-50">
          <div
            className="animate-fade-in absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => !saving && setEditing(null)}
          />
          <div className="animate-slide-in absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">
              <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
                {editing === "new" ? "New product" : "Edit product"}
              </h2>
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-ink"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-7 py-6">
              {formError && (
                <div className="rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className={field}
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                  className={`${field} font-mono`}
                  placeholder="product-slug"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                    className={field}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => update("currency", e.target.value)}
                    className={field}
                  >
                    <option value="PHP">PHP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => update("stock", e.target.value)}
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => update("categoryId", e.target.value)}
                    className={field}
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <div className="flex items-center gap-3">
                  <input
                    value={form.imageUrl}
                    onChange={(e) => update("imageUrl", e.target.value)}
                    className={field}
                    placeholder="https://…"
                  />
                  {form.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  className={field}
                  placeholder="Optional description shown on the storefront"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-100 px-7 py-5">
              <button
                onClick={save}
                disabled={saving || !form.name || !form.slug || !form.price}
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : editing === "new"
                    ? "Create product"
                    : "Save changes"}
              </button>
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:text-ink"
              >
                Cancel
              </button>
              {editing !== "new" && (
                <button
                  onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
                  disabled={saving}
                  className={`ml-auto rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    confirmDelete
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "text-red-500 hover:bg-red-50"
                  }`}
                >
                  {confirmDelete ? "Confirm delete" : "Delete"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

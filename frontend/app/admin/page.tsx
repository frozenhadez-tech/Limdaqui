"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { apiFetch } from "@/lib/api";
import { formatDate, type Category, type Product, type Quote } from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

type Stats = {
  products: number;
  categories: number;
  quotes: number;
  recentQuotes: Quote[];
};

const STAT_CARDS = [
  { key: "quotes", label: "Quotation requests", href: "/admin/orders" },
  { key: "products", label: "Products listed", href: "/admin/products" },
  { key: "categories", label: "Categories", href: "/admin/categories" },
] as const;

export default function AdminOverviewPage() {
  const authedFetch = useAuthedFetch();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<Product[]>("/api/products?limit=100"),
      apiFetch<Category[]>("/api/categories"),
      authedFetch<Quote[]>("/api/quotes?limit=100"),
    ])
      .then(([products, categories, quotes]) =>
        setStats({
          products: products.length,
          categories: categories.length,
          quotes: quotes.length,
          recentQuotes: quotes.slice(0, 5),
        }),
      )
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [authedFetch]);

  return (
    <>
      <p className="animate-fade-up text-[0.65rem] font-bold uppercase tracking-[0.24em] text-gray-400">
        Back office
      </p>
      <h1 className="animate-fade-up delay-1 mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">
        Overview
      </h1>

      {error && (
        <div className="mt-6 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {STAT_CARDS.map((card, i) => (
          <Link
            key={card.key}
            href={card.href}
            className={`animate-fade-up delay-${i + 1} group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-brand" />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {card.label}
              </p>
            </div>
            <p className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink">
              {stats ? stats[card.key] : "—"}
            </p>
            <p className="mt-2 text-xs font-medium text-gray-400 transition group-hover:text-brand">
              Manage →
            </p>
          </Link>
        ))}
      </div>

      <div className="animate-fade-up delay-3 mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
            Latest quotation requests
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-brand hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {!stats ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : stats.recentQuotes.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-400">
              No quotation requests yet. They&apos;ll land here as customers
              submit the public form.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.recentQuotes.map((q) => (
                <li key={q.id}>
                  <Link
                    href="/admin/orders"
                    className="flex items-center gap-4 px-6 py-4 transition hover:bg-gray-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white">
                      {q.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {q.name}
                        {q.company && (
                          <span className="font-normal text-gray-400"> · {q.company}</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-gray-500">{q.message}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatDate(q.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

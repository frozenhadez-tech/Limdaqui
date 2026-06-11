"use client";

import { useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice, type Category, type Product, type Quote } from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

type Row = Record<string, string | number>;

function toCsv(rows: Row[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
}

function download(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminReportsPage() {
  const authedFetch = useAuthedFetch();
  const { user: me } = useAuth();
  const canExportUsers = me?.role === "admin" || me?.role === "manager";

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<{ name: string; rows: Row[] }>) {
    setError(null);
    setDone(null);
    setBusy(key);
    try {
      const { name, rows } = await fn();
      if (rows.length === 0) {
        setError("Nothing to export yet — the report would be empty.");
        return;
      }
      download(name, toCsv(rows));
      setDone(`${name} downloaded (${rows.length} rows)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  const REPORTS = [
    {
      key: "products",
      title: "Product catalog",
      description: "All products with category, price, and current stock.",
      visible: true,
      fn: async () => {
        const products = await apiFetch<Product[]>("/api/products?limit=100");
        return {
          name: `limdaqui-products-${today()}.csv`,
          rows: products.map((p) => ({
            name: p.name,
            slug: p.slug,
            category: p.categoryName ?? "",
            price: formatPrice(p.priceCents, p.currency),
            currency: p.currency,
            stock: p.stock,
            created: p.createdAt,
          })),
        };
      },
    },
    {
      key: "quotes",
      title: "Quotation requests",
      description: "Every submitted quotation request with contact details.",
      visible: true,
      fn: async () => {
        const quotes = await authedFetch<Quote[]>("/api/quotes?limit=100");
        return {
          name: `limdaqui-quotations-${today()}.csv`,
          rows: quotes.map((q) => ({
            name: q.name,
            email: q.email,
            company: q.company ?? "",
            phone: q.phone ?? "",
            message: q.message,
            submitted: q.createdAt,
          })),
        };
      },
    },
    {
      key: "categories",
      title: "Categories",
      description: "All product categories and their slugs.",
      visible: true,
      fn: async () => {
        const categories = await apiFetch<Category[]>("/api/categories");
        return {
          name: `limdaqui-categories-${today()}.csv`,
          rows: categories.map((c) => ({
            name: c.name,
            slug: c.slug,
            created: c.createdAt,
          })),
        };
      },
    },
    {
      key: "users",
      title: "Users",
      description: "All accounts with role and status (admins and managers only).",
      visible: canExportUsers,
      fn: async () => {
        const users = await authedFetch<
          { email: string; fullName: string | null; role: string; status: string; createdAt: string }[]
        >("/api/users?limit=100");
        return {
          name: `limdaqui-users-${today()}.csv`,
          rows: users.map((u) => ({
            name: u.fullName ?? "",
            email: u.email,
            role: u.role,
            status: u.status,
            joined: u.createdAt,
          })),
        };
      },
    },
  ];

  return (
    <>
      <p className="animate-fade-up text-[0.65rem] font-bold uppercase tracking-[0.24em] text-gray-400">
        Back office
      </p>
      <h1 className="animate-fade-up delay-1 mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">
        Reports
      </h1>
      <p className="animate-fade-up delay-1 mt-2 text-sm text-gray-500">
        Generate CSV exports — they open in Excel or Google Sheets.
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
          {error}
        </div>
      )}
      {done && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          {done}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {REPORTS.filter((r) => r.visible).map((r, i) => (
          <div
            key={r.key}
            className={`animate-fade-up delay-${Math.min(i + 1, 4)} rounded-2xl border border-gray-100 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-brand" />
              <h2 className="font-display text-base font-extrabold tracking-tight text-ink">
                {r.title}
              </h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">{r.description}</p>
            <button
              onClick={() => run(r.key, r.fn)}
              disabled={busy !== null}
              className="mt-4 rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {busy === r.key ? "Generating…" : "Download CSV"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

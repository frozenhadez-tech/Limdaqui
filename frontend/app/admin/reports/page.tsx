"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  formatDate,
  formatPrice,
  PAYMENT_LABELS,
  type Category,
  type PaymentMethod,
  type Product,
  type Quote,
} from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

const field =
  "rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

type Row = Record<string, string | number>;

type SalesOrder = {
  id: string;
  status: string;
  paymentMethod: PaymentMethod;
  totalCents: number;
  currency: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  items: { name: string | null; quantity: number; unitPriceCents: number }[];
};

type PeriodType = "day" | "month" | "year";

type VisitCounts = { views: number; visitors: number };
type VisitStats = {
  allTime: VisitCounts;
  today: VisitCounts;
  thisMonth: VisitCounts;
};

function escapeCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Row[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCell(r[h] ?? "")).join(",")),
  ].join("\n");
}

/** Lines of cells -> CSV; allows mixed-width header/summary/table blocks. */
function linesToCsv(lines: (string | number)[][]): string {
  return lines.map((cells) => cells.map(escapeCell).join(",")).join("\n");
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

  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    authedFetch<VisitStats>("/api/visits/stats")
      .then(setVisitStats)
      .catch(() => {});
  }, [authedFetch]);

  const [periodType, setPeriodType] = useState<PeriodType>("day");
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [year, setYear] = useState(() => String(new Date().getFullYear()));

  function salesPeriod(): { from: Date; to: Date; label: string; slug: string } {
    if (periodType === "day") {
      const from = new Date(`${day}T00:00:00`);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      return {
        from,
        to,
        label: from.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        slug: day,
      };
    }
    if (periodType === "month") {
      const from = new Date(`${month}-01T00:00:00`);
      const to = new Date(from);
      to.setMonth(to.getMonth() + 1);
      return {
        from,
        to,
        label: from.toLocaleDateString("en-PH", { year: "numeric", month: "long" }),
        slug: month,
      };
    }
    const from = new Date(Number(year), 0, 1);
    const to = new Date(Number(year) + 1, 0, 1);
    return { from, to, label: year, slug: year };
  }

  async function generateSalesReport() {
    setError(null);
    setDone(null);
    setBusy("sales");
    try {
      const { from, to, label, slug } = salesPeriod();
      const orders = await authedFetch<SalesOrder[]>(
        `/api/orders/all?limit=500&from=${from.toISOString()}&to=${to.toISOString()}`,
      );
      // Cancelled orders are not sales.
      const sales = orders.filter((o) => o.status !== "cancelled");
      if (sales.length === 0) {
        setError(`No sales found for ${label}.`);
        return;
      }

      const units = sales.reduce(
        (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
        0,
      );
      const grossByCurrency = new Map<string, number>();
      for (const o of sales) {
        grossByCurrency.set(
          o.currency,
          (grossByCurrency.get(o.currency) ?? 0) + o.totalCents,
        );
      }

      const reporter = me ? `${me.fullName ?? me.email} (${me.email})` : "";
      const lines: (string | number)[][] = [
        ["Limdaqui Trading Inc. — Sales Report"],
        ["Period:", label],
        ["Generated:", formatDate(new Date().toISOString())],
        ["Reported by:", reporter],
        [],
        ["Summary"],
        ["Orders:", sales.length],
        ["Units sold:", units],
        ...[...grossByCurrency.entries()].map(([currency, cents]) => [
          `Gross sales (${currency}):`,
          formatPrice(cents, currency),
        ]),
        ["Note:", "Cancelled orders are excluded."],
        [],
        ["Order ID", "Date", "Customer", "Email", "Items", "Units", "Total", "Currency", "Payment", "Status"],
        ...sales.map((o) => [
          o.id.slice(0, 8),
          formatDate(o.createdAt),
          o.customerName ?? "",
          o.customerEmail ?? "",
          o.items.map((i) => `${i.name ?? "Removed product"} x${i.quantity}`).join("; "),
          o.items.reduce((s, i) => s + i.quantity, 0),
          formatPrice(o.totalCents, o.currency),
          o.currency,
          PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod,
          o.status,
        ]),
      ];

      const name = `limdaqui-sales-report-${slug}.csv`;
      download(name, linesToCsv(lines));
      setDone(`${name} downloaded (${sales.length} orders, ${units} units)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report failed");
    } finally {
      setBusy(null);
    }
  }

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

      <div className="animate-fade-up delay-1 mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm bg-brand" />
          <h2 className="font-display text-base font-extrabold tracking-tight text-ink">
            Site visitors
          </h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {(
            [
              { key: "today", label: "Today" },
              { key: "thisMonth", label: "This month" },
              { key: "allTime", label: "All time" },
            ] as const
          ).map((p) => (
            <div key={p.key} className="rounded-xl bg-gray-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {p.label}
              </p>
              <p className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
                {visitStats ? visitStats[p.key].visitors.toLocaleString() : "—"}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                unique visitors ·{" "}
                {visitStats ? visitStats[p.key].views.toLocaleString() : "—"} page
                views
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Counted anonymously on the public store (back-office browsing is
          excluded). Tracking starts from today — no historical data exists
          before this feature.
        </p>
      </div>

      <div className="animate-fade-up delay-2 mt-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm bg-brand" />
          <h2 className="font-display text-base font-extrabold tracking-tight text-ink">
            Sales report
          </h2>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Orders and revenue for a chosen day, month, or year — includes the
          period summary, who generated it, and when. Cancelled orders are
          excluded.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            className={field}
            aria-label="Report period type"
          >
            <option value="day">Day</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          {periodType === "day" && (
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className={field}
              aria-label="Report day"
            />
          )}
          {periodType === "month" && (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={field}
              aria-label="Report month"
            />
          )}
          {periodType === "year" && (
            <input
              type="number"
              min="2020"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={`${field} w-28`}
              aria-label="Report year"
            />
          )}
          <button
            onClick={generateSalesReport}
            disabled={busy !== null}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {busy === "sales" ? "Generating…" : "Generate report"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

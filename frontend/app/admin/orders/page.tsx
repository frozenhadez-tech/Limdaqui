"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/lib/auth";
import {
  formatDate,
  formatPrice,
  PAYMENT_LABELS,
  type PaymentMethod,
  type Quote,
} from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

const field =
  "rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

type AdminOrder = {
  id: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: string | null;
  shippingPhone: string | null;
  totalCents: number;
  currency: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  items: { name: string | null; quantity: number; unitPriceCents: number }[];
};

const STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-600",
  paid: "bg-blue-50 text-blue-600",
  shipped: "bg-indigo-50 text-indigo-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-gray-100 text-gray-500",
};

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export default function AdminOrdersPage() {
  const authedFetch = useAuthedFetch();
  const { user: me } = useAuth();
  // Staff can view orders; managers and admins update statuses.
  const canUpdate = me?.role === "admin" || me?.role === "manager";

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      authedFetch<AdminOrder[]>("/api/orders/all?limit=200"),
      authedFetch<Quote[]>("/api/quotes?limit=100"),
    ])
      .then(([o, q]) => {
        setOrders(o);
        setQuotes(q);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [authedFetch]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.customerEmail ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  async function updateStatus(id: string, status: OrderStatus) {
    setError(null);
    try {
      const updated = await authedFetch<AdminOrder>(
        `/api/orders/${id}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      setOrders((list) =>
        list?.map((o) =>
          o.id === id ? { ...o, status: updated.status } : o,
        ) ?? null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  }

  return (
    <>
      <p className="animate-fade-up text-[0.65rem] font-bold uppercase tracking-[0.24em] text-gray-400">
        Back office
      </p>
      <h1 className="animate-fade-up delay-1 mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">
        Order Management
      </h1>

      {error && (
        <div className="mt-6 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
          {error}
        </div>
      )}

      {/* ---- Manage Orders ---- */}
      <section className="animate-fade-up delay-2 mt-8">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          Manage Orders
        </h2>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="relative flex-1">
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${field} w-full pl-10`}
              placeholder="Search orders…"
              aria-label="Search orders by ID, customer name, or email"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | OrderStatus)
            }
            className={`${field} shrink-0 capitalize`}
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {!orders ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-12 text-center text-sm text-gray-400">
              {orders.length === 0
                ? "No orders yet — they'll appear here as customers check out."
                : "No orders match your search."}
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((o) => {
                  const open = openOrderId === o.id;
                  return [
                    <tr key={o.id} className="transition hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <button
                          onClick={() => setOpenOrderId(open ? null : o.id)}
                          title={open ? "Hide order items" : "Show order items"}
                          className="font-mono text-xs font-semibold text-ink hover:text-brand"
                        >
                          #{o.id.slice(0, 8)}
                        </button>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {formatDate(o.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">
                          {o.customerName ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {o.customerEmail ?? "deleted account"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-bold text-ink">
                        {formatPrice(o.totalCents, o.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canUpdate ? (
                          <select
                            value={o.status}
                            onChange={(e) =>
                              updateStatus(o.id, e.target.value as OrderStatus)
                            }
                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold capitalize outline-none transition focus:border-brand"
                            aria-label={`Update status of order ${o.id.slice(0, 8)}`}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="text-xs text-gray-300"
                            title="Managers and admins can update order status"
                          >
                            view only
                          </span>
                        )}
                      </td>
                    </tr>,
                    open ? (
                      <tr key={`${o.id}-items`} className="bg-gray-50/60">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="mb-3 flex flex-wrap gap-x-8 gap-y-1 text-xs text-gray-500">
                            <span>
                              <span className="font-semibold text-gray-600">Payment:</span>{" "}
                              {PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}
                            </span>
                            <span>
                              <span className="font-semibold text-gray-600">Deliver to:</span>{" "}
                              {o.shippingAddress ?? "—"}
                              {o.shippingPhone ? ` · ${o.shippingPhone}` : ""}
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {o.items.map((item, i) => (
                              <li
                                key={i}
                                className="flex justify-between text-sm text-gray-600"
                              >
                                <span>
                                  {item.name ?? "Removed product"}{" "}
                                  <span className="text-gray-400">
                                    × {item.quantity}
                                  </span>
                                </span>
                                <span>
                                  {formatPrice(
                                    item.unitPriceCents * item.quantity,
                                    o.currency,
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ---- Quotations ---- */}
      <section className="animate-fade-up delay-3 mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
            Quotations
          </h2>
          {quotes && (
            <span className="text-sm font-medium text-gray-400">
              {quotes.length} request{quotes.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="mt-4">
          {!quotes ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : quotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
              <p className="font-display text-base font-bold text-ink">Inbox zero</p>
              <p className="mt-1 text-sm text-gray-400">
                Quotation requests from the public form will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {quotes.map((q) => {
                const open = openQuoteId === q.id;
                return (
                  <li
                    key={q.id}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                  >
                    <button
                      onClick={() => setOpenQuoteId(open ? null : q.id)}
                      className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-gray-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white">
                        {q.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">
                          {q.name}
                          {q.company && (
                            <span className="font-medium text-gray-400">
                              {" "}· {q.company}
                            </span>
                          )}
                        </p>
                        <p className={`text-sm text-gray-500 ${open ? "" : "truncate"}`}>
                          {open ? "" : q.message}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-400">{formatDate(q.createdAt)}</p>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={`shrink-0 text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      >
                        <path
                          d="m6 9 6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {open && (
                      <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-5">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                          {q.message}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                          <a
                            href={`mailto:${q.email}?subject=Re: your quotation request to Limdaqui`}
                            className="font-bold text-brand hover:underline"
                          >
                            Reply by email →
                          </a>
                          <span>{q.email}</span>
                          {q.phone && <span>{q.phone}</span>}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

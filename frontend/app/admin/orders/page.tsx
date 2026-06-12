"use client";

import { useEffect, useMemo, useState } from "react";

import { API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  formatDate,
  formatPrice,
  PAYMENT_LABELS,
  type PaymentInfo,
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
  items: {
    name: string | null;
    quantity: number;
    unitPriceCents: number;
    variant: string | null;
  }[];
};

const PAGE_SIZE = 25;

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
  const { token } = useAuth();

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [page, setPage] = useState(1);
  const [quotePage, setQuotePage] = useState(1);
  const [viewing, setViewing] = useState<AdminOrder | null>(null);
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);

  const [payInfo, setPayInfo] = useState<PaymentInfo | null>(null);
  const [savingPayInfo, setSavingPayInfo] = useState(false);
  const [payInfoMsg, setPayInfoMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      authedFetch<AdminOrder[]>("/api/orders/all?limit=200"),
      authedFetch<Quote[]>("/api/quotes?limit=100"),
      authedFetch<PaymentInfo>("/api/settings/payment-info"),
    ])
      .then(([o, q, p]) => {
        setOrders(o);
        setQuotes(q);
        setPayInfo(p);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [authedFetch]);

  function updatePayInfo<S extends keyof PaymentInfo>(
    section: S,
    key: keyof PaymentInfo[S],
    value: string,
  ) {
    setPayInfo((p) =>
      p ? { ...p, [section]: { ...p[section], [key]: value } } : p,
    );
  }

  async function savePayInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!payInfo) return;
    setPayInfoMsg(null);
    setSavingPayInfo(true);
    try {
      const saved = await authedFetch<PaymentInfo>("/api/settings/payment-info", {
        method: "PUT",
        body: JSON.stringify(payInfo),
      });
      setPayInfo(saved);
      setPayInfoMsg({
        kind: "ok",
        text: "Saved — customers now see the updated details at checkout.",
      });
    } catch (err) {
      setPayInfoMsg({
        kind: "error",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSavingPayInfo(false);
    }
  }

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

  // A new search or filter starts back at the first page of its results.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

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

  const quoteTotalPages = Math.max(1, Math.ceil((quotes?.length ?? 0) / PAGE_SIZE));
  const currentQuotePage = Math.min(quotePage, quoteTotalPages);
  const visibleQuotes = (quotes ?? []).slice(
    (currentQuotePage - 1) * PAGE_SIZE,
    currentQuotePage * PAGE_SIZE,
  );

  function goToQuotePage(next: number) {
    setQuotePage(next);
    document
      .getElementById("quotations-section")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function downloadAttachment(q: Quote) {
    setError(null);
    try {
      // Authorized fetch -> blob -> anchor; a plain href can't carry the token.
      const res = await fetch(`${API_URL}/api/quotes/${q.id}/attachment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = q.attachmentName ?? "attachment";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }

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
      setViewing((v) => (v && v.id === id ? { ...v, status: updated.status } : v));
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
                {visible.map((o) => (
                  <tr key={o.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setViewing(o)}
                        title="View full order details"
                        className="font-mono text-xs font-semibold text-brand underline-offset-2 hover:underline"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > PAGE_SIZE && (
          <nav
            aria-label="Order pages"
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
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
          <p className="mt-3 text-center text-xs text-gray-400">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length} orders
          </p>
        )}
      </section>

      {/* ---- Payment Information ---- */}
      <section className="animate-fade-up delay-3 mt-12">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          Payment Information
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          These details are shown to customers at checkout when they choose
          GCash or Bank Transfer. Changes apply immediately.
        </p>

        {payInfoMsg && (
          <div
            className={`mt-4 rounded-lg px-4 py-2.5 text-sm ${
              payInfoMsg.kind === "error"
                ? "border border-brand/20 bg-brand/5 text-brand"
                : "border border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {payInfoMsg.text}
          </div>
        )}

        {!payInfo ? (
          <div className="mt-4 h-48 animate-pulse rounded-2xl bg-gray-100" />
        ) : (
          <form
            onSubmit={savePayInfo}
            className="mt-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  GCash
                </h3>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Account name
                  </label>
                  <input
                    value={payInfo.gcash.accountName}
                    onChange={(e) => updatePayInfo("gcash", "accountName", e.target.value)}
                    className={`${field} w-full`}
                    placeholder="e.g. Limdaqui Trading Inc."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    GCash number
                  </label>
                  <input
                    value={payInfo.gcash.accountNumber}
                    onChange={(e) => updatePayInfo("gcash", "accountNumber", e.target.value)}
                    className={`${field} w-full`}
                    placeholder="09xx xxx xxxx"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Notes <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    value={payInfo.gcash.notes}
                    onChange={(e) => updatePayInfo("gcash", "notes", e.target.value)}
                    className={`${field} w-full`}
                    placeholder="e.g. Send a screenshot of the receipt to our email"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  Bank Transfer
                </h3>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Bank name
                  </label>
                  <input
                    value={payInfo.bank.bankName}
                    onChange={(e) => updatePayInfo("bank", "bankName", e.target.value)}
                    className={`${field} w-full`}
                    placeholder="e.g. BDO"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Account name
                  </label>
                  <input
                    value={payInfo.bank.accountName}
                    onChange={(e) => updatePayInfo("bank", "accountName", e.target.value)}
                    className={`${field} w-full`}
                    placeholder="e.g. Limdaqui Trading Inc."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Account number
                  </label>
                  <input
                    value={payInfo.bank.accountNumber}
                    onChange={(e) => updatePayInfo("bank", "accountNumber", e.target.value)}
                    className={`${field} w-full`}
                    placeholder="xxxx-xxxx-xxxx"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Notes <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    value={payInfo.bank.notes}
                    onChange={(e) => updatePayInfo("bank", "notes", e.target.value)}
                    className={`${field} w-full`}
                    placeholder="e.g. Use the order ID as the transfer reference"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPayInfo}
              className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {savingPayInfo ? "Saving…" : "Save payment information"}
            </button>
          </form>
        )}
      </section>

      {/* ---- Quotations ---- */}
      <section id="quotations-section" className="animate-fade-up delay-3 mt-12">
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
              {visibleQuotes.map((q) => {
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
                        <p className="flex items-center gap-1.5 truncate text-sm font-bold text-ink">
                          {q.name}
                          {q.company && (
                            <span className="font-medium text-gray-400">
                              {" "}· {q.company}
                            </span>
                          )}
                          {q.attachmentId && (
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-label="Has attachment"
                              className="shrink-0 text-gray-400"
                            >
                              <path
                                d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L16 7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
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
                          {q.attachmentId && (
                            <button
                              onClick={() => downloadAttachment(q)}
                              title={`Download ${q.attachmentName}`}
                              className="font-bold text-ink underline-offset-2 hover:underline"
                            >
                              📎 {q.attachmentName}
                            </button>
                          )}
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

        {(quotes?.length ?? 0) > PAGE_SIZE && (
          <nav
            aria-label="Quotation pages"
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            <button
              onClick={() => goToQuotePage(currentQuotePage - 1)}
              disabled={currentQuotePage === 1}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
            >
              ‹ Prev
            </button>
            {Array.from({ length: quoteTotalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => goToQuotePage(n)}
                aria-current={n === currentQuotePage ? "page" : undefined}
                className={`h-10 w-10 rounded-full text-sm font-bold transition ${
                  n === currentQuotePage
                    ? "bg-brand text-white shadow-sm shadow-brand/20"
                    : "border border-gray-200 text-gray-600 hover:border-brand hover:text-brand"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => goToQuotePage(currentQuotePage + 1)}
              disabled={currentQuotePage === quoteTotalPages}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
            >
              Next ›
            </button>
          </nav>
        )}

        {(quotes?.length ?? 0) > 0 && (
          <p className="mt-3 text-center text-xs text-gray-400">
            Showing {(currentQuotePage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentQuotePage * PAGE_SIZE, quotes!.length)} of{" "}
            {quotes!.length} requests
          </p>
        )}
      </section>

      {/* ---- Order details popup ---- */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="animate-fade-in absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => setViewing(null)}
          />
          <div className="animate-fade-up relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
                  Order <span className="font-mono">#{viewing.id.slice(0, 8)}</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatDate(viewing.createdAt)} · ref{" "}
                  <span className="font-mono">{viewing.id}</span>
                </p>
              </div>
              <button
                onClick={() => setViewing(null)}
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

            <dl className="mt-5 space-y-2.5 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">Customer</dt>
                <dd className="text-right font-semibold text-ink">
                  {viewing.customerName ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">Email</dt>
                <dd className="text-right text-gray-700">
                  {viewing.customerEmail ?? "deleted account"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">Payment method</dt>
                <dd className="text-right font-semibold text-ink">
                  {PAYMENT_LABELS[viewing.paymentMethod] ?? viewing.paymentMethod}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-gray-400">Deliver to</dt>
                <dd className="text-right text-gray-700">
                  {viewing.shippingAddress ?? "—"}
                </dd>
              </div>
              {viewing.shippingPhone && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Contact number</dt>
                  <dd className="text-right text-gray-700">{viewing.shippingPhone}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Items
              </p>
              <ul className="mt-2 space-y-1.5">
                {viewing.items.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm text-gray-700">
                    <span>
                      {item.name ?? "Removed product"}
                      {item.variant && (
                        <span className="text-gray-400"> ({item.variant})</span>
                      )}{" "}
                      <span className="text-gray-400">× {item.quantity}</span>
                    </span>
                    <span>
                      {formatPrice(item.unitPriceCents * item.quantity, viewing.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-sm">
                <span className="font-bold text-ink">Total</span>
                <span className="font-bold text-ink">
                  {formatPrice(viewing.totalCents, viewing.currency)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">Status</span>
                <StatusPill status={viewing.status} />
              </div>
              <select
                value={viewing.status}
                onChange={(e) =>
                  updateStatus(viewing.id, e.target.value as OrderStatus)
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold capitalize outline-none transition focus:border-brand"
                aria-label="Update order status"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useAuth, type User } from "@/lib/auth";
import { formatDate, formatPrice, PAYMENT_LABELS, type Order } from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

const field =
  "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "bg-amber-50 text-amber-600",
  paid: "bg-blue-50 text-blue-600",
  shipped: "bg-indigo-50 text-indigo-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-gray-100 text-gray-500",
};

// Customer-facing stages of an order, mapped to internal statuses.
const ORDER_TABS: { key: "all" | Order["status"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "To Pay" },
  { key: "paid", label: "To Ship" },
  { key: "shipped", label: "To Receive" },
  { key: "delivered", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

type Msg = { kind: "error" | "ok"; text: string };

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="font-display text-base font-extrabold tracking-tight text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Banner({ kind, text }: Msg) {
  return (
    <div
      className={`mt-4 rounded-lg px-4 py-2.5 text-sm ${
        kind === "error"
          ? "border border-brand/20 bg-brand/5 text-brand"
          : "border border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {text}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const authedFetch = useAuthedFetch();

  const [fullName, setFullName] = useState("");
  const [nameMsg, setNameMsg] = useState<Msg | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [contactMsg, setContactMsg] = useState<Msg | null>(null);
  const [savingContact, setSavingContact] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<Msg | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderTab, setOrderTab] = useState<"all" | Order["status"]>("all");
  const [orderSearch, setOrderSearch] = useState("");

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders ?? []) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      if (orderTab !== "all" && o.status !== orderTab) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.items.some((i) => (i.name ?? "").toLowerCase().includes(q))
      );
    });
  }, [orders, orderTab, orderSearch]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? "");
      setPhone(user.phone ?? "");
      setAddress(user.address ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    authedFetch<Order[]>("/api/orders")
      .then(setOrders)
      .catch((err) =>
        setOrdersError(err instanceof Error ? err.message : "Failed to load orders"),
      );
  }, [user, authedFetch]);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">
            Sign in required
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Log in to view your profile and order history.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    setSavingName(true);
    try {
      const data = await authedFetch<{ user: User }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName: fullName.trim() || null }),
      });
      updateUser(data.user);
      setNameMsg({ kind: "ok", text: "Profile updated" });
    } catch (err) {
      setNameMsg({
        kind: "error",
        text: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setSavingName(false);
    }
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setContactMsg(null);
    setSavingContact(true);
    try {
      const data = await authedFetch<{ user: User }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          phone: phone.trim() || null,
          address: address.trim() || null,
        }),
      });
      updateUser(data.user);
      setContactMsg({ kind: "ok", text: "Contact information saved" });
    } catch (err) {
      setContactMsg({
        kind: "error",
        text: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setSavingContact(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setSavingPw(true);
    try {
      await authedFetch("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setPwMsg({ kind: "ok", text: "Password changed successfully" });
    } catch (err) {
      setPwMsg({
        kind: "error",
        text: err instanceof Error ? err.message : "Change failed",
      });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          {user.fullName ?? user.email.split("@")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{user.email}</p>
        <button
          onClick={() => {
            setPwMsg(null);
            setCurrentPassword("");
            setNewPassword("");
            setPwOpen(true);
          }}
          className="mt-3 rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-brand hover:text-brand"
        >
          Reset password
        </button>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card title="Account">
            {nameMsg && <Banner {...nameMsg} />}
            <form onSubmit={saveName} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={field}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  value={user.email}
                  disabled
                  className={`${field} bg-gray-50 text-gray-400`}
                  title="Email address cannot be changed"
                />
              </div>
              <button
                type="submit"
                disabled={savingName}
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {savingName ? "Saving…" : "Save changes"}
              </button>
            </form>
          </Card>

          <Card title="Address & Contact Information">
            {contactMsg && <Banner {...contactMsg} />}
            <form onSubmit={saveContact} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Contact number
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={field}
                  placeholder="+63 ..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  rows={3}
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={field}
                  placeholder="House/Unit No., Street, Barangay, City, Province, ZIP"
                />
              </div>
              <button
                type="submit"
                disabled={savingContact}
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {savingContact ? "Saving…" : "Save contact info"}
              </button>
            </form>
          </Card>
        </div>

        <div className="mt-6">
          <Card title="Order history">
            {ordersError && <Banner kind="error" text={ordersError} />}
            {!orders ? (
              <div className="mt-4 space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="mt-4 text-sm text-gray-400">
                No orders yet —{" "}
                <Link href="/products" className="font-semibold text-brand hover:underline">
                  browse the catalog
                </Link>{" "}
                to place your first one.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-b border-gray-100">
                  {ORDER_TABS.map((t) => {
                    const count =
                      t.key === "all" ? orders.length : statusCounts[t.key] ?? 0;
                    const active = orderTab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setOrderTab(t.key)}
                        aria-current={active ? "true" : undefined}
                        className={`-mb-px border-b-2 pb-2.5 text-sm transition ${
                          active
                            ? "border-brand font-semibold text-brand"
                            : "border-transparent font-medium text-gray-600 hover:text-brand"
                        }`}
                      >
                        {t.label}
                        {t.key !== "all" && count > 0 && (
                          <span className={active ? "" : "text-brand"}> ({count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="relative mt-4">
                  <svg
                    width="15"
                    height="15"
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
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="You can search by Order ID or product name"
                    aria-label="Search your orders"
                    className="w-full rounded-lg bg-gray-100 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                {filteredOrders.length === 0 ? (
                  <p className="mt-6 text-center text-sm text-gray-400">
                    No orders here yet.
                  </p>
                ) : (
              <ul className="mt-2 divide-y divide-gray-100">
                {filteredOrders.map((o) => (
                  <li key={o.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="font-mono text-xs text-gray-400">
                        #{o.id.slice(0, 8)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[o.status]}`}
                      >
                        {o.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(o.createdAt)}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        {PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}
                      </span>
                      <span className="ml-auto font-bold text-ink">
                        {formatPrice(o.totalCents, o.currency)}
                      </span>
                    </div>
                    {o.shippingAddress && (
                      <p className="mt-1 text-xs text-gray-400">
                        Deliver to: {o.shippingAddress}
                        {o.shippingPhone ? ` · ${o.shippingPhone}` : ""}
                      </p>
                    )}
                    <ul className="mt-2 space-y-1">
                      {o.items.map((item) => (
                        <li
                          key={item.productId}
                          className="flex justify-between text-sm text-gray-600"
                        >
                          <span>
                            {item.name ?? "Removed product"}
                            {item.variant && (
                              <span className="text-gray-400"> ({item.variant})</span>
                            )}{" "}
                            <span className="text-gray-400">× {item.quantity}</span>
                          </span>
                          <span>
                            {formatPrice(item.unitPriceCents * item.quantity, o.currency)}
                          </span>
                        </li>
                      ))}
                      {o.shippingFeeCents > 0 && (
                        <li className="flex justify-between text-sm text-gray-500">
                          <span>Shipping fee</span>
                          <span>{formatPrice(o.shippingFeeCents, o.currency)}</span>
                        </li>
                      )}
                    </ul>
                  </li>
                ))}
              </ul>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Reset password modal */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="animate-fade-in absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => !savingPw && setPwOpen(false)}
          />
          <div className="animate-fade-up relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
                Reset password
              </h2>
              <button
                onClick={() => setPwOpen(false)}
                disabled={savingPw}
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

            {pwMsg && <Banner {...pwMsg} />}

            <form onSubmit={changePassword} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Current password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  New password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={field}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={savingPw}
                  className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {savingPw ? "Changing…" : "Change password"}
                </button>
                <button
                  type="button"
                  onClick={() => setPwOpen(false)}
                  disabled={savingPw}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

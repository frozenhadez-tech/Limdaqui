"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useAuth, type User } from "@/lib/auth";
import { formatDate, formatPrice, type Order } from "@/lib/types";
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

function Banner({ kind, text }: { kind: "error" | "ok"; text: string }) {
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
  const [nameMsg, setNameMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (user) setFullName(user.fullName ?? "");
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
      setPwMsg({ kind: "ok", text: "Password changed" });
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
          My Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500">{user.email}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card title="Account">
            {nameMsg && <Banner kind={nameMsg.kind} text={nameMsg.text} />}
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

          <Card title="Security">
            {pwMsg && <Banner kind={pwMsg.kind} text={pwMsg.text} />}
            <form onSubmit={changePassword} className="mt-4 space-y-4">
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
              <button
                type="submit"
                disabled={savingPw}
                className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-700 transition hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {savingPw ? "Changing…" : "Change password"}
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
              <ul className="mt-4 divide-y divide-gray-100">
                {orders.map((o) => (
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
                      <span className="ml-auto font-bold text-ink">
                        {formatPrice(o.totalCents, o.currency)}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {o.items.map((item) => (
                        <li
                          key={item.productId}
                          className="flex justify-between text-sm text-gray-600"
                        >
                          <span>
                            {item.name ?? "Removed product"}{" "}
                            <span className="text-gray-400">× {item.quantity}</span>
                          </span>
                          <span>
                            {formatPrice(item.unitPriceCents * item.quantity, o.currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

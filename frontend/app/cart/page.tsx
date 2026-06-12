"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { apiFetch, resolveImageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import {
  formatPrice,
  PAYMENT_LABELS,
  type PaymentInfo,
  type PaymentMethod,
  type Product,
  type ShippingSettings,
} from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

type CartRow = Product & { quantity: number; variant: string | null };

const checkoutField =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function CartPage() {
  const { lines, setQuantity, remove, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const authedFetch = useAuthedFetch();

  const [products, setProducts] = useState<Map<string, Product> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [payInfo, setPayInfo] = useState<PaymentInfo | null>(null);
  const [shipping, setShipping] = useState<ShippingSettings | null>(null);

  // Payment instructions and shipping fee maintained by the back office.
  useEffect(() => {
    apiFetch<PaymentInfo>("/api/settings/payment-info")
      .then(setPayInfo)
      .catch(() => {});
    apiFetch<ShippingSettings>("/api/settings/shipping-fee")
      .then(setShipping)
      .catch(() => {});
  }, []);

  // Prefill delivery details from the customer's profile.
  useEffect(() => {
    if (user) {
      setShippingAddress((current) => current || (user.address ?? ""));
      setShippingPhone((current) => current || (user.phone ?? ""));
    }
  }, [user]);

  // Load details for every product in the cart; silently drop deleted ones.
  useEffect(() => {
    let cancelled = false;
    if (lines.length === 0) {
      setProducts(new Map());
      return;
    }
    const uniqueIds = [...new Set(lines.map((l) => l.productId))];
    Promise.all(
      uniqueIds.map((id) =>
        apiFetch<Product>(`/api/products/${id}`).catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      setProducts(
        new Map(
          results.filter((p): p is Product => p !== null).map((p) => [p.id, p]),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
    // Refetch only when the set of product ids changes, not on qty changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [[...new Set(lines.map((l) => l.productId))].join(",")]);

  const rows: CartRow[] = useMemo(() => {
    if (!products) return [];
    return lines
      .map((l) => {
        const p = products.get(l.productId);
        return p ? { ...p, quantity: l.quantity, variant: l.variant ?? null } : null;
      })
      .filter((r): r is CartRow => r !== null);
  }, [lines, products]);

  const totalsByCurrency = useMemo(() => {
    const totals = new Map<string, number>();
    for (const r of rows) {
      totals.set(
        r.currency,
        (totals.get(r.currency) ?? 0) + r.priceCents * r.quantity,
      );
    }
    return [...totals.entries()];
  }, [rows]);

  const mixedCurrencies = totalsByCurrency.length > 1;

  async function checkout() {
    setError(null);
    setPlacing(true);
    try {
      const order = await authedFetch<{ id: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: rows.map((r) => ({
            productId: r.id,
            quantity: r.quantity,
            ...(r.variant ? { variant: r.variant } : {}),
          })),
          paymentMethod,
          shippingAddress: shippingAddress.trim(),
          ...(shippingPhone.trim() ? { shippingPhone: shippingPhone.trim() } : {}),
        }),
      });
      clear();
      setPlacedOrderId(order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setPlacing(false);
    }
  }

  if (authLoading) {
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
            Log in to view your cart, see prices, and check out.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              Go to login
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-brand hover:text-brand"
            >
              Create an account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (placedOrderId) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-50 px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m5 13 4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-xl font-extrabold tracking-tight text-ink">
            Order placed
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Reference{" "}
            <span className="font-mono text-xs">{placedOrderId.slice(0, 8)}</span>.
            Track it from your profile.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/profile"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              View my orders
            </Link>
            <Link
              href="/products"
              className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-brand hover:text-brand"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Your Cart
        </h1>

        {error && (
          <div className="mt-6 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
            {error}
          </div>
        )}

        {!products ? (
          <div className="mt-8 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-14 text-center">
            <p className="font-display text-lg font-bold text-ink">
              Your cart is empty
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Browse the catalog and add products to get started.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              Shop products
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
            <ul className="space-y-3">
              {rows.map((r) => (
                <li
                  key={`${r.id}|${r.variant ?? ""}`}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  {r.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(r.imageUrl)!}
                      alt={r.name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{r.name}</p>
                    {r.variant && (
                      <p className="text-xs text-gray-400">{r.variant}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {formatPrice(r.priceCents, r.currency)}
                      {r.quantity > r.stock && (
                        <span className="ml-2 text-xs font-semibold text-amber-600">
                          Only {r.stock} in stock
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuantity(r.id, r.variant, r.quantity - 1)}
                      aria-label={`Decrease quantity of ${r.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-brand hover:text-brand"
                    >
                      −
                    </button>
                    <span className="w-9 text-center text-sm font-bold text-ink">
                      {r.quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(r.id, r.variant, Math.min(r.quantity + 1, r.stock))
                      }
                      disabled={r.quantity >= r.stock}
                      aria-label={`Increase quantity of ${r.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <p className="w-24 text-right font-bold text-ink">
                    {formatPrice(r.priceCents * r.quantity, r.currency)}
                  </p>
                  <button
                    onClick={() => remove(r.id, r.variant)}
                    title={`Remove ${r.name} from cart`}
                    aria-label={`Remove ${r.name} from cart`}
                    className="rounded-full p-2 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="font-display text-base font-extrabold tracking-tight text-ink">
                Summary
              </h2>
              <dl className="mt-4 space-y-2 text-sm">
                {totalsByCurrency.map(([currency, cents]) => {
                  const fee =
                    !mixedCurrencies && shipping
                      ? shipping.freeAboveCents !== null &&
                        cents >= shipping.freeAboveCents
                        ? 0
                        : shipping.feeCents
                      : 0;
                  return (
                    <div key={currency} className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Subtotal</dt>
                        <dd className="font-medium text-ink">
                          {formatPrice(cents, currency)}
                        </dd>
                      </div>
                      {!mixedCurrencies && shipping && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Shipping fee</dt>
                          <dd className="font-medium text-ink">
                            {fee === 0 && shipping.feeCents > 0 ? (
                              <span className="font-semibold text-green-600">FREE</span>
                            ) : (
                              formatPrice(fee, currency)
                            )}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-gray-100 pt-2">
                        <dt className="font-semibold text-ink">Total</dt>
                        <dd className="font-bold text-ink">
                          {formatPrice(cents + fee, currency)}
                        </dd>
                      </div>
                      {!mixedCurrencies &&
                        shipping?.freeAboveCents != null &&
                        cents < shipping.freeAboveCents && (
                          <p className="text-xs text-gray-400">
                            Free shipping on orders of{" "}
                            {formatPrice(shipping.freeAboveCents, currency)} or more.
                          </p>
                        )}
                    </div>
                  );
                })}
              </dl>

              {mixedCurrencies && (
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Orders can only contain one currency. Remove items so all
                  prices share a currency before checking out.
                </p>
              )}

              <>
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="text-sm font-semibold text-ink">Payment method</p>
                    <div className="mt-2 space-y-2">
                      {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                        <div key={m}>
                          <label
                            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm transition ${
                              paymentMethod === m
                                ? "border-brand bg-brand/5 font-semibold text-ink"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={m}
                              checked={paymentMethod === m}
                              onChange={() => setPaymentMethod(m)}
                              className="accent-[#e2231a]"
                            />
                            {PAYMENT_LABELS[m]}
                          </label>

                          {paymentMethod === m && m === "gcash" && (
                            <div className="mt-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 text-xs text-gray-600">
                              {payInfo?.gcash.accountNumber ? (
                                <dl className="space-y-1">
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-400">Account name</dt>
                                    <dd className="font-semibold text-ink">
                                      {payInfo.gcash.accountName || "—"}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-400">GCash number</dt>
                                    <dd className="font-semibold text-ink">
                                      {payInfo.gcash.accountNumber}
                                    </dd>
                                  </div>
                                  {payInfo.gcash.notes && (
                                    <p className="pt-1 text-gray-500">{payInfo.gcash.notes}</p>
                                  )}
                                  <p className="pt-1 text-gray-400">
                                    Send your payment to this account — we&apos;ll
                                    confirm it and mark your order as paid.
                                  </p>
                                </dl>
                              ) : (
                                <p>
                                  Our team will send the GCash payment details
                                  after you place your order.
                                </p>
                              )}
                            </div>
                          )}

                          {paymentMethod === m && m === "bank_transfer" && (
                            <div className="mt-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 text-xs text-gray-600">
                              {payInfo?.bank.accountNumber ? (
                                <dl className="space-y-1">
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-400">Bank</dt>
                                    <dd className="font-semibold text-ink">
                                      {payInfo.bank.bankName || "—"}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-400">Account name</dt>
                                    <dd className="font-semibold text-ink">
                                      {payInfo.bank.accountName || "—"}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-400">Account number</dt>
                                    <dd className="font-semibold text-ink">
                                      {payInfo.bank.accountNumber}
                                    </dd>
                                  </div>
                                  {payInfo.bank.notes && (
                                    <p className="pt-1 text-gray-500">{payInfo.bank.notes}</p>
                                  )}
                                  <p className="pt-1 text-gray-400">
                                    Transfer your payment to this account —
                                    we&apos;ll confirm it and mark your order as paid.
                                  </p>
                                </dl>
                              ) : (
                                <p>
                                  Our team will send the bank transfer details
                                  after you place your order.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="text-sm font-semibold text-ink">Deliver to</p>
                    <textarea
                      rows={3}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className={`${checkoutField} mt-2`}
                      placeholder="House/Unit No., Street, Barangay, City, Province, ZIP"
                      aria-label="Delivery address"
                    />
                    <input
                      type="tel"
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      className={`${checkoutField} mt-2`}
                      placeholder="Contact number (optional)"
                      aria-label="Contact number"
                    />
                  </div>

                  <button
                    onClick={checkout}
                    disabled={placing || mixedCurrencies || !shippingAddress.trim()}
                    title={
                      !shippingAddress.trim()
                        ? "Enter a delivery address to place your order"
                        : undefined
                    }
                    className="mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
                  >
                    {placing ? "Placing order…" : "Place order"}
                  </button>
              </>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

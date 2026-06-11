"use client";

import Link from "next/link";

import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/types";

/**
 * Shows a product price to signed-in users only; guests get a login prompt.
 */
export function PriceTag({
  cents,
  currency,
  className = "text-lg font-bold text-ink",
}: {
  cents: number;
  currency: string;
  className?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <span className="inline-block h-5 w-16 animate-pulse rounded bg-gray-100" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs font-semibold text-brand hover:underline"
        title="Prices are visible to registered customers"
      >
        Log in to view price
      </Link>
    );
  }

  return <span className={className}>{formatPrice(cents, currency)}</span>;
}

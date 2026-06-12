"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const { add } = useCart();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Like prices, the cart is for signed-in customers only.
  if (!user) return null;

  if (disabled) {
    return (
      <button
        disabled
        title="This product is out of stock"
        className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-bold text-gray-300"
      >
        Out of stock
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        add(productId);
        setAdded(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1500);
      }}
      title="Add this item to your cart"
      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
        added
          ? "bg-green-600 text-white"
          : "bg-brand text-white hover:bg-brand-600"
      }`}
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}

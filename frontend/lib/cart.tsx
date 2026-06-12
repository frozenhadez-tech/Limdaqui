"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type CartLine = {
  productId: string;
  quantity: number;
  /** Chosen options, e.g. "Black / L"; null for products without options. */
  variant: string | null;
};

type CartContextValue = {
  lines: CartLine[];
  /** Total number of units across all lines (shown on the header badge). */
  count: number;
  add: (productId: string, quantity?: number, variant?: string | null) => void;
  setQuantity: (productId: string, variant: string | null, quantity: number) => void;
  remove: (productId: string, variant: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "limdaqui_cart";

function sameLine(l: CartLine, productId: string, variant: string | null) {
  return l.productId === productId && (l.variant ?? null) === (variant ?? null);
}

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is CartLine =>
          typeof l?.productId === "string" &&
          Number.isInteger(l?.quantity) &&
          l.quantity > 0,
      )
      .map((l) => ({ ...l, variant: l.variant ?? null }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  // Hydrate after mount so the server-rendered markup matches the first paint.
  useEffect(() => {
    setLines(readStored());
  }, []);

  const mutate = useCallback((fn: (prev: CartLine[]) => CartLine[]) => {
    setLines((prev) => {
      const next = fn(prev);
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const add = useCallback(
    (productId: string, quantity = 1, variant: string | null = null) => {
      mutate((prev) => {
        const existing = prev.find((l) => sameLine(l, productId, variant));
        return existing
          ? prev.map((l) =>
              sameLine(l, productId, variant)
                ? { ...l, quantity: l.quantity + quantity }
                : l,
            )
          : [...prev, { productId, quantity, variant: variant ?? null }];
      });
    },
    [mutate],
  );

  const setQuantity = useCallback(
    (productId: string, variant: string | null, quantity: number) => {
      mutate((prev) =>
        quantity <= 0
          ? prev.filter((l) => !sameLine(l, productId, variant))
          : prev.map((l) =>
              sameLine(l, productId, variant) ? { ...l, quantity } : l,
            ),
      );
    },
    [mutate],
  );

  const remove = useCallback(
    (productId: string, variant: string | null) =>
      setQuantity(productId, variant, 0),
    [setQuantity],
  );

  const clear = useCallback(() => mutate(() => []), [mutate]);

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider
      value={{ lines, count, add, setQuantity, remove, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type CartLine = { productId: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  /** Total number of units across all lines (shown on the header badge). */
  count: number;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "limdaqui_cart";

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l?.productId === "string" &&
        Number.isInteger(l?.quantity) &&
        l.quantity > 0,
    );
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

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  }, []);

  const add = useCallback(
    (productId: string, quantity = 1) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === productId);
        const next = existing
          ? prev.map((l) =>
              l.productId === productId
                ? { ...l, quantity: l.quantity + quantity }
                : l,
            )
          : [...prev, { productId, quantity }];
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      setLines((prev) => {
        const next =
          quantity <= 0
            ? prev.filter((l) => l.productId !== productId)
            : prev.map((l) =>
                l.productId === productId ? { ...l, quantity } : l,
              );
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const remove = useCallback(
    (productId: string) => setQuantity(productId, 0),
    [setQuantity],
  );

  const clear = useCallback(() => persist([]), [persist]);

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

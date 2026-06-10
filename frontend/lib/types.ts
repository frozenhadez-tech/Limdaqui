export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  currency: string;
  stock: number;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  createdAt: string;
};

export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

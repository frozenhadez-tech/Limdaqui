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

export type Quote = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string;
  createdAt: string;
};

export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

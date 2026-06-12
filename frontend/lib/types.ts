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
  colors: string[] | null;
  sizes: string[] | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  createdAt: string;
};

export type OrderItem = {
  orderId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  variant: string | null;
  name: string | null;
  imageUrl: string | null;
};

export type PaymentMethod = "cod" | "gcash" | "bank_transfer";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  gcash: "GCash",
  bank_transfer: "Bank Transfer",
};

export type PaymentInfo = {
  gcash: { accountName: string; accountNumber: string; notes: string };
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    notes: string;
  };
};

export type Order = {
  id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  paymentMethod: PaymentMethod;
  shippingAddress: string | null;
  shippingPhone: string | null;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
};

export type Quote = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string;
  createdAt: string;
  attachmentId: string | null;
  attachmentName: string | null;
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

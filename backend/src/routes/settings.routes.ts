import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { settings } from "../db/schema.js";
import { requireAuth, requireBackOffice } from "../middleware/auth.js";

const router = Router();

const PAYMENT_INFO_KEY = "payment_info";

const paymentInfoSchema = z.object({
  gcash: z.object({
    accountName: z.string().max(120).default(""),
    accountNumber: z.string().max(60).default(""),
    notes: z.string().max(300).default(""),
  }),
  bank: z.object({
    bankName: z.string().max(120).default(""),
    accountName: z.string().max(120).default(""),
    accountNumber: z.string().max(60).default(""),
    notes: z.string().max(300).default(""),
  }),
});

export type PaymentInfo = z.infer<typeof paymentInfoSchema>;

const EMPTY_PAYMENT_INFO: PaymentInfo = {
  gcash: { accountName: "", accountNumber: "", notes: "" },
  bank: { bankName: "", accountName: "", accountNumber: "", notes: "" },
};

// GET /api/settings/payment-info — public: customers see this at checkout
router.get("/payment-info", async (_req, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, PAYMENT_INFO_KEY));
    if (!row) {
      res.json(EMPTY_PAYMENT_INFO);
      return;
    }
    try {
      res.json(paymentInfoSchema.parse(JSON.parse(row.value)));
    } catch {
      res.json(EMPTY_PAYMENT_INFO);
    }
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings/payment-info — back office (staff and up) can update
router.put(
  "/payment-info",
  requireAuth,
  requireBackOffice,
  async (req, res, next) => {
    try {
      const data = paymentInfoSchema.parse(req.body);
      const value = JSON.stringify(data);
      await db
        .insert(settings)
        .values({ key: PAYMENT_INFO_KEY, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: new Date() },
        });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

const SHIPPING_KEY = "shipping_fee";

const shippingSchema = z.object({
  // Flat fee added to every order, in the order's currency.
  feeCents: z.number().int().min(0).max(100_000_000).default(0),
  // Subtotal at or above which shipping is free; null disables.
  freeAboveCents: z.number().int().min(0).max(1_000_000_000).nullable().default(null),
});

export type ShippingSettings = z.infer<typeof shippingSchema>;

const DEFAULT_SHIPPING: ShippingSettings = { feeCents: 0, freeAboveCents: null };

export async function getShippingSettings(): Promise<ShippingSettings> {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, SHIPPING_KEY));
  if (!row) return DEFAULT_SHIPPING;
  try {
    return shippingSchema.parse(JSON.parse(row.value));
  } catch {
    return DEFAULT_SHIPPING;
  }
}

// GET /api/settings/shipping-fee — public: shown in the cart summary
router.get("/shipping-fee", async (_req, res, next) => {
  try {
    res.json(await getShippingSettings());
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings/shipping-fee — back office (staff and up)
router.put(
  "/shipping-fee",
  requireAuth,
  requireBackOffice,
  async (req, res, next) => {
    try {
      const data = shippingSchema.parse(req.body);
      const value = JSON.stringify(data);
      await db
        .insert(settings)
        .values({ key: SHIPPING_KEY, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: new Date() },
        });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

export default router;

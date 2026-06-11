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

export default router;

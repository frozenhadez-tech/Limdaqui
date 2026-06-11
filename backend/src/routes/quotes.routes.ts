import { desc } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { quotes } from "../db/schema.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

const quoteSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  company: z.string().max(255).optional(),
  phone: z.string().max(60).optional(),
  message: z.string().min(1).max(5000),
});

// POST /api/quotes — submit a quotation request (public)
router.post("/", async (req, res, next) => {
  try {
    const data = quoteSchema.parse(req.body);
    const [row] = await db.insert(quotes).values(data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// GET /api/quotes — list submissions (admin only)
router.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const rows = await db.select().from(quotes).orderBy(desc(quotes.createdAt));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;

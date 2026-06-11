import { desc } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { quotes } from "../db/schema.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { quoteLimiter } from "../middleware/rateLimit.js";

const router = Router();

const quoteSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  company: z.string().max(255).optional(),
  phone: z.string().max(60).optional(),
  message: z.string().min(1).max(5000),
});

// POST /api/quotes — submit a quotation request (public)
router.post("/", quoteLimiter, async (req, res, next) => {
  try {
    const data = quoteSchema.parse(req.body);
    const [row] = await db.insert(quotes).values(data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// GET /api/quotes?limit=&offset= — list submissions (admin only)
router.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const query = z
      .object({
        limit: z.coerce.number().int().min(1).max(100).default(50),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .parse(req.query);

    const rows = await db
      .select()
      .from(quotes)
      .orderBy(desc(quotes.createdAt))
      .limit(query.limit)
      .offset(query.offset);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;

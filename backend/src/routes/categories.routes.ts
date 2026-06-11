import { asc } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { categories } from "../db/schema.js";
import { requireAuth, requireBackOffice } from "../middleware/auth.js";

const router = Router();

const createCategorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, or hyphens"),
});

// GET /api/categories — list all categories
router.get("/", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories — create a category (staff and up)
router.post("/", requireAuth, requireBackOffice, async (req, res, next) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const [row] = await db.insert(categories).values(data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

export default router;

import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { categories, products } from "../db/schema.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

const productInput = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(280)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, or hyphens"),
  description: z.string().max(5000).optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).optional(),
  stock: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().max(2048).optional(),
  categoryId: z.string().uuid().optional(),
});

const idParam = z.string().uuid("invalid product id");

// Shape returned to clients: product fields + a flattened category summary.
const productColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  description: products.description,
  priceCents: products.priceCents,
  currency: products.currency,
  stock: products.stock,
  imageUrl: products.imageUrl,
  categoryId: products.categoryId,
  categoryName: categories.name,
  categorySlug: categories.slug,
  createdAt: products.createdAt,
};

// GET /api/products?category=<slug>&limit=&offset=
router.get("/", async (req, res, next) => {
  try {
    const query = z
      .object({
        category: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .parse(req.query);

    const where = query.category
      ? eq(categories.slug, query.category)
      : undefined;

    const rows = await db
      .select(productColumns)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const [row] = await db
      .select(productColumns)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id));

    if (!row) throw new HttpError(404, "Product not found");
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// POST /api/products (admin)
router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = productInput.parse(req.body);
    const [row] = await db.insert(products).values(data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/products/:id (admin)
router.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const data = productInput.partial().parse(req.body);

    const [row] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!row) throw new HttpError(404, "Product not found");
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id (admin)
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const [row] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!row) throw new HttpError(404, "Product not found");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

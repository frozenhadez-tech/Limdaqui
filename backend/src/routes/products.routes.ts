import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { categories, products } from "../db/schema.js";
import {
  requireAdmin,
  requireAuth,
  requireBackOffice,
  requireManager,
} from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { deleteImage, imageIdFromUrl } from "./images.routes.js";

const router = Router();

const productInput = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(280)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, or hyphens"),
  // Nullable so PATCH can clear these fields, not just change them.
  description: z.string().max(5000).nullable().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).optional(),
  stock: z.number().int().nonnegative().optional(),
  // Either an absolute URL or a path to an uploaded image (/api/images/:id).
  imageUrl: z
    .string()
    .max(2048)
    .refine(
      (v) => /^https?:\/\//.test(v) || imageIdFromUrl(v) !== null,
      "imageUrl must be an http(s) URL or an uploaded image path",
    )
    .nullable()
    .optional(),
  categoryId: z.string().uuid().nullable().optional(),
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

// POST /api/products (staff and up)
router.post("/", requireAuth, requireBackOffice, async (req, res, next) => {
  try {
    const data = productInput.parse(req.body);
    const [row] = await db.insert(products).values(data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/products/:id (manager and up)
router.patch("/:id", requireAuth, requireManager, async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const data = productInput.partial().parse(req.body);

    const [before] = await db
      .select({ imageUrl: products.imageUrl })
      .from(products)
      .where(eq(products.id, id));

    const [row] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!row) throw new HttpError(404, "Product not found");

    // If the image was replaced or cleared, drop the orphaned upload.
    if ("imageUrl" in data && before && before.imageUrl !== row.imageUrl) {
      const oldId = imageIdFromUrl(before.imageUrl);
      if (oldId) await deleteImage(oldId);
    }

    res.json(row);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id (admin only)
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const [row] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!row) throw new HttpError(404, "Product not found");

    const imageId = imageIdFromUrl(row.imageUrl);
    if (imageId) await deleteImage(imageId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

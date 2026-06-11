import { eq } from "drizzle-orm";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import { db } from "../db/index.js";
import { productImages } from "../db/schema.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, "Only JPEG, PNG, WebP, or GIF images are allowed"));
  },
});

/** Path under which an uploaded image is served. */
export function imagePath(id: string): string {
  return `/api/images/${id}`;
}

/** Extract the image id from a stored imageUrl, if it points at our store. */
export function imageIdFromUrl(url: string | null): string | null {
  const match = url?.match(/^\/api\/images\/([0-9a-f-]{36})$/);
  return match?.[1] ?? null;
}

export async function deleteImage(id: string): Promise<void> {
  await db.delete(productImages).where(eq(productImages.id, id));
}

// POST /api/images — upload a product image (admin); multipart field "file"
router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new HttpError(400, "No file uploaded");
      const [row] = await db
        .insert(productImages)
        .values({ mimeType: req.file.mimetype, data: req.file.buffer })
        .returning({ id: productImages.id });
      res.status(201).json({ id: row!.id, url: imagePath(row!.id) });
    } catch (err) {
      next(err);
    }
  },
);

const idParam = z.string().uuid("invalid image id");

// GET /api/images/:id — serve an uploaded image (public, immutable)
router.get("/:id", async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const [row] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.id, id));
    if (!row) throw new HttpError(404, "Image not found");

    res.setHeader("Content-Type", row.mimeType);
    // Uploads are never modified in place (a new upload gets a new id),
    // so clients and CDNs can cache forever.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(row.data);
  } catch (err) {
    next(err);
  }
});

export default router;

import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import { db } from "../db/index.js";
import { quoteAttachments, quotes } from "../db/schema.js";
import {
  requireAdmin,
  requireAuth,
  requireBackOffice,
} from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { quoteLimiter } from "../middleware/rateLimit.js";

const router = Router();

const quoteSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  company: z.string().max(255).optional(),
  phone: z.string().max(60).optional(),
  message: z.string().min(1).max(5000),
});

// Product lists customers attach to a quotation request.
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_ATTACHMENT_TYPES.has(file.mimetype)) cb(null, true);
    else
      cb(
        new HttpError(
          400,
          "Attachment must be a PDF, Excel, Word, CSV, text, or image file",
        ),
      );
  },
});

// POST /api/quotes — submit a quotation request (public).
// Accepts JSON, or multipart/form-data with an optional "attachment" file.
router.post("/", quoteLimiter, upload.single("attachment"), async (req, res, next) => {
  try {
    const data = quoteSchema.parse(req.body);

    // Multipart sends optional fields as empty strings; treat those as absent.
    const [row] = await db
      .insert(quotes)
      .values({
        ...data,
        company: data.company || null,
        phone: data.phone || null,
      })
      .returning();

    let attachmentName: string | null = null;
    if (req.file) {
      attachmentName = req.file.originalname.slice(0, 255);
      await db.insert(quoteAttachments).values({
        quoteId: row!.id,
        fileName: attachmentName,
        mimeType: req.file.mimetype,
        data: req.file.buffer,
      });
    }

    res.status(201).json({ ...row, attachmentName });
  } catch (err) {
    next(err);
  }
});

// GET /api/quotes?limit=&offset= — list submissions (staff and up)
router.get("/", requireAuth, requireBackOffice, async (req, res, next) => {
  try {
    const query = z
      .object({
        limit: z.coerce.number().int().min(1).max(100).default(50),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .parse(req.query);

    const rows = await db
      .select({
        id: quotes.id,
        name: quotes.name,
        email: quotes.email,
        company: quotes.company,
        phone: quotes.phone,
        message: quotes.message,
        createdAt: quotes.createdAt,
        attachmentId: quoteAttachments.id,
        attachmentName: quoteAttachments.fileName,
      })
      .from(quotes)
      .leftJoin(quoteAttachments, eq(quoteAttachments.quoteId, quotes.id))
      .orderBy(desc(quotes.createdAt))
      .limit(query.limit)
      .offset(query.offset);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/quotes/:id/attachment — download the attached file (staff and up)
router.get(
  "/:id/attachment",
  requireAuth,
  requireBackOffice,
  async (req, res, next) => {
    try {
      const id = z.string().uuid("invalid quote id").parse(req.params.id);
      const [att] = await db
        .select()
        .from(quoteAttachments)
        .where(eq(quoteAttachments.quoteId, id));
      if (!att) throw new HttpError(404, "No attachment for this quote");

      // Header-safe ASCII filename.
      const safeName = att.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
      res.setHeader("Content-Type", att.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
      res.send(att.data);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/quotes/:id — remove a quotation request (admin only)
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = z.string().uuid("invalid quote id").parse(req.params.id);
    const [row] = await db
      .delete(quotes)
      .where(eq(quotes.id, id))
      .returning({ id: quotes.id });
    if (!row) throw new HttpError(404, "Quote not found");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

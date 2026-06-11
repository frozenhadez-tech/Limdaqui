import { gte, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { visits } from "../db/schema.js";
import { requireAuth, requireBackOffice } from "../middleware/auth.js";
import { visitLimiter } from "../middleware/rateLimit.js";

const router = Router();

const visitSchema = z.object({
  visitorId: z.string().min(8).max(64),
  path: z.string().min(1).max(255),
});

// POST /api/visits — record a public-site page view (anonymous)
router.post("/", visitLimiter, async (req, res, next) => {
  try {
    const data = visitSchema.parse(req.body);
    // Never count back-office browsing as site traffic.
    if (data.path.startsWith("/admin")) {
      res.status(204).send();
      return;
    }
    await db.insert(visits).values(data);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** Start of the current day/month in Asia/Manila, as UTC instants. */
function manilaBoundaries(): { dayStart: Date; monthStart: Date } {
  const OFFSET_MS = 8 * 60 * 60 * 1000;
  const manila = new Date(Date.now() + OFFSET_MS);
  const dayStart = new Date(
    Date.UTC(manila.getUTCFullYear(), manila.getUTCMonth(), manila.getUTCDate()) -
      OFFSET_MS,
  );
  const monthStart = new Date(
    Date.UTC(manila.getUTCFullYear(), manila.getUTCMonth(), 1) - OFFSET_MS,
  );
  return { dayStart, monthStart };
}

// GET /api/visits/stats — visitor totals (staff and up)
router.get("/stats", requireAuth, requireBackOffice, async (_req, res, next) => {
  try {
    const { dayStart, monthStart } = manilaBoundaries();

    const counts = {
      views: sql<number>`count(*)::int`,
      visitors: sql<number>`count(distinct ${visits.visitorId})::int`,
    };

    const [[allTime], [today], [month]] = await Promise.all([
      db.select(counts).from(visits),
      db.select(counts).from(visits).where(gte(visits.createdAt, dayStart)),
      db.select(counts).from(visits).where(gte(visits.createdAt, monthStart)),
    ]);

    res.json({
      allTime: allTime ?? { views: 0, visitors: 0 },
      today: today ?? { views: 0, visitors: 0 },
      thisMonth: month ?? { views: 0, visitors: 0 },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

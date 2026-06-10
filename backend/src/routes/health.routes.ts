import { sql } from "drizzle-orm";
import { Router } from "express";

import { db } from "../db/index.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get("/db", async (_req, res, next) => {
  try {
    const result = await db.execute(sql`select 1 as ok`);
    res.json({ status: "ok", db: result.rows[0] ?? null });
  } catch (err) {
    next(err);
  }
});

export default router;

import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import {
  hashPassword,
  signToken,
  verifyPassword,
} from "../lib/auth.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Normalize emails so "Foo@x.com" and "foo@x.com" are the same account.
const emailField = z
  .string()
  .email()
  .max(255)
  .transform((value) => value.toLowerCase());

const registerSchema = z.object({
  email: emailField,
  password: z.string().min(8).max(200),
  fullName: z.string().min(1).max(255).optional(),
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(200),
});

type PublicUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
};

function toPublicUser(row: {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
}): PublicUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
  };
}

// POST /api/auth/register
router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email));
    if (existing.length > 0) {
      throw new HttpError(409, "An account with that email already exists");
    }

    const passwordHash = await hashPassword(data.password);
    const [row] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        fullName: data.fullName ?? null,
      })
      .returning();

    const user = toPublicUser(row!);
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));
    if (!row) throw new HttpError(401, "Invalid email or password");

    const ok = await verifyPassword(data.password, row.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid email or password");

    const user = toPublicUser(row);
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.sub));
    if (!row) throw new HttpError(404, "User not found");
    res.json({ user: toPublicUser(row) });
  } catch (err) {
    next(err);
  }
});

const updateMeSchema = z.object({
  fullName: z.string().min(1).max(255).nullable(),
});

// PATCH /api/auth/me — update profile details
router.patch("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const data = updateMeSchema.parse(req.body);
    const [row] = await db
      .update(users)
      .set({ fullName: data.fullName, updatedAt: new Date() })
      .where(eq(users.id, req.user!.sub))
      .returning();
    if (!row) throw new HttpError(404, "User not found");
    res.json({ user: toPublicUser(row) });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

// POST /api/auth/password — change password (requires current password)
router.post(
  "/password",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const data = changePasswordSchema.parse(req.body);
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.sub));
      if (!row) throw new HttpError(404, "User not found");

      const ok = await verifyPassword(data.currentPassword, row.passwordHash);
      if (!ok) throw new HttpError(401, "Current password is incorrect");

      const passwordHash = await hashPassword(data.newPassword);
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, row.id));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;

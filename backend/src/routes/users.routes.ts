import { desc, eq, ilike, or } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { hashPassword } from "../lib/auth.js";
import {
  requireAdmin,
  requireAuth,
  requireManager,
  type AuthedRequest,
} from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

// User management is for admins and managers (staff have no access).
router.use(requireAuth, requireManager);

const publicColumns = {
  id: users.id,
  email: users.email,
  fullName: users.fullName,
  role: users.role,
  status: users.status,
  createdAt: users.createdAt,
};

const idParam = z.string().uuid("invalid user id");

const roleEnum = z.enum(["customer", "staff", "manager", "admin"]);

const createUserSchema = z.object({
  email: z
    .string()
    .email()
    .max(255)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(200),
  fullName: z.string().min(1).max(255).optional(),
  role: roleEnum.default("customer"),
});

const updateUserSchema = z.object({
  fullName: z.string().min(1).max(255).nullable().optional(),
  role: roleEnum.optional(),
  status: z.enum(["active", "suspended"]).optional(),
  // Optional admin password reset.
  password: z.string().min(8).max(200).optional(),
});

// GET /api/users?q=&limit=&offset= — list users
router.get("/", async (req, res, next) => {
  try {
    const query = z
      .object({
        q: z.string().max(255).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .parse(req.query);

    const where = query.q
      ? or(
          ilike(users.email, `%${query.q}%`),
          ilike(users.fullName, `%${query.q}%`),
        )
      : undefined;

    const rows = await db
      .select(publicColumns)
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/users — create a user
router.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);

    if (req.user!.role === "manager" && data.role === "admin") {
      throw new HttpError(403, "Managers cannot assign the admin role");
    }
    const passwordHash = await hashPassword(data.password);
    const [row] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        fullName: data.fullName ?? null,
        role: data.role,
      })
      .returning(publicColumns);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id — edit name/role/status, optionally reset password
router.patch("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const data = updateUserSchema.parse(req.body);

    // Don't let anyone lock themselves out.
    if (id === req.user!.sub) {
      if (data.role && data.role !== req.user!.role) {
        throw new HttpError(400, "You cannot change your own role");
      }
      if (data.status === "suspended") {
        throw new HttpError(400, "You cannot suspend your own account");
      }
    }

    // Managers cannot touch admin accounts or hand out the admin role.
    if (req.user!.role === "manager") {
      const [target] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, id));
      if (!target) throw new HttpError(404, "User not found");
      if (target.role === "admin") {
        throw new HttpError(403, "Managers cannot modify admin accounts");
      }
      if (data.role === "admin") {
        throw new HttpError(403, "Managers cannot assign the admin role");
      }
    }

    const { password, ...fields } = data;
    const updates: Record<string, unknown> = { ...fields, updatedAt: new Date() };
    if (password) updates.passwordHash = await hashPassword(password);

    const [row] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning(publicColumns);

    if (!row) throw new HttpError(404, "User not found");
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id — admin only (fails 409 if they have orders)
router.delete("/:id", requireAdmin, async (req: AuthedRequest, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    if (id === req.user!.sub) {
      throw new HttpError(400, "You cannot delete your own account");
    }

    const [row] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!row) throw new HttpError(404, "User not found");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

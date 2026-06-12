import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { orderItems, orders, products, users } from "../db/schema.js";
import {
  requireAdmin,
  requireAuth,
  requireBackOffice,
  type AuthedRequest,
} from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(999),
        // Chosen options, e.g. "Black / L".
        variant: z.string().max(160).optional(),
      }),
    )
    .min(1)
    .max(100),
  paymentMethod: z.enum(["cod", "gcash", "bank_transfer"]),
  shippingAddress: z.string().min(1, "Delivery address is required").max(500),
  shippingPhone: z.string().max(60).optional(),
});

// POST /api/orders — place an order from cart items (authenticated)
router.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { items, paymentMethod, shippingAddress, shippingPhone } =
      createOrderSchema.parse(req.body);
    const userId = req.user!.sub;

    // Collapse duplicate lines (same product + same variant) into one,
    // while stock is checked per product across all its variants.
    const lines = new Map<string, { productId: string; variant: string | null; quantity: number }>();
    const quantities = new Map<string, number>();
    for (const item of items) {
      const variant = item.variant?.trim() || null;
      const key = `${item.productId}|${variant ?? ""}`;
      const existing = lines.get(key);
      if (existing) existing.quantity += item.quantity;
      else lines.set(key, { productId: item.productId, variant, quantity: item.quantity });
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    }
    const productIds = [...quantities.keys()];

    const order = await db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds));
      const byId = new Map(rows.map((r) => [r.id, r]));

      for (const id of productIds) {
        const product = byId.get(id);
        if (!product) throw new HttpError(400, "A product in your cart no longer exists");
        if (product.stock < quantities.get(id)!) {
          throw new HttpError(409, `Insufficient stock for "${product.name}"`);
        }
      }

      const currency = rows[0]!.currency;
      if (!rows.every((r) => r.currency === currency)) {
        throw new HttpError(
          400,
          "All items in an order must use the same currency",
        );
      }

      const totalCents = productIds.reduce(
        (sum, id) => sum + byId.get(id)!.priceCents * quantities.get(id)!,
        0,
      );

      const [created] = await tx
        .insert(orders)
        .values({
          userId,
          totalCents,
          currency,
          paymentMethod,
          shippingAddress,
          shippingPhone: shippingPhone ?? null,
        })
        .returning();

      await tx.insert(orderItems).values(
        [...lines.values()].map((line) => ({
          orderId: created!.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPriceCents: byId.get(line.productId)!.priceCents,
          variant: line.variant,
        })),
      );

      // Conditional decrement so a concurrent order can't take stock negative.
      for (const id of productIds) {
        const qty = quantities.get(id)!;
        const updated = await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${qty}`,
            updatedAt: new Date(),
          })
          .where(and(eq(products.id, id), gte(products.stock, qty)))
          .returning({ id: products.id });
        if (updated.length === 0) {
          throw new HttpError(
            409,
            `Insufficient stock for "${byId.get(id)!.name}"`,
          );
        }
      }

      return created!;
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/all — every order with customer details (back office)
router.get("/all", requireAuth, requireBackOffice, async (req, res, next) => {
  try {
    const query = z
      .object({
        limit: z.coerce.number().int().min(1).max(500).default(100),
        offset: z.coerce.number().int().min(0).default(0),
        // Optional period window for sales reports: createdAt in [from, to).
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      })
      .parse(req.query);

    const conditions = [];
    if (query.from) conditions.push(gte(orders.createdAt, query.from));
    if (query.to) conditions.push(lt(orders.createdAt, query.to));

    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        shippingAddress: orders.shippingAddress,
        shippingPhone: orders.shippingPhone,
        totalCents: orders.totalCents,
        currency: orders.currency,
        createdAt: orders.createdAt,
        customerName: users.fullName,
        customerEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    if (rows.length === 0) {
      res.json([]);
      return;
    }

    const lines = await db
      .select({
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
        variant: orderItems.variant,
        name: products.name,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(
        inArray(
          orderItems.orderId,
          rows.map((o) => o.id),
        ),
      );

    res.json(
      rows.map((o) => ({
        ...o,
        items: lines.filter((l) => l.orderId === o.id),
      })),
    );
  } catch (err) {
    next(err);
  }
});

const statusSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]),
});

// PATCH /api/orders/:id/status — update an order's status (staff and up)
router.patch(
  "/:id/status",
  requireAuth,
  requireBackOffice,
  async (req, res, next) => {
    try {
      const id = z.string().uuid("invalid order id").parse(req.params.id);
      const { status } = statusSchema.parse(req.body);

      const [row] = await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();

      if (!row) throw new HttpError(404, "Order not found");
      res.json(row);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/orders/:id — remove an order entirely (admin only).
// Intended for test/junk entries; cancelled is the right state for real
// orders. Does not restock inventory.
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = z.string().uuid("invalid order id").parse(req.params.id);
    const [row] = await db
      .delete(orders)
      .where(eq(orders.id, id))
      .returning({ id: orders.id });
    if (!row) throw new HttpError(404, "Order not found");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/orders — the authenticated user's orders, newest first, with items
router.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const myOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, req.user!.sub))
      .orderBy(desc(orders.createdAt));

    if (myOrders.length === 0) {
      res.json([]);
      return;
    }

    const lines = await db
      .select({
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
        variant: orderItems.variant,
        name: products.name,
        imageUrl: products.imageUrl,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(
        inArray(
          orderItems.orderId,
          myOrders.map((o) => o.id),
        ),
      );

    res.json(
      myOrders.map((o) => ({
        ...o,
        items: lines.filter((l) => l.orderId === o.id),
      })),
    );
  } catch (err) {
    next(err);
  }
});

export default router;

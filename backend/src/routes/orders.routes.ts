import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../db/index.js";
import { orderItems, orders, products } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(100),
});

// POST /api/orders — place an order from cart items (authenticated)
router.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { items } = createOrderSchema.parse(req.body);
    const userId = req.user!.sub;

    // Collapse duplicate product lines into one.
    const quantities = new Map<string, number>();
    for (const item of items) {
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
        .values({ userId, totalCents, currency })
        .returning();

      await tx.insert(orderItems).values(
        productIds.map((id) => ({
          orderId: created!.id,
          productId: id,
          quantity: quantities.get(id)!,
          unitPriceCents: byId.get(id)!.priceCents,
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

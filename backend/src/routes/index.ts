import { Router } from "express";

import authRoutes from "./auth.routes.js";
import categoryRoutes from "./categories.routes.js";
import healthRoutes from "./health.routes.js";
import productRoutes from "./products.routes.js";
import quoteRoutes from "./quotes.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/quotes", quoteRoutes);

export default router;

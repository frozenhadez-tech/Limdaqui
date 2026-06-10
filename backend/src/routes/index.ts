import { Router } from "express";

import categoryRoutes from "./categories.routes.js";
import healthRoutes from "./health.routes.js";
import productRoutes from "./products.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);

export default router;

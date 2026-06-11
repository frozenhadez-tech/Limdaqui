import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  // Behind Cloud Run's proxy; needed for rate limiting to see real client IPs.
  app.set("trust proxy", 1);

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

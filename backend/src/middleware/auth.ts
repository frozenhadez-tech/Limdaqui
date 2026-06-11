import type { NextFunction, Request, Response } from "express";

import { verifyToken, type JwtPayload } from "../lib/auth.js";
import { HttpError } from "./errorHandler.js";

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}

/** Require a valid Bearer token; attaches the decoded user to req.user. */
export function requireAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Authentication required"));
    return;
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}

/** Require the authenticated user to have the admin role. */
export function requireAdmin(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== "admin") {
    next(new HttpError(403, "Admin access required"));
    return;
  }
  next();
}

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

/** Require the authenticated user to have one of the given roles. */
export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user?.role ?? "")) {
      next(new HttpError(403, "Insufficient permissions"));
      return;
    }
    next();
  };
}

/** Admin only: deletions and admin-account management. */
export const requireAdmin = requireRole("admin");

/** Admin or manager: edits and user management. */
export const requireManager = requireRole("admin", "manager");

/** Any back-office role: viewing, creating, and reports. */
export const requireBackOffice = requireRole("admin", "manager", "staff");

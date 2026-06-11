import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not Found" });
}

/** Postgres unique-constraint violation (duplicate email, slug, etc.). */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "23505"
  );
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Request validation failures -> 400 with field-level details.
  if (err instanceof ZodError) {
    res.status(400).json({ error: "ValidationError", issues: err.issues });
    return;
  }

  // Insert races on unique columns -> 409 instead of a raw 500.
  if (isUniqueViolation(err)) {
    res.status(409).json({ error: "A record with that value already exists" });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Unexpected errors: log the details, never echo them to the client.
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
}

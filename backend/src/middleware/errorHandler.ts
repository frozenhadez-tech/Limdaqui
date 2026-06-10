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

  const status = err instanceof HttpError ? err.status : 500;
  const message =
    err instanceof Error ? err.message : "Internal Server Error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}

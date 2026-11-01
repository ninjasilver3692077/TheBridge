import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import type { ErrorResponse } from "@/types";

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const bodyParserMessages: Record<string, string> = {
  "entity.parse.failed": "Request body is not valid JSON.",
  "entity.too.large": "Request body exceeds 32 KiB.",
  "encoding.unsupported": "Unsupported request body encoding.",
};

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof mongoose.Error.ValidationError) {
    const [first] = Object.values(error.errors);
    return new HttpError(400, first ? `${first.path}: ${first.message}` : "Invalid input.");
  }
  if (error instanceof mongoose.Error.CastError) return new HttpError(400, `${error.path}: invalid value.`);
  if (isDuplicateKeyError(error)) return new HttpError(409, "This resource already exists.");
  if (typeof error === "object" && error !== null && "type" in error && typeof error.type === "string") {
    const message = bodyParserMessages[error.type];
    const status = "status" in error && typeof error.status === "number" ? error.status : 400;
    if (message) return new HttpError(status, message);
  }
  return new HttpError(500, "Unexpected server error.");
}

export const requireJsonBody: RequestHandler = (req, _res, next) => {
  if (req.is("application/json") === false) {
    next(new HttpError(415, "Content-Type must be application/json."));
    return;
  }
  next();
};

export const handleNotFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, "Route not found."));
};

export const handleErrors: ErrorRequestHandler = (error, _req, res, _next) => {
  const httpError = toHttpError(error);
  if (httpError.status === 500) console.error(error);
  const body: ErrorResponse = { error: httpError.message, code: httpError.status };
  res.status(httpError.status).json(body);
};

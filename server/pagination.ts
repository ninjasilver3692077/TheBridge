import type { PageResponse } from "@/types";
import { HttpError } from "./errors.js";

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

function readBoundedInteger(value: unknown, name: string, fallback: number, max: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new HttpError(400, `${name}: must be a whole number.`);
  }
  const parsed = Number(value);
  if (parsed < 1 || parsed > max) throw new HttpError(400, `${name}: must be between 1 and ${max}.`);
  return parsed;
}

export function readPagination(query: Record<string, unknown>): Pagination {
  const page = readBoundedInteger(query.page, "page", 1, 10000);
  const limit = readBoundedInteger(query.limit, "limit", 10, 100);
  return { page, limit, skip: (page - 1) * limit };
}

export function toPage<T>(data: T[], total: number, { page, limit }: Pagination): PageResponse<T> {
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

import type { Condition, ListingStatus, ListingTerms, Modality } from "@/types";
import { isPlainObject, parseBookMetadataInput } from "./bookMetadata.js";
import { HttpError } from "./errors.js";
import { areValidTermsForModality, CONDITIONS, LISTING_STATUSES, MODALITIES } from "./listingTerms.js";

export function objectInput(raw: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!isPlainObject(raw)) throw new HttpError(400, "body: must be a JSON object.");
  for (const key of Object.keys(raw)) {
    if (!keys.includes(key)) throw new HttpError(400, `${key}: unknown field.`);
  }
  return raw;
}

export function objectId(value: unknown, field = "id"): string {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    throw new HttpError(400, `${field}: must be a 24-character hex identifier.`);
  }
  return value;
}

export function readEnum<T extends string>(value: unknown, choices: readonly T[], field: string): T {
  if (typeof value !== "string" || !choices.includes(value as T)) {
    throw new HttpError(400, `${field}: invalid value.`);
  }
  return value as T;
}

export function readCondition(raw: unknown): Condition {
  return readEnum(raw, CONDITIONS, "condition");
}

export function readNotes(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 2000) {
    throw new HttpError(400, "notes: must be text of at most 2000 characters.");
  }
  return raw;
}

export function listingInput(raw: unknown, creating = false) {
  const body = objectInput(raw, creating ? ["libraryBookId", "modality", "terms"] : ["modality", "terms"]);
  const modality = readEnum(body.modality, MODALITIES, "modality");
  const input = objectInput(body.terms, ["desiredBook", "priceCop", "durationDays"]);
  for (const key of ["desiredBook", "priceCop", "durationDays"]) {
    if (!(key in input)) throw new HttpError(400, `terms.${key}: required field.`);
  }
  if (input.priceCop !== null && (typeof input.priceCop !== "number" || !Number.isInteger(input.priceCop))) {
    throw new HttpError(400, "terms.priceCop: must be null or a positive whole COP amount.");
  }
  if (input.durationDays !== null && (typeof input.durationDays !== "number" || ![7, 10, 14, 21].includes(input.durationDays))) {
    throw new HttpError(400, "terms.durationDays: must be null or one of 7, 10, 14, 21.");
  }
  const terms: ListingTerms = {
    desiredBook: input.desiredBook === null ? null : parseBookMetadataInput(input.desiredBook, "terms.desiredBook"),
    priceCop: input.priceCop as number | null,
    durationDays: input.durationDays as ListingTerms["durationDays"],
  };
  if (!areValidTermsForModality(modality, terms)) throw new HttpError(400, "terms: fields do not match modality.");
  return { modality, terms, libraryBookId: creating ? objectId(body.libraryBookId, "libraryBookId") : undefined };
}

export function queryInput(raw: Record<string, unknown>, allowed: readonly string[]): void {
  for (const key of Object.keys(raw)) {
    if (!allowed.includes(key)) throw new HttpError(400, `${key}: unknown query parameter.`);
  }
}

export function searchQuery(raw: unknown): RegExp | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "string" || raw.trim().length > 100) throw new HttpError(400, "q: must be text of at most 100 characters.");
  const value = raw.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (!value) return undefined;
  const accents: Record<string, string> = {
    a: "[a\u00e0\u00e1\u00e2\u00e3\u00e4]", e: "[e\u00e8\u00e9\u00ea\u00eb]",
    i: "[i\u00ec\u00ed\u00ee\u00ef]", o: "[o\u00f2\u00f3\u00f4\u00f5\u00f6]",
    u: "[u\u00f9\u00fa\u00fb\u00fc]", n: "[n\u00f1]", c: "[c\u00e7]",
  };
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped.replace(/[aeiounc]/g, (char) => accents[char] ?? char), "i");
}

export function bookSearch(raw: unknown, prefix: string): Record<string, unknown> {
  const regex = searchQuery(raw);
  return regex ? { $or: ["title", "author", "genre", "isbn"].map((key) => ({ [`${prefix}.${key}`]: regex })) } : {};
}

export function publicListingFilter(query: Record<string, unknown>): Record<string, unknown> {
  const filter: Record<string, unknown> = { status: "Available", ...bookSearch(query.q, "book") };
  if (query.modality !== undefined) filter.modality = readEnum<Modality>(query.modality, MODALITIES, "modality");
  if (query.condition !== undefined) filter.condition = readCondition(query.condition);
  if (query.genre !== undefined) {
    if (typeof query.genre !== "string" || !query.genre.trim() || query.genre.trim().length > 80) throw new HttpError(400, "genre: must be text of 1 to 80 characters.");
    filter["book.genre"] = query.genre.trim();
  }
  return filter;
}

export function listingStatus(raw: unknown): ListingStatus {
  return readEnum(raw, LISTING_STATUSES, "status");
}

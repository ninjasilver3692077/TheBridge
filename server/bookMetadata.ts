import { Schema } from "mongoose";
import type { BookMetadata } from "@/types";
import { HttpError } from "./errors.js";

const bookMetadataKeys = new Set([
  "catalogId",
  "title",
  "author",
  "genre",
  "coverUrl",
  "year",
  "publisher",
  "isbn",
  "language",
]);

const openLibraryCoverPattern = /^https:\/\/covers\.openlibrary\.org\/[^\s]+$/;
const isbnPattern = /^(?:\d{9}[\dX]|\d{13})$/;
const languagePattern = /^[a-zA-Z]{3}$/;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new HttpError(400, `${field}: must be a string.`);
  }
  const trimmed = value.trim().normalize("NFC");
  if (trimmed.length < 1 || trimmed.length > maxLength) {
    throw new HttpError(400, `${field}: must be between 1 and ${maxLength} characters.`);
  }
  return trimmed;
}

function readNullableString(
  value: unknown,
  field: string,
  maxLength: number,
  pattern?: RegExp,
  patternMessage?: string,
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new HttpError(400, `${field}: must be a string or null.`);
  }
  const trimmed = value.trim().normalize("NFC");
  if (trimmed.length < 1 || trimmed.length > maxLength) {
    throw new HttpError(400, `${field}: must be between 1 and ${maxLength} characters.`);
  }
  if (pattern && !pattern.test(trimmed)) {
    throw new HttpError(400, `${field}: ${patternMessage ?? "invalid format."}`);
  }
  return trimmed;
}

export function parseBookMetadataInput(raw: unknown, prefix = "book"): BookMetadata {
  if (!isPlainObject(raw)) {
    throw new HttpError(400, `${prefix}: must be an object.`);
  }
  for (const key of Object.keys(raw)) {
    if (!bookMetadataKeys.has(key)) {
      throw new HttpError(400, `${prefix}.${key}: unknown field.`);
    }
  }

  const catalogId = readRequiredString(raw.catalogId, `${prefix}.catalogId`, 200);
  const title = readRequiredString(raw.title, `${prefix}.title`, 300);
  const author = readRequiredString(raw.author, `${prefix}.author`, 200);
  const genre =
    raw.genre === undefined || raw.genre === null
      ? "Uncategorized"
      : readRequiredString(raw.genre, `${prefix}.genre`, 80);
  const coverUrl = readNullableString(
    raw.coverUrl,
    `${prefix}.coverUrl`,
    500,
    openLibraryCoverPattern,
    "must be an HTTPS URL on covers.openlibrary.org.",
  );

  let year: number | null = null;
  if (raw.year !== undefined && raw.year !== null) {
    if (typeof raw.year !== "number" || !Number.isInteger(raw.year) || raw.year < 1 || raw.year > 9999) {
      throw new HttpError(400, `${prefix}.year: must be an integer between 1 and 9999.`);
    }
    year = raw.year;
  }

  const publisher = readNullableString(raw.publisher, `${prefix}.publisher`, 200);
  const isbn = readNullableString(
    raw.isbn,
    `${prefix}.isbn`,
    13,
    isbnPattern,
    "must be a normalized 10 or 13 character ISBN.",
  );
  const language = readNullableString(
    raw.language,
    `${prefix}.language`,
    3,
    languagePattern,
    "must be a three-letter language code.",
  );

  return {
    catalogId,
    title,
    author,
    genre,
    coverUrl,
    year,
    publisher,
    isbn,
    language: language ? language.toLowerCase() : null,
  };
}

export function serializeBookMetadata(book: BookMetadata): BookMetadata {
  return {
    catalogId: book.catalogId,
    title: book.title,
    author: book.author,
    genre: book.genre || "Uncategorized",
    coverUrl: book.coverUrl ?? null,
    year: book.year ?? null,
    publisher: book.publisher ?? null,
    isbn: book.isbn ?? null,
    language: book.language ?? null,
  };
}

export const bookMetadataSchema = new Schema<BookMetadata>(
  {
    catalogId: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 300 },
    author: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    genre: {
      type: String,
      required: true,
       trim: true,
      minlength: 1,
      maxlength: 80,
      default: "Uncategorized",
    },
    coverUrl: {
      type: String,
      default: null,
      validate: {
        validator: (value: string | null) => value === null || openLibraryCoverPattern.test(value),
        message: "must be null or an HTTPS URL on covers.openlibrary.org.",
      },
    },
    year: {
      type: Number,
      default: null,
      validate: {
        validator: (value: number | null) =>
          value === null || (Number.isInteger(value) && value >= 1 && value <= 9999),
        message: "must be null or an integer between 1 and 9999.",
      },
    },
    publisher: { type: String, default: null, maxlength: 200 },
    isbn: {
      type: String,
      default: null,
      validate: {
        validator: (value: string | null) => value === null || isbnPattern.test(value),
        message: "must be null or a 10 or 13 character ISBN.",
      },
    },
    language: {
      type: String,
      default: null,
      validate: {
        validator: (value: string | null) => value === null || languagePattern.test(value),
        message: "must be null or a three-letter language code.",
      },
    },
  },
  { _id: false },
);

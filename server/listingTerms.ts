import { Schema } from "mongoose";
import type { Condition, DurationDays, ListingStatus, ListingTerms, Modality } from "@/types";
import { bookMetadataSchema } from "./bookMetadata.js";

export const CONDITIONS: readonly Condition[] = ["Like new", "Good condition", "Used copy"];
export const MODALITIES: readonly Modality[] = ["Exchange", "Loan", "Rental", "Sale"];
export const DURATION_DAYS: readonly DurationDays[] = [7, 10, 14, 21];
export const LISTING_STATUSES: readonly ListingStatus[] = [
  "Available",
  "Reserved",
  "Closed",
  "Removed",
];
export function areValidTermsForModality(modality: Modality, terms: ListingTerms): boolean {
  const validPrice =
    terms.priceCop !== null &&
    Number.isInteger(terms.priceCop) &&
    terms.priceCop >= 1 &&
    terms.priceCop <= 1_000_000_000;
  const validDuration =
    terms.durationDays !== null && DURATION_DAYS.includes(terms.durationDays);

  if (modality === "Exchange") {
    return terms.priceCop === null && terms.durationDays === null;
  }
  if (modality === "Loan") {
    return terms.desiredBook === null && terms.priceCop === null && validDuration;
  }
  if (modality === "Rental") {
    return terms.desiredBook === null && validPrice && validDuration;
  }
  return terms.desiredBook === null && validPrice && terms.durationDays === null;
}

export const listingTermsSchema = new Schema<ListingTerms>(
  {
    desiredBook: { type: bookMetadataSchema, default: null },
    priceCop: {
      type: Number,
      default: null,
      validate: {
        validator: (value: number | null) =>
          value === null || (Number.isInteger(value) && value >= 1 && value <= 1_000_000_000),
        message: "must be null or a positive whole COP amount up to 1000000000.",
      },
    },
    durationDays: {
      type: Number,
      default: null,
      validate: {
        validator: (value: number | null) =>
          value === null || DURATION_DAYS.includes(value as DurationDays),
        message: "must be null or one of 7, 10, 14, 21.",
      },
    },
  },
  { _id: false },
);

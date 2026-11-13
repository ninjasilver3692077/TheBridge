import { Schema } from "mongoose";
import type { Condition, DurationDays, ListingStatus, ListingTerms, Modality, PaymentMethod } from "@/types";
import { bookMetadataSchema } from "./bookMetadata.js";

export const CONDITIONS: readonly Condition[] = ["Like new", "Good condition", "Used copy"];
export const MODALITIES: readonly Modality[] = ["Exchange", "Loan", "Rental", "Sale"];
export const DURATION_DAYS: readonly DurationDays[] = [7, 10, 14, 21];
export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  "Cash",
  "Bank transfer",
  "Nequi",
  "Daviplata",
  "Card in person",
];
export const LISTING_STATUSES: readonly ListingStatus[] = [
  "Available",
  "Reserved",
  "Closed",
  "Removed",
];

export function isPaymentMethodList(value: unknown): value is PaymentMethod[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    new Set(value).size === value.length &&
    value.every((method) => PAYMENT_METHODS.includes(method as PaymentMethod))
  );
}

export function storedPaymentMethods(terms: Pick<ListingTerms, "paymentMethods">): PaymentMethod[] | null {
  const methods = terms.paymentMethods;
  return Array.isArray(methods) && methods.length > 0 ? [...methods] : null;
}

export function areValidTermsForModality(modality: Modality, terms: ListingTerms): boolean {
  const validPrice =
    terms.priceCop !== null &&
    Number.isInteger(terms.priceCop) &&
    terms.priceCop >= 1 &&
    terms.priceCop <= 1_000_000_000;
  const validDuration =
    terms.durationDays !== null && DURATION_DAYS.includes(terms.durationDays);
  const methods = storedPaymentMethods(terms);

  if (modality === "Exchange") {
    return terms.priceCop === null && terms.durationDays === null && methods === null;
  }
  if (modality === "Loan") {
    return terms.desiredBook === null && terms.priceCop === null && validDuration && methods === null;
  }
  if (modality === "Rental") {
    return terms.desiredBook === null && validPrice && validDuration && methods === null;
  }
  return (
    terms.desiredBook === null &&
    validPrice &&
    terms.durationDays === null &&
    (methods === null || isPaymentMethodList(methods))
  );
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
    paymentMethods: {
      type: [{ type: String, enum: PAYMENT_METHODS }],
      default: undefined,
      validate: {
        validator: (value: PaymentMethod[] | null | undefined) =>
          value === null || value === undefined || value.length === 0 || isPaymentMethodList(value),
        message: "must be null or a non-empty list of distinct payment methods.",
      },
    },
  },
  { _id: false },
);

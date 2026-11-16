import assert from "node:assert/strict";
import { test } from "node:test";
import type { ListingTerms, RequestQuotedTerms } from "@/types";
import { isValidQuotedPaymentMethod } from "../models/Request.js";
import { areValidTermsForModality, isPaymentMethodList, PAYMENT_METHODS } from "../server/listingTerms.js";
import { listingInput, readRequestedPaymentMethod } from "../server/marketplaceInput.js";

const saleTerms: ListingTerms = { desiredBook: null, priceCop: 40000, durationDays: null, paymentMethods: ["Nequi", "Cash"] };
const loanTerms: ListingTerms = { desiredBook: null, priceCop: null, durationDays: 14, paymentMethods: null };

function errorMessage(work: () => unknown): string {
  try {
    work();
  } catch (error) {
    assert.equal((error as { status?: number }).status, 400);
    return (error as Error).message;
  }
  assert.fail("expected a 400 error");
}

test("payment method vocabulary matches the issue and lists must be non-empty and distinct", () => {
  assert.deepEqual(PAYMENT_METHODS, ["Cash", "Bank transfer", "Nequi", "Daviplata", "Card in person"]);
  assert.equal(isPaymentMethodList(["Cash"]), true);
  assert.equal(isPaymentMethodList([...PAYMENT_METHODS]), true);
  for (const value of [[], ["Cash", "Cash"], ["Paypal"], ["cash"], "Cash", null, undefined, [1]]) {
    assert.equal(isPaymentMethodList(value), false, JSON.stringify(value));
  }
});

test("stored terms accept methods only on Sale and tolerate Sale listings published before methods existed", () => {
  assert.equal(areValidTermsForModality("Sale", saleTerms), true);
  assert.equal(areValidTermsForModality("Sale", { ...saleTerms, paymentMethods: null }), true);
  assert.equal(areValidTermsForModality("Sale", { ...saleTerms, paymentMethods: [] }), true);
  assert.equal(areValidTermsForModality("Sale", { ...saleTerms, paymentMethods: ["Cash", "Cash"] }), false);
  assert.equal(areValidTermsForModality("Loan", loanTerms), true);
  assert.equal(areValidTermsForModality("Loan", { ...loanTerms, paymentMethods: ["Cash"] }), false);
  assert.equal(areValidTermsForModality("Rental", { desiredBook: null, priceCop: 9000, durationDays: 7, paymentMethods: ["Nequi"] }), false);
  assert.equal(areValidTermsForModality("Exchange", { desiredBook: null, priceCop: null, durationDays: null, paymentMethods: ["Cash"] }), false);
});

test("listing input requires methods for Sale, rejects them elsewhere and stores them in canonical order", () => {
  const created = listingInput({ libraryBookId: "507f1f77bcf86cd799439011", modality: "Sale", terms: saleTerms }, true);
  assert.deepEqual(created.terms.paymentMethods, ["Cash", "Nequi"]);

  const withoutKey = { desiredBook: null, priceCop: 40000, durationDays: null };
  assert.equal(errorMessage(() => listingInput({ modality: "Sale", terms: withoutKey })), "terms.paymentMethods: required field.");
  for (const paymentMethods of [null, [], ["Cash", "Cash"], ["Paypal"], "Cash"]) {
    assert.match(errorMessage(() => listingInput({ modality: "Sale", terms: { ...saleTerms, paymentMethods } })), /^terms\.paymentMethods: choose one or more distinct methods/);
  }
  assert.equal(
    errorMessage(() => listingInput({ modality: "Loan", terms: { ...loanTerms, paymentMethods: ["Cash"] } })),
    "terms.paymentMethods: only allowed for Sale listings.",
  );
  assert.equal(listingInput({ modality: "Loan", terms: loanTerms }).terms.paymentMethods, null);
});

test("a request must choose one of the listing's methods, and none when the listing offers none", () => {
  assert.equal(readRequestedPaymentMethod("Nequi", ["Cash", "Nequi"]), "Nequi");
  assert.equal(errorMessage(() => readRequestedPaymentMethod(undefined, ["Cash"])), "paymentMethod: choose one of the listing's payment methods.");
  assert.equal(errorMessage(() => readRequestedPaymentMethod(null, ["Cash"])), "paymentMethod: choose one of the listing's payment methods.");
  assert.equal(errorMessage(() => readRequestedPaymentMethod("Daviplata", ["Cash", "Nequi"])), "paymentMethod: must be one of Cash, Nequi.");
  assert.equal(errorMessage(() => readRequestedPaymentMethod(["Cash"], ["Cash"])), "paymentMethod: must be one of Cash.");
  assert.equal(readRequestedPaymentMethod(undefined, null), null);
  assert.equal(readRequestedPaymentMethod(null, null), null);
  assert.equal(errorMessage(() => readRequestedPaymentMethod("Cash", null)), "paymentMethod: this listing does not offer payment methods.");
});

test("a stored quote keeps the chosen method consistent with the quoted methods", () => {
  const quote = (paymentMethods: RequestQuotedTerms["paymentMethods"], paymentMethod: RequestQuotedTerms["paymentMethod"]) =>
    isValidQuotedPaymentMethod({ ...saleTerms, paymentMethods, paymentMethod });
  assert.equal(quote(["Cash", "Nequi"], "Nequi"), true);
  assert.equal(quote(["Cash", "Nequi"], "Daviplata"), false);
  assert.equal(quote(["Cash"], null), false);
  assert.equal(quote(null, null), true);
  assert.equal(quote(null, "Cash"), false);
});

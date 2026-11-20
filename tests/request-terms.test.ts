import assert from "node:assert/strict";
import { test } from "node:test";
import { describeQuotedTerms } from "../src/services/requestTerms.js";

const labels = (rows: { label: string; value: string }[]) => rows.map(({ label }) => label);

test("a Sale shows the quoted COP amount and keeps the payment method", () => {
  const rows = describeQuotedTerms("Sale", {
    desiredBook: null,
    priceCop: 40000,
    durationDays: null,
    paymentMethods: ["Cash", "Nequi"],
    paymentMethod: "Nequi",
  });
  assert.deepEqual(labels(rows), ["Agreed price", "Payment method"]);
  assert.match(rows[0]!.value, /^COP\s40,000$/);
  assert.equal(rows[1]!.value, "Nequi");
});

test("a Loan shows only the duration in days", () => {
  const rows = describeQuotedTerms("Loan", { desiredBook: null, priceCop: null, durationDays: 14, paymentMethods: null, paymentMethod: null });
  assert.deepEqual(rows, [{ label: "Duration", value: "14 days" }]);
});

test("a Rental shows both the price and the duration", () => {
  const rows = describeQuotedTerms("Rental", { desiredBook: null, priceCop: 8000, durationDays: 7, paymentMethods: null, paymentMethod: null });
  assert.deepEqual(labels(rows), ["Agreed price", "Duration"]);
  assert.match(rows[0]!.value, /^COP\s8,000$/);
  assert.equal(rows[1]!.value, "7 days");
});

test("an Exchange omits price and duration", () => {
  const rows = describeQuotedTerms("Exchange", { desiredBook: null, priceCop: null, durationDays: null, paymentMethods: null, paymentMethod: null });
  assert.deepEqual(rows, []);
});

test("a Sale quoted before payment methods existed shows only its price", () => {
  const rows = describeQuotedTerms("Sale", { desiredBook: null, priceCop: 30000, durationDays: null });
  assert.deepEqual(labels(rows), ["Agreed price"]);
  assert.deepEqual(describeQuotedTerms("Sale", undefined), []);
});

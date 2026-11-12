import assert from "node:assert/strict";
import { test } from "node:test";
import { getRequestCtaState } from "../src/services/listingRequest.js";

const memberState = { signedIn: true, isMember: true, isOwner: false, requestSent: false };

test("an Available listing offers the modality action", () => {
  const cta = getRequestCtaState({ ...memberState, listingStatus: "Available" }, "Sale");
  assert.equal(cta.label, "Request Purchase");
  assert.equal(cta.disabled, undefined);
});

test("Reserved and Closed listings block the request", () => {
  for (const listingStatus of ["Reserved", "Closed"]) {
    const cta = getRequestCtaState({ ...memberState, listingStatus }, "Sale");
    assert.equal(cta.disabled, true);
    assert.equal(cta.label, `Currently ${listingStatus.toLowerCase()}`);
  }
});

test("a sent request is still shown as sent on an unavailable listing", () => {
  const cta = getRequestCtaState({ ...memberState, requestSent: true, listingStatus: "Reserved" }, "Sale");
  assert.equal(cta.sent, true);
});

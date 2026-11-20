import { formatListingPrice } from "./listingValidation.js";

export function describeQuotedTerms(modality, quotedTerms) {
  const terms = quotedTerms ?? {};
  const rows = [];

  if (modality !== "Exchange" && terms.priceCop != null) {
    rows.push({ label: "Agreed price", value: formatListingPrice(terms.priceCop) });
  }
  if (modality !== "Exchange" && terms.durationDays != null) {
    rows.push({ label: "Duration", value: `${terms.durationDays} days` });
  }
  if (terms.paymentMethod) {
    rows.push({ label: "Payment method", value: terms.paymentMethod });
  }

  return rows;
}

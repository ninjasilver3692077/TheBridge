import { formatListingPrice } from "./listingValidation.js";

export const ALL_OPTION = "All";

export const initialListingFilters = {
  search: "",
  modality: ALL_OPTION,
  genre: ALL_OPTION,
  condition: ALL_OPTION,
};

export function getListingOfferLabel(listing) {
  if (listing.modality === "Sale") {
    return formatListingPrice(listing.price);
  }

  if (listing.modality === "Rental") {
    return `${formatListingPrice(listing.price)} / ${listing.duration}`;
  }

  if (listing.modality === "Loan") {
    return `Free loan · ${listing.duration}`;
  }

  return listing.desiredBook ? `For ${listing.desiredBook}` : "Open to offers";
}

import { listings as baseListings } from "../data/listings.js";
import { markBookPublished } from "./myBooksStorage.js";

const STORAGE_KEY = "thebridge:user-listings";
export const LISTINGS_EVENT = "thebridge:listings-updated";

function loadUserListings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function loadAllListings() {
  return [...baseListings, ...loadUserListings()];
}

export function findListingById(id) {
  return loadAllListings().find((listing) => listing.id === id);
}

function saveUserListing(listing) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...loadUserListings(), listing]),
  );
  window.dispatchEvent(new CustomEvent(LISTINGS_EVENT, { detail: listing }));
  return listing;
}

function listingOffer(modality, values) {
  if (modality === "Exchange") {
    return {
      desiredBook: values.desiredBookMeta ? values.desiredBook : null,
      desiredBookMeta: values.desiredBookMeta || null,
      price: null,
      duration: null,
    };
  }

  if (modality === "Loan") {
    return { price: null, duration: values.loanDuration };
  }

  if (modality === "Rental") {
    return {
      price: Number(values.rentalPrice),
      duration: values.rentalDuration,
    };
  }

  return { price: Number(values.salePrice), duration: null };
}

function createUserListing(book, modality, values) {
  return {
    id: `user-listing-${Date.now()}`,
    sourceBookId: book.id,
    title: book.title,
    author: book.author || "Unknown author",
    cover: book.cover || "",
    genre: book.genre || "Default",
    year: book.year || null,
    publisher: book.publisher || null,
    isbn: book.isbn || "",
    language: book.language || null,
    modality,
    condition: book.condition,
    description: book.notes || "",
    desiredBook: null,
    desiredBookMeta: null,
    ...listingOffer(modality, values),
    owner: "You",
    status: "Available",
    createdAt: new Date().toISOString().split("T")[0],
  };
}

export function publishListing(book, modality, values) {
  const listing = saveUserListing(createUserListing(book, modality, values));
  markBookPublished(book.id, listing);
  return listing;
}

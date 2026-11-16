import { apiRequest, ApiError } from "./apiClient.js";
import { toBookMetadata } from "./bookMetadata.js";

const ALL_OPTION = "All";

function toClientBook(book) {
  return book
    ? {
        id: book.catalogId,
        title: book.title,
        author: book.author,
        genre: book.genre,
        year: book.year,
        publisher: book.publisher,
        isbn: book.isbn,
        language: book.language,
        coverUrl: book.coverUrl,
      }
    : null;
}

export function toClientListing(listing) {
  const { book, terms } = listing;

  return {
    id: listing.id,
    libraryBookId: listing.libraryBookId,
    title: book.title,
    author: book.author,
    cover: book.coverUrl || "",
    genre: book.genre,
    year: book.year,
    publisher: book.publisher,
    isbn: book.isbn || "",
    language: book.language,
    modality: listing.modality,
    condition: listing.condition,
    description: listing.description,
    desiredBook: terms.desiredBook ? terms.desiredBook.title : null,
    desiredBookMeta: toClientBook(terms.desiredBook),
    price: terms.priceCop,
    duration: terms.durationDays ? `${terms.durationDays} days` : null,
    paymentMethods: terms.paymentMethods ?? null,
    owner: listing.owner.name,
    ownerId: listing.owner.id,
    university: null,
    status: listing.status,
    closureReason: listing.closureReason,
    createdAt: listing.createdAt,
  };
}

function filterQuery({ search, modality, genre, condition }) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("q", search.trim());
  if (modality !== ALL_OPTION) params.set("modality", modality);
  if (genre !== ALL_OPTION) params.set("genre", genre);
  if (condition !== ALL_OPTION) params.set("condition", condition);
  return params;
}

export async function fetchListings(filters, { page = 1, limit = 12, signal } = {}) {
  const params = filterQuery(filters);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const { data, meta } = await apiRequest(`/listings?${params}`, { signal });
  return { listings: data.map(toClientListing), meta };
}

export async function fetchListingStats(filters, { signal } = {}) {
  const { data } = await apiRequest(`/listings/stats?${filterQuery(filters)}`, { signal });
  return data;
}

function durationDays(label) {
  return Number.parseInt(label, 10);
}

function listingTerms(modality, values) {
  if (modality === "Exchange") {
    return {
      desiredBook: values.desiredBookMeta ? toBookMetadata(values.desiredBookMeta) : null,
      priceCop: null,
      durationDays: null,
      paymentMethods: null,
    };
  }

  if (modality === "Loan") {
    return {
      desiredBook: null,
      priceCop: null,
      durationDays: durationDays(values.loanDuration),
      paymentMethods: null,
    };
  }

  if (modality === "Rental") {
    return {
      desiredBook: null,
      priceCop: Number(values.rentalPrice),
      durationDays: durationDays(values.rentalDuration),
      paymentMethods: null,
    };
  }

  return {
    desiredBook: null,
    priceCop: Number(values.salePrice),
    durationDays: null,
    paymentMethods: values.salePaymentMethods,
  };
}

export async function publishListing(libraryBookId, modality, values) {
  const { data } = await apiRequest("/listings", {
    method: "POST",
    authenticated: true,
    body: { libraryBookId, modality, terms: listingTerms(modality, values) },
  });

  return toClientListing(data);
}

export async function fetchListing(id, { signal } = {}) {
  try {
    const { data } = await apiRequest(`/listings/${encodeURIComponent(id)}`, { signal });
    return toClientListing(data);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

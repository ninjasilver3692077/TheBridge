import { apiRequest } from "./apiClient.js";
import { toBookMetadata } from "./bookMetadata.js";

const PAGE_LIMIT = 100;

function describeStatus({ status, activity, currentListing, borrowedFrom }) {
  const counterpart = activity?.counterpart.name ?? null;

  if (status === "Borrowed") {
    return { status: "Borrowed", borrowedFromName: borrowedFrom?.name ?? null };
  }

  if (status === "Lent") {
    return currentListing?.modality === "Rental"
      ? { status: "Published", activityStatus: "Rental accepted", activityWith: counterpart }
      : { status: "Loaned", loanedTo: counterpart };
  }

  if (status === "Reserved") {
    return activity?.kind === "OfferedExchange"
      ? { status: "Available", activityStatus: "Reserved for exchange", activityWith: counterpart }
      : { status: "Published", activityStatus: "Reserved", activityWith: counterpart };
  }

  if (status === "Published" && activity) {
    return { status: "Published", activityStatus: "Request pending", activityWith: counterpart };
  }

  if (status === "Available" && activity) {
    return { status: "Available", activityStatus: "Exchange request pending", activityWith: counterpart };
  }

  return { status };
}

export function toClientBook(libraryBook) {
  const { book, currentListing } = libraryBook;

  return {
    id: libraryBook.id,
    catalogId: book.catalogId,
    title: book.title,
    author: book.author,
    cover: book.coverUrl || "",
    genre: book.genre,
    year: book.year,
    publisher: book.publisher,
    isbn: book.isbn,
    language: book.language,
    condition: libraryBook.condition,
    notes: libraryBook.notes,
    addedAt: libraryBook.createdAt,
    listingId: currentListing?.id ?? null,
    listingModality: currentListing?.modality ?? null,
    lastModeration: libraryBook.lastModeration,
    activityStatus: null,
    activityWith: null,
    loanedTo: null,
    borrowedFromName: null,
    ...describeStatus(libraryBook),
  };
}

export function isBookFree(book) {
  return book.status === "Available" && !book.activityStatus;
}

export async function fetchMyBooks({ signal } = {}) {
  const books = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const { data, meta } = await apiRequest(
      `/my-books?page=${page}&limit=${PAGE_LIMIT}`,
      { authenticated: true, signal },
    );
    books.push(...data.map(toClientBook));
    totalPages = meta.totalPages;
    page += 1;
  }

  return books;
}

export async function addMyBook(catalogBook, condition, notes) {
  const { data } = await apiRequest("/my-books", {
    method: "POST",
    authenticated: true,
    body: { book: toBookMetadata(catalogBook), condition, notes: notes.trim() },
  });

  return toClientBook(data);
}

export async function resolveListingBook(requestedId, { signal } = {}) {
  const availableBooks = (await fetchMyBooks({ signal })).filter(isBookFree);
  const matchedBook = requestedId
    ? availableBooks.find((book) => book.id === requestedId)
    : null;

  if (matchedBook) {
    return { book: matchedBook, notice: null };
  }

  return {
    book: availableBooks[0] || null,
    notice: requestedId
      ? {
          title: "We couldn't find that book",
          text: "It doesn't exist or is not available to list right now, so we selected one of your available books instead.",
        }
      : {
          title: "No book selected",
          text: "Open this page from My Books to pick a specific book. For now we selected one of your available books.",
        },
  };
}

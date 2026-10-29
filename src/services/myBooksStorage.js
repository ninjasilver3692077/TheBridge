import { baseMyBooks } from "../data/myBooks.js";
import { loadSeedBooks, MY_BOOKS_EVENT } from "./librarySeed.js";
import { loadRequests } from "./requestsStorage.js";

const STORAGE_KEY = "thebridge:my-books";
const OVERRIDES_KEY = "thebridge:my-books-overrides";

function loadAddedBooks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function loadOverrides() {
  try {
    const stored = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : {};
  } catch {
    return {};
  }
}

export function loadMyBooks() {
  const overrides = loadOverrides();

  return [...baseMyBooks, ...loadSeedBooks(), ...loadAddedBooks()].map(
    (book) => (overrides[book.id] ? { ...book, ...overrides[book.id] } : book),
  );
}

export function markBookPublished(bookId, listing) {
  localStorage.setItem(
    OVERRIDES_KEY,
    JSON.stringify({
      ...loadOverrides(),
      [bookId]: {
        status: "Published",
        listingModality: listing.modality,
        listingId: listing.id,
      },
    }),
  );
  window.dispatchEvent(new CustomEvent(MY_BOOKS_EVENT));
}

export function saveMyBook(book) {
  let existing;

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    existing = Array.isArray(stored) ? stored : [];
  } catch {
    existing = [];
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...existing, book]),
  );

  window.dispatchEvent(
    new CustomEvent("thebridge:book-added", { detail: book }),
  );
}

export function createLibraryBook(book, condition, notes) {
  return {
    id: `added-${Date.now()}`,
    title: book.title,
    author: book.author,
    cover: book.cover || "",
    genre: book.genre || "Default",
    year: book.year || null,
    publisher: book.publisher || null,
    isbn: book.isbn || null,
    language: book.language || null,
    condition,
    status: "Available",
    notes: notes.trim(),
    addedAt: new Date().toISOString().split("T")[0],
  };
}

const ACTIVITY_RANK = { Pending: 1, Accepted: 2 };

function describeActivity(book, request) {
  if (request.direction === "sent") {
    return {
      activityStatus:
        request.status === "Accepted"
          ? "Reserved for exchange"
          : "Exchange request pending",
      activityWith: request.counterpart,
    };
  }

  if (request.status === "Pending") {
    return { activityStatus: "Request pending", activityWith: request.counterpart };
  }

  if (book.listingModality === "Loan") {
    return { status: "Loaned", loanedTo: request.counterpart };
  }

  return {
    activityStatus:
      book.listingModality === "Rental" ? "Rental accepted" : "Reserved",
    activityWith: request.counterpart,
  };
}

function applyRequestActivity(books, requests) {
  const activeByBook = new Map();

  requests.forEach((request) => {
    const bookId =
      request.direction === "received"
        ? request.myBookId
        : request.offeredBookId;
    const rank = ACTIVITY_RANK[request.status];

    if (!bookId || !rank) {
      return;
    }

    const current = activeByBook.get(bookId);

    if (!current || rank > ACTIVITY_RANK[current.status]) {
      activeByBook.set(bookId, request);
    }
  });

  return books.map((book) => {
    const request = activeByBook.get(book.id);
    return request ? { ...book, ...describeActivity(book, request) } : book;
  });
}

export function loadMyBooksWithActivity() {
  return applyRequestActivity(loadMyBooks(), loadRequests());
}

export function isBookFree(book) {
  return book.status === "Available" && !book.activityStatus;
}

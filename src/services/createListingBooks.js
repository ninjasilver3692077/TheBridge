import { isBookFree, loadMyBooksWithActivity } from "./myBooksStorage.js";

function loadAvailableMyBooks() {
  return loadMyBooksWithActivity().filter(
    (book) =>
      book &&
      typeof book.id === "string" &&
      typeof book.title === "string" &&
      isBookFree(book),
  );
}

export function resolveListingBook(requestedId) {
  const availableBooks = loadAvailableMyBooks();
  const matchedBook = requestedId
    ? availableBooks.find((book) => book.id === requestedId)
    : null;

  if (matchedBook) {
    return {
      book: matchedBook,
      notice: null,
    };
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

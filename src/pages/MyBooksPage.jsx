import { useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import MyBooksFilters from "../components/my-books/MyBooksFilters.jsx";
import MyBooksGrid from "../components/my-books/MyBooksGrid.jsx";
import MyBooksHeader from "../components/my-books/MyBooksHeader.jsx";
import { myBookFilters } from "../data/myBooks.js";
import { useStoredState } from "../hooks/useStoredState.js";
import { shuffleArray } from "../services/discovery.js";
import { MY_BOOKS_EVENT } from "../services/librarySeed.js";
import { loadMyBooksWithActivity } from "../services/myBooksStorage.js";
import { REQUESTS_EVENT } from "../services/requestsStorage.js";

const bookEvents = [MY_BOOKS_EVENT, REQUESTS_EVENT, "thebridge:book-added"];

const emptyCounts = Object.fromEntries(
  myBookFilters.map((filter) => [filter, 0]),
);

function countBooks(books) {
  return books.reduce(
    (counts, book) => ({
      ...counts,
      All: counts.All + 1,
      [book.status]: (counts[book.status] || 0) + 1,
    }),
    emptyCounts,
  );
}

function MyBooksPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const books = useStoredState(loadMyBooksWithActivity, bookEvents);
  const [displayOrder] = useState(() =>
    shuffleArray(books.map((book) => book.id)),
  );

  const orderedBooks = useMemo(() => {
    const position = new Map(displayOrder.map((id, index) => [id, index]));
    return [...books].sort(
      (a, b) => (position.get(a.id) ?? -1) - (position.get(b.id) ?? -1),
    );
  }, [books, displayOrder]);

  const counts = useMemo(() => countBooks(books), [books]);

  const filteredBooks = useMemo(
    () =>
      activeFilter === "All"
        ? orderedBooks
        : orderedBooks.filter((book) => book.status === activeFilter),
    [activeFilter, orderedBooks],
  );

  return (
    <AppShell
      title="My Books"
      subtitle="Manage the books in your personal library"
    >
      <section>
        <MyBooksHeader />

        <MyBooksFilters
          activeFilter={activeFilter}
          counts={counts}
          onChange={setActiveFilter}
        />

        <MyBooksGrid books={filteredBooks} activeFilter={activeFilter} />
      </section>
    </AppShell>
  );
}

export default MyBooksPage;

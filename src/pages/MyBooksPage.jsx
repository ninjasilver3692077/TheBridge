import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import MyBooksFilters from "../components/my-books/MyBooksFilters.jsx";
import MyBooksGrid from "../components/my-books/MyBooksGrid.jsx";
import MyBooksHeader from "../components/my-books/MyBooksHeader.jsx";
import { shuffleArray } from "../services/discovery.js";
import { MY_BOOKS_EVENT } from "../services/librarySeed.js";
import { loadMyBooksWithActivity } from "../services/myBooksStorage.js";
import { REQUESTS_EVENT } from "../services/requestsStorage.js";

function countBooks(books) {
  return books.reduce(
    (counts, book) => ({
      ...counts,
      All: counts.All + 1,
      [book.status]: (counts[book.status] || 0) + 1,
    }),
    { All: 0, Available: 0, Published: 0, Loaned: 0 },
  );
}

function MyBooksPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [books, setBooks] = useState(loadMyBooksWithActivity);
  const [displayOrder] = useState(() =>
    shuffleArray(books.map((book) => book.id)),
  );

  useEffect(() => {
    const refreshBooks = () => setBooks(loadMyBooksWithActivity());
    const events = [MY_BOOKS_EVENT, REQUESTS_EVENT, "thebridge:book-added", "storage"];

    events.forEach((name) => window.addEventListener(name, refreshBooks));

    return () =>
      events.forEach((name) => window.removeEventListener(name, refreshBooks));
  }, []);

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

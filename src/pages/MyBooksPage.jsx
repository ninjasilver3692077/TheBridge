import { useCallback, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import MyBooksFilters from "../components/my-books/MyBooksFilters.jsx";
import MyBooksGrid from "../components/my-books/MyBooksGrid.jsx";
import MyBooksHeader from "../components/my-books/MyBooksHeader.jsx";
import { myBookFilters } from "../data/myBooks.js";
import { useApiResource } from "../hooks/useApiResource.js";
import { fetchMyBooks } from "../services/myBooks.js";

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
  const load = useCallback((signal) => fetchMyBooks({ signal }), []);
  const { status, data, error, reload } = useApiResource(load);
  const books = useMemo(() => data ?? [], [data]);

  const counts = useMemo(() => countBooks(books), [books]);

  const filteredBooks = useMemo(
    () =>
      activeFilter === "All"
        ? books
        : books.filter((book) => book.status === activeFilter),
    [activeFilter, books],
  );

  return (
    <AppShell
      title="My Books"
      subtitle="Manage the books in your personal library"
    >
      <section>
        <MyBooksHeader />

        {status === "loading" && (
          <div className="mt-8">
            <LoadingState
              title="Loading your library..."
              message="Fetching the books you have added."
            />
          </div>
        )}

        {status === "error" && (
          <div className="mt-8">
            <ErrorState
              title="We could not load your library"
              message={error}
              onRetry={reload}
            />
          </div>
        )}

        {status === "success" && (
          <>
            <MyBooksFilters
              activeFilter={activeFilter}
              counts={counts}
              onChange={setActiveFilter}
            />

            <MyBooksGrid books={filteredBooks} activeFilter={activeFilter} />
          </>
        )}
      </section>
    </AppShell>
  );
}

export default MyBooksPage;

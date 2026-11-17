import { useCallback, useMemo, useState } from "react";
import { myBookFilters } from "../data/myBooks.js";
import { fetchMyBooks } from "../services/myBooks.js";
import { useApiResource } from "./useApiResource.js";
import { useAccountId } from "./useSession.js";

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

export function useMyBooks() {
  const [activeFilter, setActiveFilter] = useState("All");
  const accountId = useAccountId();
  const load = useCallback((signal) => fetchMyBooks({ signal }), []);
  const { status, data, error, reload } = useApiResource(load, accountId);
  const books = useMemo(() => data ?? [], [data]);

  const counts = useMemo(() => countBooks(books), [books]);

  const filteredBooks = useMemo(
    () =>
      activeFilter === "All"
        ? books
        : books.filter((book) => book.status === activeFilter),
    [activeFilter, books],
  );

  return { status, error, reload, activeFilter, setActiveFilter, counts, filteredBooks };
}

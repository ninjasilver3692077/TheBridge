import AppShell from "../components/AppShell.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import MyBooksFilters from "../components/my-books/MyBooksFilters.jsx";
import MyBooksGrid from "../components/my-books/MyBooksGrid.jsx";
import MyBooksHeader from "../components/my-books/MyBooksHeader.jsx";
import WithdrawListingDialog from "../components/my-books/WithdrawListingDialog.jsx";
import { useBookWithdrawal } from "../hooks/useBookWithdrawal.js";
import { useMyBooks } from "../hooks/useMyBooks.js";

function MyBooksPage() {
  const {
    status, error, reload, activeFilter, setActiveFilter, counts, filteredBooks,
  } = useMyBooks();
  const withdrawal = useBookWithdrawal(reload);

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

            <MyBooksGrid
              books={filteredBooks}
              activeFilter={activeFilter}
              onWithdraw={withdrawal.setWithdrawing}
            />
          </>
        )}
      </section>

      {withdrawal.withdrawing && (
        <WithdrawListingDialog
          book={withdrawal.withdrawing}
          onClose={() => withdrawal.setWithdrawing(null)}
          onWithdrawn={withdrawal.handleWithdrawn}
          onConflict={withdrawal.handleConflict}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {withdrawal.announcement}
      </p>
    </AppShell>
  );
}

export default MyBooksPage;

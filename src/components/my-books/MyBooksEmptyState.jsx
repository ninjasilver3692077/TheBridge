function MyBooksEmptyState({ activeFilter }) {
  return (
    <div className="mt-8 rounded-2xl bg-surface-muted px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-ink">
        {activeFilter === "All"
          ? "Your library is empty"
          : `No ${activeFilter.toLowerCase()} books`}
      </h2>

      <p className="mt-2 text-sm text-ink-muted">
        {activeFilter === "All"
          ? "Add your first book to start sharing it with your community."
          : "Try another filter or add a new book to your library."}
      </p>
    </div>
  );
}

export default MyBooksEmptyState;

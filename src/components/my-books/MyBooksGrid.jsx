import MyBookCard from "./MyBookCard.jsx";
import MyBooksEmptyState from "./MyBooksEmptyState.jsx";

function MyBooksGrid({ books, activeFilter, onWithdraw }) {
  return books.length ? (
    <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <MyBookCard key={book.id} book={book} onWithdraw={onWithdraw} />
      ))}
    </div>
  ) : (
    <MyBooksEmptyState activeFilter={activeFilter} />
  );
}

export default MyBooksGrid;

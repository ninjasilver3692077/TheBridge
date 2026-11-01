function ExchangeBookOption({ book, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-line-strong has-[:checked]:border-wine has-[:checked]:bg-wine-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-wine has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-canvas">
      <input
        type="radio"
        name="exchange-book"
        value={book.id}
        checked={checked}
        onChange={() => onChange(book.id)}
        className="h-4 w-4 accent-wine"
      />

      <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-muted">
        {book.cover && (
          <img
            src={book.cover}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{book.title}</p>
        <p className="truncate text-xs text-ink-muted">{book.author}</p>
      </div>
    </label>
  );
}

export default ExchangeBookOption;

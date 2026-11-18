import { useAddBookConfirm } from "../../hooks/useAddBookConfirm.js";
import { buttonGhost, buttonPrimary, notice } from "../../styles/ui.js";
import AddBookConfirmHeading from "./AddBookConfirmHeading.jsx";
import AddBookCover from "./AddBookCover.jsx";
import BookConditionOptions from "./BookConditionOptions.jsx";
import BookCopyNotes from "./BookCopyNotes.jsx";

function AddBookConfirm({ book, onBack, onSaved }) {
  const form = useAddBookConfirm(book, onSaved);

  return (
    <section className="max-w-3xl">
      <button type="button" onClick={onBack} className={`-ml-3 mb-6 ${buttonGhost}`}>
        ← Back to search
      </button>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-10">
        <AddBookCover book={book} />

        <form onSubmit={form.submit}>
          <AddBookConfirmHeading book={book} />

          <div className="mt-8">
            <BookConditionOptions
              value={form.condition}
              onChange={form.changeCondition}
              hasError={form.hasError}
            />
          </div>

          <BookCopyNotes value={form.notes} onChange={form.setNotes} />

          {form.submitError && (
            <p role="alert" className={`mt-6 text-sm ${notice.danger}`}>
              {form.submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={form.submitting}
            className={`mt-6 w-full sm:w-auto sm:px-8 ${buttonPrimary}`}
          >
            {form.submitting ? "Adding..." : "Add to My Library"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AddBookConfirm;

import { useState } from "react";
import AddBookConfirmHeading from "./AddBookConfirmHeading.jsx";
import AddBookCover from "./AddBookCover.jsx";
import BookConditionOptions from "./BookConditionOptions.jsx";
import BookCopyNotes from "./BookCopyNotes.jsx";
import { addMyBook } from "../../services/myBooks.js";
import { buttonGhost, buttonPrimary, notice } from "../../styles/ui.js";

function AddBookConfirm({ book, onBack, onSaved }) {
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [hasError, setHasError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleConditionChange = (value) => {
    setCondition(value);
    setHasError(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!condition) {
      setHasError(true);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      onSaved(await addMyBook(book, condition, notes));
    } catch (error) {
      setSubmitError(error?.message || "We could not add this book.");
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-3xl">
      <button type="button" onClick={onBack} className={`-ml-3 mb-6 ${buttonGhost}`}>
        ← Back to search
      </button>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-10">
        <AddBookCover book={book} />

        <form onSubmit={handleSubmit}>
          <AddBookConfirmHeading book={book} />

          <div className="mt-8">
            <BookConditionOptions
              value={condition}
              onChange={handleConditionChange}
              hasError={hasError}
            />
          </div>

          <BookCopyNotes value={notes} onChange={setNotes} />

          {submitError && (
            <p role="alert" className={`mt-6 text-sm ${notice.danger}`}>
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`mt-6 w-full sm:w-auto sm:px-8 ${buttonPrimary}`}
          >
            {submitting ? "Adding..." : "Add to My Library"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AddBookConfirm;

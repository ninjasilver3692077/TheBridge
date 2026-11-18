import { useState } from "react";
import { addMyBook } from "../services/myBooks.js";

export function useAddBookConfirm(book, onSaved) {
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [hasError, setHasError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const changeCondition = (value) => {
    setCondition(value);
    setHasError(false);
  };

  const submit = async (event) => {
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

  return {
    condition,
    notes,
    hasError,
    submitting,
    submitError,
    setNotes,
    changeCondition,
    submit,
  };
}

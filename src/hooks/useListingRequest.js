import { useCallback, useState } from "react";
import { useApiResource } from "./useApiResource.js";
import { fetchMyBooks, isBookFree } from "../services/myBooks.js";
import { sendRequest } from "../services/requests.js";

export function useListingRequest(listing, onClose, onSent) {
  const [selectedBookId, setSelectedBookId] = useState("");
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isExchange = listing.modality === "Exchange";
  const paymentMethods =
    listing.modality === "Sale" ? listing.paymentMethods ?? [] : [];
  const choosesPayment = paymentMethods.length > 0;
  const loadBooks = useCallback(
    async (signal) =>
      isExchange ? (await fetchMyBooks({ signal })).filter(isBookFree) : [],
    [isExchange],
  );
  const {
    status: booksStatus,
    data: books,
    error: booksError,
    reload: reloadBooks,
  } = useApiResource(loadBooks);
  const availableBooks = books ?? [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isExchange && !selectedBookId) {
      setError("Select one of your available books to continue.");
      return;
    }
    if (choosesPayment && !paymentMethod) {
      setPaymentError("Choose how you will pay to continue.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await sendRequest(listing.id, {
        offeredBookId: isExchange ? selectedBookId : null,
        paymentMethod: choosesPayment ? paymentMethod : null,
      });
      onSent();
      onClose();
    } catch (requestError) {
      setSubmitError(requestError?.message || "We could not send your request.");
      setSubmitting(false);
    }
  };

  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
    setPaymentError("");
  };

  const handleBookChange = (bookId) => {
    setSelectedBookId(bookId);
    setError("");
  };

  return {
    selectedBookId,
    error,
    paymentMethod,
    paymentError,
    submitting,
    submitError,
    isExchange,
    paymentMethods,
    choosesPayment,
    booksStatus,
    booksError,
    availableBooks,
    reloadBooks,
    handleSubmit,
    handlePaymentChange,
    handleBookChange,
  };
}

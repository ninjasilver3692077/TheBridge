import PaymentMethodOptions from "./PaymentMethodOptions.jsx";
import RequestDialogActions from "./RequestDialogActions.jsx";
import RequestExchangeBooks from "./RequestExchangeBooks.jsx";

function ListingRequestForm({ request, onClose }) {
  const {
    handleSubmit,
    choosesPayment,
    paymentMethods,
    paymentMethod,
    paymentError,
    handlePaymentChange,
    submitting,
    isExchange,
    booksStatus,
    availableBooks,
    submitError,
  } = request;

  return (
    <form onSubmit={handleSubmit}>
      <RequestExchangeBooks request={request} />

      {choosesPayment && (
        <PaymentMethodOptions
          methods={paymentMethods}
          selectedMethod={paymentMethod}
          error={paymentError}
          onChange={handlePaymentChange}
        />
      )}

      <RequestDialogActions
        sendDisabled={
          submitting ||
          (isExchange && (booksStatus !== "success" || availableBooks.length === 0))
        }
        submitting={submitting}
        submitError={submitError}
        onCancel={onClose}
      />
    </form>
  );
}

export default ListingRequestForm;

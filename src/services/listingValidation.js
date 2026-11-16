export function validateListing(modality, values) {
  const errors = {};

  if (!modality) {
    errors.modality = "Choose how you want to share this book.";
    return errors;
  }

  if (
    modality === "Exchange" &&
    values.desiredBookQuery?.trim() &&
    !values.desiredBookMeta
  ) {
    errors.desiredBookQuery =
      "Select a book from the catalog or leave the field empty.";
  }

  if (modality === "Loan" && !values.loanDuration) {
    errors.loanDuration = "Select a duration.";
  }

  if (modality === "Rental") {
    const price = Number(values.rentalPrice);

    if (
      values.rentalPrice.trim() === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      errors.rentalPrice = "Enter a price greater than 0.";
    }

    if (!values.rentalDuration) {
      errors.rentalDuration = "Select a duration.";
    }
  }

  if (modality === "Sale") {
    const price = Number(values.salePrice);

    if (
      values.salePrice.trim() === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      errors.salePrice = "Enter a price greater than 0.";
    }

    if (!values.salePaymentMethods?.length) {
      errors.salePaymentMethods = "Choose at least one payment method.";
    }
  }

  return errors;
}

export function formatPaymentMethods(methods) {
  return methods?.length ? methods.join(", ") : "To be agreed with the owner";
}

export function formatListingPrice(value) {
  return new Intl.NumberFormat("en-CO", {
    style: "currency",
    currency: "COP",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

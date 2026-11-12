import { useState } from "react";
import { validateListing } from "../services/listingValidation.js";

const initialValues = {
  desiredBook: "",
  desiredBookMeta: null,
  desiredBookQuery: "",
  loanDuration: "",
  rentalPrice: "",
  rentalDuration: "",
  salePrice: "",
};

export function useListingForm(onPublish) {
  const [modality, setModality] = useState("");
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleModalityChange = (nextModality) => {
    setModality(nextModality);
    setValues((current) => ({ ...current, desiredBookQuery: "" }));
    setErrors({});
    setSubmitError("");
  };

  const handleFieldChange = (name, value) => {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateListing(modality, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await onPublish({
        modality,
        values,
      });
    } catch (error) {
      setSubmitError(error?.message || "We could not publish this listing.");
      setSubmitting(false);
    }
  };

  return {
    modality,
    values,
    errors,
    submitting,
    submitError,
    handleModalityChange,
    handleFieldChange,
    handleSubmit,
  };
}

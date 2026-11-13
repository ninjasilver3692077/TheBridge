import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fieldFromServerMessage, safeReturnPath } from "../services/auth.js";

export function useAuthForm({ initialValues, validate, submit, onSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const remaining = { ...current };
      delete remaining[field];
      return remaining;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validate(values);
    setErrors(validationErrors);
    setFormError("");

    const [firstInvalidField] = Object.keys(validationErrors);
    if (firstInvalidField) {
      event.currentTarget.elements.namedItem(firstInvalidField)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submit(values);
      if (onSuccess) onSuccess(result);
      else navigate(safeReturnPath(location.state?.from, result.account.role), { replace: true });
    } catch (error) {
      const fieldError = fieldFromServerMessage(error?.message ?? "");
      if (fieldError) setErrors({ [fieldError.field]: fieldError.message });
      else setFormError(error?.message || "Something went wrong. Try again.");
      setIsSubmitting(false);
    }
  };

  return { values, errors, formError, isSubmitting, updateField, handleSubmit };
}

import { useState } from "react";
import {
  changePassword,
  fieldFromServerMessage,
  validateChangePasswordFields,
} from "../services/auth.js";

export function useChangePasswordForm(onSuccess) {
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    const nextValue = event.target.value;
    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateChangePasswordFields(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      onSuccess("Your password was updated.");
    } catch (requestError) {
      const message = requestError?.message || "We could not update your password.";
      const mapped = fieldFromServerMessage(message);
      if (mapped) {
        setErrors((current) => ({ ...current, [mapped.field]: mapped.message }));
      } else {
        setSubmitError(message);
      }
      setSubmitting(false);
    }
  };

  return { values, errors, submitError, submitting, updateField, handleSubmit };
}

import { useState } from "react";
import { deleteOwnAccount, fieldFromServerMessage } from "../services/auth.js";

export function useDeleteAccountForm(onDeleted) {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updatePassword = (event) => {
    setPassword(event.target.value);
    setPasswordError("");
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!password) {
      setPasswordError("Enter your password.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await deleteOwnAccount({ password });
      onDeleted();
    } catch (requestError) {
      const message = requestError?.message || "We could not delete your account.";
      const mapped = fieldFromServerMessage(message);
      if (mapped && mapped.field === "password") {
        setPasswordError(mapped.message);
      } else {
        setSubmitError(message);
      }
      setSubmitting(false);
    }
  };

  return { password, passwordError, submitError, submitting, updatePassword, handleSubmit };
}

import { fieldError, fieldLabel, inputField } from "../../styles/ui.js";

function AuthField({ id, label, type = "text", autoComplete, value, error, hint, onChange }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy || undefined}
        className={inputField}
      />

      {hint && !error && (
        <p id={hintId} className="mt-2 text-sm text-ink-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className={fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

export default AuthField;

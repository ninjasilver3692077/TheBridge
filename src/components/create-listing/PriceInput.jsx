import { fieldLabel, inputField } from "../../styles/ui.js";
import FieldError from "./FieldError.jsx";

function PriceInput({ name, label, placeholder, value, onChange, error }) {
  return (
    <div>
      <label htmlFor={name} className={fieldLabel}>
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted">
          COP
        </span>

        <input
          id={name}
          type="number"
          inputMode="numeric"
          min="0"
          step="500"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
          aria-invalid={Boolean(error)}
          className={`${inputField} pl-14`}
        />
      </div>

      <FieldError message={error} />
    </div>
  );
}

export default PriceInput;

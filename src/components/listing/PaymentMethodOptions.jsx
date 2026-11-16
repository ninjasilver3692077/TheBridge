import { fieldError } from "../../styles/ui.js";

function PaymentMethodOptions({ methods, selectedMethod, error, onChange }) {
  return (
    <fieldset
      className="mt-6"
      aria-describedby={error ? "payment-method-error" : undefined}
    >
      <legend className="text-sm font-semibold text-ink">
        How will you pay?
      </legend>

      <p className="mt-1 text-xs leading-5 text-ink-muted">
        The owner accepts these methods. You pay them directly when you meet.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {methods.map((method) => (
          <label
            key={method}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 text-sm font-semibold text-ink transition-colors hover:border-line-strong has-[:checked]:border-wine has-[:checked]:bg-wine-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-wine has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-canvas"
          >
            <input
              type="radio"
              name="payment-method"
              value={method}
              checked={selectedMethod === method}
              onChange={() => onChange(method)}
              className="h-4 w-4 accent-wine"
            />
            {method}
          </label>
        ))}
      </div>

      {error && (
        <p id="payment-method-error" role="alert" className={fieldError}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default PaymentMethodOptions;

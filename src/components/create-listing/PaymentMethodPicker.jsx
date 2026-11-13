import { paymentMethodOptions } from "../../data/createListingData.js";
import FieldError from "./FieldError.jsx";

function PaymentMethodPicker({ value, onChange, error }) {
  const toggle = (method) => {
    const next = value.includes(method)
      ? value.filter((selected) => selected !== method)
      : paymentMethodOptions.filter(
          (option) => option === method || value.includes(option),
        );
    onChange(next);
  };

  return (
    <fieldset aria-describedby="sale-payment-methods-hint">
      <legend className="mb-2 block text-sm font-semibold text-ink">
        Payment methods you accept
      </legend>

      <p
        id="sale-payment-methods-hint"
        className="mb-3 text-sm leading-6 text-ink-muted"
      >
        TheBridge only records your choice; the buyer pays you directly.
      </p>

      <div className="flex flex-wrap gap-2">
        {paymentMethodOptions.map((method) => (
          <label
            key={method}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink has-[:checked]:border-wine has-[:checked]:bg-wine-soft has-[:checked]:text-wine-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-wine has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-canvas"
          >
            <input
              type="checkbox"
              name="salePaymentMethods"
              value={method}
              checked={value.includes(method)}
              onChange={() => toggle(method)}
              aria-invalid={Boolean(error)}
              className="h-4 w-4 accent-wine"
            />
            {method}
          </label>
        ))}
      </div>

      <FieldError message={error} />
    </fieldset>
  );
}

export default PaymentMethodPicker;

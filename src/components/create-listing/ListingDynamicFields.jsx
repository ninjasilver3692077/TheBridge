import DesiredBookPicker from "./DesiredBookPicker.jsx";
import DurationSelect from "./DurationSelect.jsx";
import PaymentMethodPicker from "./PaymentMethodPicker.jsx";
import PriceInput from "./PriceInput.jsx";

function ListingDynamicFields({ modality, values, errors, onChange }) {
  if (modality === "Exchange") {
    return (
      <DesiredBookPicker
        values={values}
        error={errors.desiredBookQuery}
        onChange={onChange}
      />
    );
  }

  if (modality === "Loan") {
    return (
      <DurationSelect
        name="loanDuration"
        label="Loan duration"
        value={values.loanDuration}
        onChange={onChange}
        error={errors.loanDuration}
      />
    );
  }

  if (modality === "Rental") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PriceInput
          name="rentalPrice"
          label="Rental price"
          placeholder="8000"
          value={values.rentalPrice}
          onChange={onChange}
          error={errors.rentalPrice}
        />

        <DurationSelect
          name="rentalDuration"
          label="Rental duration"
          value={values.rentalDuration}
          onChange={onChange}
          error={errors.rentalDuration}
        />
      </div>
    );
  }

  if (modality === "Sale") {
    return (
      <div className="space-y-6">
        <PriceInput
          name="salePrice"
          label="Sale price"
          placeholder="25000"
          value={values.salePrice}
          onChange={onChange}
          error={errors.salePrice}
        />

        <PaymentMethodPicker
          value={values.salePaymentMethods}
          onChange={(methods) => onChange("salePaymentMethods", methods)}
          error={errors.salePaymentMethods}
        />
      </div>
    );
  }

  return null;
}

export default ListingDynamicFields;

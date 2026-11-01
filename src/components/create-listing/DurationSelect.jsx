import { listingDurations } from "../../data/createListingData.js";
import { fieldLabel, selectFieldLg } from "../../styles/ui.js";
import SelectChevron from "../SelectChevron.jsx";
import FieldError from "./FieldError.jsx";

function DurationSelect({ name, label, value, onChange, error }) {
  return (
    <div>
      <label htmlFor={name} className={fieldLabel}>
        {label}
      </label>

      <div className="relative">
        <select
          id={name}
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
          aria-invalid={Boolean(error)}
          className={selectFieldLg}
        >
          <option value="">Select a duration</option>

          {listingDurations.map((duration) => (
            <option key={duration} value={duration}>
              {duration}
            </option>
          ))}
        </select>
        <SelectChevron />
      </div>

      <FieldError message={error} />
    </div>
  );
}

export default DurationSelect;

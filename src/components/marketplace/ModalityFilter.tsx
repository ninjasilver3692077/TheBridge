import type { Modality } from "@/types";
import { listingModalities } from "../../data/createListingData.js";
import { ALL_OPTION } from "../../services/listingFilters.js";
import { chip } from "../../styles/ui.js";

type ModalityOption = Modality | typeof ALL_OPTION;

interface ModalityFilterProps {
  value: ModalityOption;
  onChange: (modality: ModalityOption) => void;
}

const MODALITIES: ModalityOption[] = [
  ALL_OPTION,
  ...listingModalities.map(({ id }) => id as Modality),
];

function ModalityFilter({ value, onChange }: ModalityFilterProps) {
  return (
    <fieldset>
      <legend className="sr-only">Sharing modality</legend>
      <div className="flex flex-wrap gap-2">
        {MODALITIES.map((modality) => (
          <button
            key={modality}
            type="button"
            aria-pressed={value === modality}
            onClick={() => onChange(modality)}
            className={chip}
          >
            {modality}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default ModalityFilter;

import type { BookMetadata } from "@/types";
import { focusRing } from "../../styles/ui.js";

interface FavoriteButtonProps {
  title: BookMetadata["title"];
  isFavorite: boolean;
  onToggle: () => void;
}

function FavoriteButton({ title, isFavorite, onToggle }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? `Remove ${title} from favorites`
          : `Add ${title} to favorites`
      }
      className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow-sm backdrop-blur transition-colors ${focusRing} ${
        isFavorite
          ? "bg-wine text-white hover:bg-wine-hover"
          : "bg-surface/90 text-ink-muted hover:text-wine-ink"
      }`}
    >
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    </button>
  );
}

export default FavoriteButton;

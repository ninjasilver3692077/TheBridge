import { Link, useLocation } from "react-router-dom";
import { getRequestCtaState } from "../../services/listingRequest.js";
import {
  buttonPrimary,
  buttonSecondary,
  buttonSuccess,
} from "../../styles/ui.js";

function QuickViewActions({ listing, requestState, onRequest }) {
  const location = useLocation();
  const cta = getRequestCtaState(requestState, listing.modality);
  const className = `sm:flex-1 ${cta.sent ? buttonSuccess : buttonPrimary}`;

  return (
    <footer className="flex flex-col-reverse gap-3 border-t border-line px-5 py-4 sm:flex-row sm:px-6">
      <Link
        to={`/listing/${listing.id}`}
        className={`sm:flex-1 ${buttonSecondary}`}
      >
        View full details
      </Link>

      {cta.signIn ? (
        <Link
          to="/login"
          state={{ from: `${location.pathname}${location.search}` }}
          className={className}
        >
          {cta.label}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onRequest}
          disabled={cta.disabled}
          className={className}
        >
          {cta.label}
        </button>
      )}

      <p className="sr-only" aria-live="polite">
        {cta.sent ? "Your request was sent." : ""}
      </p>
    </footer>
  );
}

export default QuickViewActions;

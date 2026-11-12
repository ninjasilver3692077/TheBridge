import { Link, useLocation } from "react-router-dom";
import { getRequestCtaState } from "../../services/listingRequest.js";
import { buttonPrimary, buttonSuccess } from "../../styles/ui.js";

function ListingRequestCta({ modality, requestState, onRequest }) {
  const location = useLocation();
  const cta = getRequestCtaState(requestState, modality);
  const className = `mt-8 w-full sm:w-auto sm:px-8 ${
    cta.sent ? buttonSuccess : buttonPrimary
  }`;

  return (
    <>
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
    </>
  );
}

export default ListingRequestCta;

import { useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { useListingRequestState } from "../../hooks/useListingRequestState.js";
import ListingRequestModal from "../listing/ListingRequestModal.jsx";
import QuickViewActions from "./QuickViewActions.jsx";
import QuickViewBackdrop from "./QuickViewBackdrop.jsx";
import QuickViewDetails from "./QuickViewDetails.jsx";
import QuickViewHeader from "./QuickViewHeader.jsx";
import QuickViewSummary from "./QuickViewSummary.jsx";

function ListingQuickView({ listing, onClose }) {
  const open = Boolean(listing);
  const [displayed, setDisplayed] = useState(listing);
  const [requestOpen, setRequestOpen] = useState(false);
  const requestState = useListingRequestState(displayed);
  const { dialogRef, handleKeyDown } = useDialogFocus(open, onClose);

  if (listing && listing !== displayed) {
    setDisplayed(listing);
  }

  useBodyScrollLock(open);

  return (
    <>
      <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
        <QuickViewBackdrop open={open} onClose={onClose} />

        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-title"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          style={{
            transitionProperty: open ? "transform" : "transform, visibility",
          }}
          className={`absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-2xl duration-300 ease-out focus:outline-none motion-reduce:duration-0 sm:w-[85vw] sm:border-l sm:border-line md:w-[30rem] lg:w-[32rem] ${
            open ? "" : "invisible translate-x-full"
          }`}
        >
          {displayed && (
            <>
              <QuickViewHeader onClose={onClose} />

              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                <QuickViewSummary listing={displayed} />
                <QuickViewDetails listing={displayed} />
              </div>

              <QuickViewActions
                listing={displayed}
                requestState={requestState}
                onRequest={() => setRequestOpen(true)}
              />
            </>
          )}
        </section>
      </div>

      {displayed && (
        <ListingRequestModal
          key={displayed.id}
          listing={displayed}
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          onSent={() => requestState.markSent(displayed.id)}
        />
      )}
    </>
  );
}

export default ListingQuickView;

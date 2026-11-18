import { createPortal } from "react-dom";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";

function AccountDialogFrame({ titleId, title, description, onClose, children }) {
  const { dialogRef, handleKeyDown } = useDialogFocus(true, onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#1B0C12]/55 p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg rounded-2xl border border-line bg-surface-raised p-6 shadow-2xl focus:outline-none sm:p-7"
      >
        <h2 id={titleId} className="text-2xl font-bold tracking-tight text-ink">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>

        {children}
      </section>
    </div>,
    document.body,
  );
}

export default AccountDialogFrame;

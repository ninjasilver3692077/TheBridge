import {
  getRequestActions,
  getRequestStatusMessage,
  requestStatusMeta,
} from "../../services/requestStatus.js";
import { card } from "../../styles/ui.js";
import RequestActions from "./RequestActions.jsx";
import RequestSummary from "./RequestSummary.jsx";

function RequestCard({ request, busy, onAction }) {
  const meta = requestStatusMeta[request.status];
  const actions = getRequestActions(request);
  const counterpartLabel =
    request.direction === "received"
      ? `From ${request.counterpart}`
      : `To ${request.counterpart}`;

  return (
    <article className={`p-4 sm:p-5 ${card}`}>
      <RequestSummary
        title={request.title}
        author={request.author}
        modality={request.modality}
        cover={request.cover}
        meta={meta}
        counterpartLabel={counterpartLabel}
      />

      <div className="mt-3 sm:pl-[4.5rem]">
        <p className="text-sm leading-6 text-ink">{request.note}</p>

        {request.paymentMethod && (
          <p className="mt-1 text-sm leading-6 text-ink">
            <span className="font-semibold">Payment method:</span>{" "}
            {request.paymentMethod}
          </p>
        )}

        {actions.length > 0 && (
          <RequestActions
            actions={actions}
            busy={busy}
            onAction={(action) => onAction(request.id, action)}
          />
        )}

        <p className="mt-3 text-xs leading-5 text-ink-muted">
          {getRequestStatusMessage(request)}
        </p>
      </div>
    </article>
  );
}

export default RequestCard;

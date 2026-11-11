import { tone } from "../styles/ui.js";

export const requestStatusMeta = {
  Pending: {
    label: "Pending",
    classes: tone.amber,
  },
  Accepted: {
    label: "Accepted",
    classes: tone.sage,
  },
  Rejected: {
    label: "Rejected",
    classes: tone.rose,
  },
  Cancelled: {
    label: "Cancelled",
    classes: tone.rose,
  },
  Completed: {
    label: "Completed",
    classes: tone.plum,
  },
};

export function getRequestActions(request) {
  if (request.direction === "received" && request.status === "Pending") {
    return [
      { action: "accept", label: "Accept", primary: true },
      { action: "reject", label: "Reject" },
    ];
  }

  if (request.direction === "received" && request.status === "Accepted") {
    return [{ action: "complete", label: "Mark as completed", primary: true }];
  }

  if (request.direction === "sent" && request.status === "Pending") {
    return [{ action: "cancel", label: "Cancel request" }];
  }

  return [];
}

function getRejectedMessage(request) {
  if (request.rejectionReason === "CompetingRequestAccepted") {
    return "Another request for this book was accepted, so this one was closed.";
  }

  if (request.rejectionReason === "ListingWithdrawn") {
    return "This listing was withdrawn, so this request was closed.";
  }

  if (request.rejectionReason === "ListingRemoved") {
    return "This listing was removed by a moderator, so this request was closed.";
  }

  return request.direction === "received"
    ? `You rejected the request from ${request.counterpart}. They will see this listing as no longer available to them.`
    : `${request.counterpart} rejected your request. You can look for another listing in the Marketplace.`;
}

export function getRequestStatusMessage(request) {
  if (request.status === "Accepted") {
    return request.direction === "received"
      ? `You accepted the request from ${request.counterpart}. Coordinate delivery with them in person; TheBridge does not send messages for you.`
      : `${request.counterpart} accepted your request. Reach out to them to coordinate delivery in person.`;
  }

  if (request.status === "Rejected") {
    return getRejectedMessage(request);
  }

  if (request.status === "Cancelled") {
    return request.direction === "sent"
      ? "You cancelled this request."
      : `${request.counterpart} cancelled their request.`;
  }

  if (request.status === "Completed") {
    return request.direction === "received"
      ? `You marked the request from ${request.counterpart} as completed.`
      : `${request.counterpart} marked your request as completed.`;
  }

  return request.direction === "received"
    ? `Waiting for you to accept or reject ${request.counterpart}'s request.`
    : `Waiting for ${request.counterpart} to respond to your request.`;
}

import RequestCard from "./RequestCard.jsx";

function RequestList({ requests, busyId, onAction }) {
  return (
    <div className="mt-6 space-y-3">
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          busy={busyId === request.id}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

export default RequestList;

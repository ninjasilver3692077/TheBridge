import ErrorState from "../ErrorState.jsx";
import LoadingState from "../LoadingState.jsx";
import RequestsResults from "./RequestsResults.jsx";

function RequestsContent({ requests }) {
  const { status, error, reload } = requests;

  return (
    <>
      {status === "loading" && (
        <div className="mt-8">
          <LoadingState
            title="Loading your requests..."
            message="Fetching the requests you sent and received."
          />
        </div>
      )}

      {status === "error" && (
        <div className="mt-8">
          <ErrorState
            title="We could not load your requests"
            message={error}
            onRetry={reload}
          />
        </div>
      )}

      {status === "success" && <RequestsResults requests={requests} />}
    </>
  );
}

export default RequestsContent;

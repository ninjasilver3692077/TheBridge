import ErrorState from "../ErrorState.jsx";
import LoadingState from "../LoadingState.jsx";
import AdminOverview from "./AdminOverview.jsx";

function AdminOverviewSection({ status, overview, error, onRetry }) {
  return (
    <>
      {status === "loading" && (
        <div className="mt-8">
          <LoadingState
            title="Loading the overview..."
            message="Counting members, listings and requests."
          />
        </div>
      )}

      {status === "error" && (
        <div className="mt-8">
          <ErrorState
            title="We could not load the overview"
            message={error}
            onRetry={onRetry}
          />
        </div>
      )}

      {status === "success" && <AdminOverview overview={overview} />}
    </>
  );
}

export default AdminOverviewSection;

import { useCallback } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import ErrorState from "./components/ErrorState.jsx";
import LoadingState from "./components/LoadingState.jsx";
import { useApiResource } from "./hooks/useApiResource.js";
import { useSession, useSessionExpiryObserver } from "./hooks/useSession.js";
import AboutPage from "./pages/AboutPage.jsx";
import AddBookPage from "./pages/AddBookPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import CreateListingPage from "./pages/CreateListingPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ListingDetailsPage from "./pages/ListingDetailsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MarketplacePage from "./pages/MarketplacePage.jsx";
import MyBooksPage from "./pages/MyBooksPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RequestsPage from "./pages/RequestsPage.jsx";
import { homePathByRole, safeReturnPath } from "./services/auth.js";
import { isSessionExpired } from "./services/authStorage.js";
import { fetchListing } from "./services/listings.js";

function SessionBoundary() {
  useSessionExpiryObserver();

  return <Outlet />;
}

function ProtectedRoute({ role }) {
  const session = useSession();
  const location = useLocation();

  if (isSessionExpired(session)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (session.account.role !== role) {
    return <Navigate to={homePathByRole[session.account.role]} replace />;
  }

  return <Outlet />;
}

function GuestOnlyRoute() {
  const session = useSession();
  const location = useLocation();

  if (!isSessionExpired(session)) {
    return (
      <Navigate
        to={safeReturnPath(location.state?.from, session.account.role)}
        replace
      />
    );
  }

  return <Outlet />;
}

function ListingRoute() {
  const { id } = useParams();
  const load = useCallback((signal) => fetchListing(id, { signal }), [id]);
  const { status, data: listing, error, reload } = useApiResource(load);

  if (status === "success") {
    return <ListingDetailsPage key={id} listing={listing} />;
  }

  return (
    <AppShell title="Listing details" subtitle="Loading this listing">
      {status === "error" ? (
        <ErrorState
          title="We could not load this listing"
          message={error}
          onRetry={reload}
        />
      ) : (
        <LoadingState
          title="Loading listing..."
          message="Fetching the details of this book."
        />
      )}
    </AppShell>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<SessionBoundary />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/listing/:id" element={<ListingRoute />} />

          <Route element={<ProtectedRoute role="Member" />}>
            <Route path="/my-books" element={<MyBooksPage />} />
            <Route path="/add-book" element={<AddBookPage />} />
            <Route path="/create-listing" element={<CreateListingPage />} />
            <Route path="/requests" element={<RequestsPage />} />
          </Route>

          <Route element={<ProtectedRoute role="Admin" />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route element={<GuestOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

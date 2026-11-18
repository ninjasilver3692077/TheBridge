import { BrowserRouter, Route, Routes } from "react-router-dom";
import GuestOnlyRoute from "./components/routing/GuestOnlyRoute.jsx";
import ProtectedRoute from "./components/routing/ProtectedRoute.jsx";
import SessionBoundary from "./components/routing/SessionBoundary.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import AddBookPage from "./pages/AddBookPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import CreateListingPage from "./pages/CreateListingPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ListingRoute from "./pages/ListingRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MarketplacePage from "./pages/MarketplacePage.jsx";
import MyBooksPage from "./pages/MyBooksPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RequestsPage from "./pages/RequestsPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

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

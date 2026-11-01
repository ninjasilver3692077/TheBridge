import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import AboutPage from "./pages/AboutPage.jsx";
import AddBookPage from "./pages/AddBookPage.jsx";
import CreateListingPage from "./pages/CreateListingPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ListingDetailsPage from "./pages/ListingDetailsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MarketplacePage from "./pages/MarketplacePage.jsx";
import MyBooksPage from "./pages/MyBooksPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import RequestsPage from "./pages/RequestsPage.jsx";
import { findListingById } from "./services/listingsStorage.js";

function ProtectedRoute() {
  const isAuthenticated =
    localStorage.getItem("thebridge:authenticated") === "true";

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function ListingRoute() {
  const { id } = useParams();
  const listing = findListingById(id);

  return <ListingDetailsPage key={id} listing={listing} />;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/listing/:id" element={<ListingRoute />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/my-books" element={<MyBooksPage />} />
          <Route path="/add-book" element={<AddBookPage />} />
          <Route path="/create-listing" element={<CreateListingPage />} />
          <Route path="/requests" element={<RequestsPage />} />
        </Route>

        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

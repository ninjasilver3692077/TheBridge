import { useCallback, useEffect, useRef, useState } from "react";
import {
  DISCOVERY_QUERIES,
  pickRandom,
  shuffleArray,
} from "../services/discovery.js";
import { isSessionExpired } from "../services/authStorage.js";
import {
  addFavorite,
  fetchFavorites,
  removeFavorite,
} from "../services/favorites.js";
import { searchOpenLibraryWithCache } from "../services/openLibrary.js";
import { useApiResource } from "./useApiResource.js";
import { useAccountId, useSession } from "./useSession.js";

const noFavorites = [];

function validateSearch(value) {
  const query = value.trim();

  if (!query) {
    return "Enter a title, author, or keyword.";
  }

  return query.length < 3 ? "Use at least 3 characters." : "";
}

export function useMarketplace() {
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [books, setBooks] = useState([]);
  const session = useSession();
  const signedIn = Boolean(session) && !isSessionExpired(session);
  const isMember = signedIn && session.account.role === "Member";
  const accountId = useAccountId();
  const [favoritesNotice, setFavoritesNotice] = useState("");
  const loadFavorites = useCallback(
    (signal) =>
      isMember ? fetchFavorites({ signal }) : Promise.resolve(noFavorites),
    [isMember],
  );
  const {
    data: favorites,
    status: favoritesStatus,
    error: favoritesError,
    reload: reloadFavorites,
  } = useApiResource(loadFavorites, accountId);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const requestControllerRef = useRef(null);

  useEffect(() => {
    const discoveryQuery = pickRandom(DISCOVERY_QUERIES);
    const controller = new AbortController();
    requestControllerRef.current = controller;

    const loadInitialBooks = async () => {
      try {
        const result = await searchOpenLibraryWithCache(
          discoveryQuery,
          controller.signal,
        );
        setActiveQuery(discoveryQuery);
        setBooks(shuffleArray(result.books));
        setSavedAt(result.savedAt);
        setStatus("success");
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setActiveQuery(discoveryQuery);
          setError(requestError.message || "Open Library is unavailable.");
          setStatus("error");
        }
      }
    };

    loadInitialBooks();

    return () => controller.abort();
  }, []);

  const runSearch = async (query) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    setActiveQuery(query);
    setStatus("loading");
    setError("");

    try {
      const result = await searchOpenLibraryWithCache(query, controller.signal);
      setBooks(result.books);
      setSavedAt(result.savedAt);
      setStatus("success");
      return true;
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        return false;
      }

      setError(requestError.message || "Open Library is unavailable.");
      setStatus("error");
      return false;
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);
    setSearchError(value ? validateSearch(value) : "");
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();

    const message = validateSearch(searchInput);
    setSearchError(message);

    if (message) {
      return;
    }

    if (await runSearch(searchInput.trim())) {
      setSearchInput("");
      setSearchError("");
    }
  };

  const toggleFavorite = async (book) => {
    if (!isMember) {
      setFavoritesNotice(
        signedIn
          ? "Only members can save favorites."
          : "Sign in as a member to save favorites.",
      );
      return;
    }

    const saved = favorites?.find((favorite) => favorite.id === book.id);
    setFavoritesNotice("");

    try {
      await (saved ? removeFavorite(saved.favoriteId) : addFavorite(book));
    } catch (requestError) {
      if (requestError.status !== 409 && requestError.status !== 404) {
        setFavoritesNotice(requestError.message || "Favorites are unavailable.");
      }
    }

    reloadFavorites();
  };

  return {
    activeQuery,
    books,
    error,
    favorites: favorites ?? noFavorites,
    favoritesError,
    favoritesStatus,
    favoritesNotice,
    handleSearchChange,
    handleSearchSubmit,
    reloadFavorites,
    runSearch,
    savedAt,
    searchError,
    searchInput,
    status,
    toggleFavorite,
  };
}

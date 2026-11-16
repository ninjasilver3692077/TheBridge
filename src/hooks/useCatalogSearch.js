import { useEffect, useState } from "react";
import { validateCatalogQuery } from "../services/catalogSearch.js";
import { searchOpenLibraryWithCache } from "../services/openLibrary.js";

export function useCatalogSearch() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState([]);
  const [savedAt, setSavedAt] = useState(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (status !== "loading" || !submittedQuery) {
      return undefined;
    }

    const controller = new AbortController();

    const loadResults = async () => {
      try {
        const { books, savedAt: savedAtResult } = await searchOpenLibraryWithCache(
          submittedQuery,
          controller.signal,
        );
        setResults(books);
        setSavedAt(savedAtResult);
        setStatus(books.length > 0 ? "results" : "no-results");
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setSavedAt(null);
          setStatus("error");
        }
      }
    };

    loadResults();

    return () => controller.abort();
  }, [status, submittedQuery]);

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
    setValidationError("");
  };

  const submitSearch = () => {
    const message = validateCatalogQuery(query);

    if (message) {
      setValidationError(message);
      return;
    }

    setSubmittedQuery(query.trim());
    setStatus("loading");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitSearch();
  };

  const resetSearch = () => {
    setQuery("");
    setSubmittedQuery("");
    setResults([]);
    setSavedAt(null);
    setValidationError("");
    setStatus("idle");
  };

  const retrySearch = () => {
    setStatus(submittedQuery ? "loading" : "idle");
  };

  return {
    query,
    submittedQuery,
    status,
    results,
    savedAt,
    validationError,
    handleQueryChange,
    handleSubmit,
    submitSearch,
    resetSearch,
    retrySearch,
  };
}

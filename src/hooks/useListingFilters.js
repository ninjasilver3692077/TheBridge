import { useEffect, useMemo, useState } from "react";
import { initialListingFilters } from "../services/listingFilters.js";
import { fetchListings, fetchListingStats } from "../services/listings.js";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;
const noFacets = { genres: [], conditions: [] };

export function useListingFilters() {
  const [filters, setFilters] = useState(initialListingFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialListingFilters);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const request = useMemo(() => ({ appliedFilters, reloadKey }), [appliedFilters, reloadKey]);

  useEffect(() => {
    const delay = filters.search === appliedFilters.search ? 0 : SEARCH_DEBOUNCE_MS;
    const timer = setTimeout(() => setAppliedFilters(filters), delay);
    return () => clearTimeout(timer);
  }, [filters, appliedFilters.search]);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchListings(request.appliedFilters, { limit: PAGE_SIZE, signal: controller.signal }),
      fetchListingStats(request.appliedFilters, { signal: controller.signal }),
    ]).then(
      ([page, stats]) =>
        setResult({
          request,
          status: "success",
          listings: page.listings,
          meta: page.meta,
          stats,
          error: "",
          loadMoreError: "",
        }),
      (error) => {
        if (error?.name === "AbortError") return;
        setResult((previous) => ({
          request,
          status: "error",
          listings: [],
          meta: null,
          stats: previous?.stats ?? null,
          error: error?.message || "Something went wrong.",
          loadMoreError: "",
        }));
      },
    );

    return () => controller.abort();
  }, [request]);

  const settled = result?.request === request;
  const listings = result?.listings ?? [];
  const meta = result?.meta ?? null;
  const hasMore = settled && meta !== null && meta.page < meta.totalPages;

  const hasActiveFilters = Object.keys(initialListingFilters).some(
    (key) => filters[key] !== initialListingFilters[key],
  );

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => {
    setFilters(initialListingFilters);
  };

  const reload = () => setReloadKey((key) => key + 1);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);

    try {
      const next = await fetchListings(request.appliedFilters, {
        page: meta.page + 1,
        limit: PAGE_SIZE,
      });
      setResult((current) => ({
        ...current,
        listings: [...current.listings, ...next.listings],
        meta: next.meta,
        loadMoreError: "",
      }));
    } catch (error) {
      setResult((current) => ({
        ...current,
        loadMoreError: error?.message || "Something went wrong.",
      }));
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    filters,
    listings,
    resultCount: meta?.total ?? 0,
    stats: result?.stats ?? null,
    facets: result?.stats?.facets ?? noFacets,
    status: settled ? result.status : "loading",
    error: settled ? result.error : "",
    hasActiveFilters,
    hasMore,
    loadingMore,
    loadMoreError: result?.loadMoreError ?? "",
    updateFilter,
    resetFilters,
    reload,
    loadMore,
  };
}

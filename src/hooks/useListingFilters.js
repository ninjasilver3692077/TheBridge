import { useMemo, useState } from "react";
import {
  computeListingStats,
  filterListings,
  initialListingFilters,
} from "../services/listingFilters.js";
import {
  LISTINGS_EVENT,
  loadAllListings,
} from "../services/listingsStorage.js";
import { useStoredState } from "./useStoredState.js";

const listingEvents = [LISTINGS_EVENT];

export function useListingFilters() {
  const [filters, setFilters] = useState(initialListingFilters);
  const allListings = useStoredState(loadAllListings, listingEvents);

  const filteredListings = useMemo(
    () => filterListings(allListings, filters),
    [allListings, filters],
  );

  const stats = useMemo(
    () => computeListingStats(filteredListings),
    [filteredListings],
  );

  const hasActiveFilters = Object.keys(initialListingFilters).some(
    (key) => filters[key] !== initialListingFilters[key],
  );

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => {
    setFilters(initialListingFilters);
  };

  return {
    allListings,
    filters,
    filteredListings,
    stats,
    hasActiveFilters,
    updateFilter,
    resetFilters,
  };
}

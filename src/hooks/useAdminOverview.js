import { useCallback } from "react";
import { fetchAdminOverview } from "../services/admin.js";
import { useApiResource } from "./useApiResource.js";

export function useAdminOverview() {
  const load = useCallback((signal) => fetchAdminOverview({ signal }), []);
  return useApiResource(load);
}

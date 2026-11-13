import { useQuery } from "@tanstack/react-query";
import { getPublicConfig, DEFAULT_PUBLIC_CONFIG } from "../services/configService.js";

export const PUBLIC_CONFIG_QUERY_KEY = ["public-config"];

/**
 * usePublicConfig — Hook to retrieve server public configuration.
 * Read once via TanStack Query and aggressively cached (staleTime: Infinity, gcTime: Infinity).
 * Degrades safely to DEFAULT_PUBLIC_CONFIG if network call fails.
 */
export function usePublicConfig() {
  const query = useQuery({
    queryKey: PUBLIC_CONFIG_QUERY_KEY,
    queryFn: getPublicConfig,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    initialData: DEFAULT_PUBLIC_CONFIG,
  });

  const config = query.data || DEFAULT_PUBLIC_CONFIG;

  return {
    ...query,
    config,
    emailVerificationRequired: config.emailVerificationRequired,
  };
}

export default usePublicConfig;

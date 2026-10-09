import { QueryClient } from "@tanstack/react-query";

/**
 * Shared query client. Data is treated as fresh for 60s so revisiting a page is
 * instant, then refreshed in the background. 4xx errors are not retried.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => {
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return count < 2;
      },
    },
  },
});

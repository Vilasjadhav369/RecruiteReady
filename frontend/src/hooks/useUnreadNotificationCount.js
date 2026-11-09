import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUnreadCount } from "../services/notificationService.js";
import { getToken } from "../services/authService.js";

export const UNREAD_COUNT_QUERY_KEY = ["notifications", "unread-count"];

/**
 * useUnreadNotificationCount — Shared TanStack Query hook for unread notification count.
 * staleTime: 30s, refetchInterval: 60s (disabled when tab is hidden), refetch on window focus.
 */
export function useUnreadNotificationCount() {
  const hasToken = Boolean(getToken());

  return useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: async () => {
      try {
        const count = await getUnreadCount();
        return typeof count === "number" ? count : 0;
      } catch {
        return 0;
      }
    },
    enabled: hasToken,
    staleTime: 30000,
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return false;
      }
      return 60000;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/**
 * Helper hook to invalidate unread notification count query across mark-read mutations.
 */
export function useInvalidateUnreadCount() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
}

export default useUnreadNotificationCount;

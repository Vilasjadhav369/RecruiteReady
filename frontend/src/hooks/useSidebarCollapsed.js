import { useCallback, useState } from "react";

/** Desktop sidebar collapsed state, persisted per portal ("student" | "admin"). */
export function useSidebarCollapsed(portal) {
  const key = `rr_sidebar_${portal}`;
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });
  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        /* storage unavailable: state lasts for this session */
      }
      return next;
    });
  }, [key]);
  return [collapsed, toggle];
}

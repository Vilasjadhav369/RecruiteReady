import { useSyncExternalStore } from "react";

/**
 * Recently viewed items — stored on THIS device only (localStorage), per user id,
 * capped at 10. It is a convenience shortcut list, not synced across devices and
 * not sent to the server. Cleared on logout.
 */
const MAX = 10;
const EVENT = "rr:recent-changed";
const keyFor = (userId) => `rr_recent_${userId || "anon"}`;

let currentUserId = null;
let cache = { key: null, raw: null, value: [] };

export const setRecentlyViewedUser = (userId) => {
  currentUserId = userId || null;
  window.dispatchEvent(new Event(EVENT));
};

function read() {
  const key = keyFor(currentUserId);
  try {
    const raw = localStorage.getItem(key);
    if (cache.key === key && cache.raw === raw) return cache.value; // stable reference for useSyncExternalStore
    const parsed = raw ? JSON.parse(raw) : [];
    const value = Array.isArray(parsed) ? parsed.filter((i) => i && i.id && i.type && i.link) : [];
    cache = { key, raw, value };
    return value;
  } catch {
    return [];
  }
}

export function recordRecentlyViewed({ type, id, title, link }) {
  if (!currentUserId || !type || !id || !title || !link) return;
  try {
    const next = [{ type, id: String(id), title: String(title).slice(0, 120), link, at: Date.now() }]
      .concat(read().filter((i) => !(i.type === type && i.id === String(id))))
      .slice(0, MAX);
    localStorage.setItem(keyFor(currentUserId), JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage full / unavailable — silently skip, this is only a convenience */
  }
}

export function clearRecentlyViewed(userId = currentUserId) {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
const EMPTY = [];
export function useRecentlyViewed() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

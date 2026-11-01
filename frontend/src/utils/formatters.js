/**
 * Formatters for RecruitReady
 * Standardizes date/time formatting across the platform.
 * Standard format: "03 Oct 2026, 6:50 PM" or "03 Oct 2026"
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDateTime = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

export const formatDate = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
};

/**
 * Replaces raw execution status text like "Status: execution unavailable"
 * or "execution_unavailable" with friendly "Not evaluated".
 */
export const formatExecutionStatus = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/Status:\s*execution[_\s]unavailable/gi, 'Status: Not evaluated')
    .replace(/execution[_\s]unavailable/gi, 'Not evaluated');
};

/**
 * Returns a user-friendly label for problem/submission statuses.
 */
export const formatStatusLabel = (status) => {
  if (!status || typeof status !== 'string') return '';
  const normalized = status.trim().toLowerCase();
  if (normalized === 'execution_unavailable' || normalized === 'execution unavailable') {
    return 'Not evaluated';
  }
  return status.replace(/_/g, ' ');
};

/**
 * Returns the keyboard modifier shortcut label: "⌘K" on macOS, "Ctrl K" on Windows/Linux.
 */
export const getModifierKeyHint = () => {
  if (typeof navigator === 'undefined') return 'Ctrl K';
  const platform = (
    navigator.userAgentData?.platform ||
    navigator.platform ||
    ''
  ).toLowerCase();
  const isMac = platform.includes('mac') || platform.includes('iphone') || platform.includes('ipad');
  return isMac ? '⌘K' : 'Ctrl K';
};

export default {
  formatDateTime,
  formatDate,
  formatExecutionStatus,
  formatStatusLabel,
  getModifierKeyHint,
};

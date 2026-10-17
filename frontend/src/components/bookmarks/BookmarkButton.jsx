import React, { useState, useEffect } from 'react';
import { BookmarkIcon, BookmarkFilledIcon } from '../ui/Icons.jsx';
import bookmarkService from '../../services/bookmarkService.js';

/**
 * BookmarkButton — Reusable toggle button for saving / removing bookmarks.
 * Works seamlessly across Coding Problems, Companies, Study Materials, and Mock Tests.
 */
export function BookmarkButton({
  itemType,
  itemId,
  initialBookmarked = null,
  onToggle = null,
  variant = 'icon-only', // 'icon-only' | 'button'
  size = 'md', // 'sm' | 'md'
  className = '',
  showLabel = false,
}) {
  const [isBookmarked, setIsBookmarked] = useState(
    initialBookmarked !== null ? initialBookmarked : false
  );
  const [loading, setLoading] = useState(false);
  const [popped, setPopped] = useState(false); // micro-interaction only after a user toggle

  useEffect(() => {
    if (initialBookmarked !== null) {
      setIsBookmarked(initialBookmarked);
      return;
    }

    if (!itemType || !itemId) return;

    let mounted = true;
    bookmarkService
      .getBookmarkStatus(itemType, itemId)
      .then((status) => {
        if (mounted) setIsBookmarked(status);
      })
      .catch((err) => {
        console.error('[BookmarkButton] Error checking bookmark status:', err);
      });

    return () => {
      mounted = false;
    };
  }, [itemType, itemId, initialBookmarked]);

  const handleToggle = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (loading || !itemType || !itemId) return;

    const previousState = isBookmarked;
    const nextState = !previousState;

    // Optimistic UI update
    setIsBookmarked(nextState);
    setLoading(true);

    try {
      const res = await bookmarkService.toggleBookmark(itemType, itemId);
      const serverState = res?.isBookmarked !== undefined ? res.isBookmarked : nextState;
      setIsBookmarked(serverState);
      if (onToggle) onToggle(serverState);
    } catch (err) {
      // Rollback on network/auth error
      console.error('[BookmarkButton] Toggle failed, rolling back:', err);
      setIsBookmarked(previousState);
    } finally {
      setLoading(false);
    }
  };

  const iconSizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  if (variant === 'button' || showLabel) {
    return (
      <button
        type="button"
        onClick={(e) => { setPopped(true); handleToggle(e); }}
        disabled={loading}
        title={isBookmarked ? 'Remove from Saved' : 'Save for later'}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
        aria-pressed={isBookmarked}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary ${
          isBookmarked
            ? 'bg-primary-tint text-primary-dark border border-primary-border hover:bg-primary-soft'
            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-2xs'
        } ${className}`}
      >
        {isBookmarked ? (
          <BookmarkFilledIcon className={`${iconSizeClass} text-primary shrink-0 ${popped ? 'rr-pop' : ''}`} />
        ) : (
          <BookmarkIcon className={`${iconSizeClass} text-slate-500 shrink-0`} />
        )}
        <span>{isBookmarked ? 'Saved' : 'Save'}</span>
      </button>
    );
  }

  // Icon-only variant
  return (
    <button
      type="button"
      onClick={(e) => { setPopped(true); handleToggle(e); }}
      disabled={loading}
      title={isBookmarked ? 'Remove from Saved' : 'Save for later'}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
      aria-pressed={isBookmarked}
      className={`min-w-[36px] min-h-[36px] p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary ${
        isBookmarked
          ? 'bg-primary-tint text-primary border border-primary-border hover:bg-primary-soft'
          : 'bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
      } ${className}`}
    >
      {isBookmarked ? (
        <BookmarkFilledIcon className={`${iconSizeClass} text-primary ${popped ? 'rr-pop' : ''}`} />
      ) : (
        <BookmarkIcon className={`${iconSizeClass}`} />
      )}
    </button>
  );
}

export default BookmarkButton;

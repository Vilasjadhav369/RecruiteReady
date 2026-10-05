import React from 'react';

/**
 * Deterministic student initials generator matching RecruitReady specification:
 * - "Anand Jadhav" -> "AJ"
 * - "Anand", "Jadhav" -> "AJ"
 * - "Anand" -> "A"
 * - "" / fallback -> "S"
 */
export function getInitials(nameOrFirst, lastName) {
  if (lastName !== undefined && lastName !== null && String(lastName).trim()) {
    const f = String(nameOrFirst || '').trim();
    const l = String(lastName || '').trim();
    if (f && l) return (f[0] + l[0]).toUpperCase();
    if (f) return f[0].toUpperCase();
    if (l) return l[0].toUpperCase();
    return 'S';
  }
  const str = String(nameOrFirst || '').trim();
  if (!str) return 'S';
  const parts = str.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

/**
 * Avatar — User or entity avatar with initials fallback and status dot indicator.
 */
export function Avatar({
  src,
  alt = '',
  name = '',
  firstName,
  lastName,
  initials: explicitInitials,
  size = 'md',
  status, // 'online' | 'offline' | 'busy'
  className = '',
}) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-12 h-12 text-base',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3 h-3',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    busy: 'bg-amber-500',
  };

  const computedInitials =
    explicitInitials ||
    getInitials(firstName || name || alt, lastName);

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'User avatar'}
          className={`${sizes[size] || sizes.md} rounded-full object-cover border border-slate-200`}
        />
      ) : (
        <div
          className={`${sizes[size] || sizes.md} rounded-full bg-slate-900 text-white font-semibold flex items-center justify-center select-none shadow-xs`}
          aria-label={alt || name || 'User avatar'}
        >
          {computedInitials}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 ${
            statusSizes[size] || statusSizes.md
          } rounded-full ring-2 ring-white ${statusColors[status] || statusColors.offline}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default Avatar;

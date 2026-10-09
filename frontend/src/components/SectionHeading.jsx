import React from 'react';

/**
 * SectionHeading — Standardized section header with brand green eyebrow and slate typography.
 */
export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = 'center',
  className = '',
}) {
  const alignClass = align === 'left' ? 'text-left' : 'text-center mx-auto';

  return (
    <div className={`max-w-2xl ${alignClass} ${className}`}>
      {eyebrow && (
        <span className="block text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          — {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        {heading}
      </h2>
      {subheading && (
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          {subheading}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;

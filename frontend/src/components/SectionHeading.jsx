/**
 * SectionHeading — Consistent section header with optional eyebrow and subtitle.
 *
 * @param {string} eyebrow - Small label above heading
 * @param {string} heading - Main section heading
 * @param {string} subheading - Supporting text below heading
 * @param {string} align - "left" | "center"
 * @param {string} className
 */
function SectionHeading({ eyebrow, heading, subheading, align = "center", className = "" }) {
  const alignClass = align === "left" ? "text-left" : "text-center mx-auto";

  return (
    <div className={`max-w-2xl ${alignClass} ${className}`}>
      {eyebrow && (
        <span className="block text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-3">
          — {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold text-[#172B4D] leading-tight mb-4">
        {heading}
      </h2>
      {subheading && (
        <span className="block text-[#52606D] text-base sm:text-lg leading-relaxed">
          {subheading}
        </span>
      )}
    </div>
  );
}

export default SectionHeading;

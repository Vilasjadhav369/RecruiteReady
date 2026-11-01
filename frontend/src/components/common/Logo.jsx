import React from "react";
import { Link } from "react-router-dom";

/**
 * RecruitReady Brand Logo — Swiss Monochrome System
 * Supports full lock-up, compact lock-up, and standalone symbol mark.
 */
export function Logo({
  variant = "compact", // "full" | "compact" | "symbol"
  size = "md", // "sm" | "md" | "lg" | number
  to = "/",
  asLink = true,
  showTagline = true,
  className = "",
}) {
  // Sizing definitions
  const sizeMap = {
    sm: { box: "w-7 h-7 rounded-md", svgSize: 15, title: "text-sm", sub: "text-[9px]" },
    md: { box: "w-8 h-8 rounded-lg", svgSize: 18, title: "text-base", sub: "text-[10px]" },
    lg: { box: "w-10 h-10 rounded-lg", svgSize: 22, title: "text-lg", sub: "text-xs" },
  };

  const isCustomSize = typeof size === "number";
  const currentSize = isCustomSize ? null : sizeMap[size] || sizeMap.md;

  const boxStyle = isCustomSize
    ? { width: `${size}px`, height: `${size}px`, borderRadius: `${Math.round(size * 0.25)}px` }
    : undefined;
  const svgSize = isCustomSize ? Math.round(size * 0.55) : currentSize.svgSize;

  const symbolMark = (
    <div
      style={boxStyle}
      className={`${
        !isCustomSize ? currentSize.box : ""
      } bg-primary flex items-center justify-center shrink-0 transition-colors`}
      aria-hidden="true"
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 3L3 7L10 11L17 7L10 3Z"
          stroke="var(--rr-on-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 8.5V13.5C5.5 13.5 7 15.5 10 15.5C13 15.5 14.5 13.5 14.5 13.5V8.5"
          stroke="var(--rr-on-primary)"
          strokeOpacity=".55"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 7V12"
          stroke="var(--rr-on-primary)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );

  if (variant === "symbol") {
    if (asLink && to) {
      return (
        <Link
          to={to}
          className={`inline-flex items-center no-underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-md ${className}`}
          aria-label="RecruitReady Home"
        >
          {symbolMark}
        </Link>
      );
    }
    return <div className={`inline-flex items-center ${className}`}>{symbolMark}</div>;
  }

  const content = (
    <div className={`flex items-center gap-2.5 no-underline hover:no-underline group ${className}`}>
      {symbolMark}
      <div className="min-w-0">
        <span
          className={`text-ink font-bold font-heading tracking-tight leading-none block ${
            currentSize?.title || "text-base"
          }`}
        >
          RecruitReady
        </span>
        {showTagline && (
          <span
            className={`text-ink-2 leading-none mt-1 block truncate ${
              currentSize?.sub || "text-[10px]"
            }`}
          >
            {variant === "full" ? "Placement Preparation Portal" : "Placement Prep"}
          </span>
        )}
      </div>
    </div>
  );

  if (asLink && to) {
    return (
      <Link
        to={to}
        className="no-underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-md inline-block"
      >
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * Standalone glyph export for loaders and badges.
 */
export function LogoSymbol({ size = 32, className = "" }) {
  return <Logo variant="symbol" size={size} asLink={false} className={className} />;
}

export default Logo;

/**
 * Button — Reusable button component.
 * Supports: primary, secondary, ghost, and outline variants.
 *
 * @param {string} variant - "primary" | "secondary" | "ghost" | "outline"
 * @param {string} size - "sm" | "md" | "lg"
 * @param {boolean} fullWidth
 * @param {React.ReactNode} children
 */
function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#2563EB] text-white hover:bg-[#1d4ed8] active:bg-[#1e40af]",
    secondary:
      "bg-[#102A43] text-white hover:bg-[#1a3a5c] active:bg-[#0d2035]",
    ghost:
      "text-[#172B4D] hover:bg-[#F8FAFC] active:bg-[#E8F1FF]",
    outline:
      "border border-[#D9E2EC] text-[#172B4D] bg-white hover:border-[#9FB3C8] hover:bg-[#F8FAFC]",
    "outline-white":
      "border border-white/30 text-white bg-transparent hover:bg-white/10",
  };

  const sizes = {
    sm: "text-sm px-4 py-2",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-7 py-3.5",
  };

  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;

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
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-dark active:bg-primary-darker shadow-xs",
    secondary:
      "bg-primary-dark text-white hover:bg-primary-darker active:bg-[#0a2715]",
    ghost:
      "text-slate-800 hover:bg-slate-100 active:bg-primary-tint",
    outline:
      "border border-slate-200 text-slate-800 bg-white hover:border-slate-300 hover:bg-slate-50",
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

/**
 * authRedirect — Central routing utility for post-login and role-based redirects.
 *
 * Rules:
 * - Admin: redirects to returnTo only if returnTo is an /admin path; otherwise /admin.
 * - Student: redirects to /consent if consent not accepted, /onboarding if not completed;
 *            otherwise safe returnTo (cannot target /admin, /login, /register, or protocol-relative URLs), or /dashboard.
 */
export function resolvePostLoginRedirect(user, returnTo, fromState) {
  const candidate = returnTo || fromState;

  if (user?.role === "admin") {
    if (candidate && typeof candidate === "string" && candidate.startsWith("/admin")) {
      return candidate;
    }
    return "/admin";
  }

  // Student flow: consent must be accepted first
  if (user && user.role === "student" && !user.consentAcceptedAt) {
    return "/consent";
  }

  // Next, student onboarding check
  if (user && !user.onboardingCompleted) {
    return "/onboarding";
  }

  // Safe candidate check for students
  if (
    candidate &&
    typeof candidate === "string" &&
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.startsWith("/admin") &&
    candidate !== "/login" &&
    candidate !== "/register" &&
    candidate !== "/consent" &&
    candidate !== "/onboarding"
  ) {
    return candidate;
  }

  return "/dashboard";
}

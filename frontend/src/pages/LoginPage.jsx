import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { EyeIcon, EyeOffIcon, CheckIcon } from "../components/ui/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import GoogleSignInButton from "../components/auth/GoogleSignInButton.jsx";
import GitHubSignInButton from "../components/auth/GitHubSignInButton.jsx";

const JOURNEY_STEPS = [
  { name: "Aptitude", detail: "Quantitative & logical foundation" },
  { name: "Coding", detail: "Core data structures & algorithms" },
  { name: "Mock Tests", detail: "Timed assessment practice" },
  { name: "Interviews", detail: "Company-specific tracks" },
  { name: "Placement", detail: "Verified campus offers" },
];

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after successful login
  const from = location.state?.from?.pathname || "/dashboard";

  // Check URL query parameters for OAuth error messages (e.g. from GitHub callback)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get("error");
    if (err) {
      setErrorMessage(err);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Client-side validation
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login({ email: email.trim(), password });
      const user = res?.data?.user;
      if (user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (!user?.onboardingCompleted) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Invalid email or password. Please verify and try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = (res) => {
    const user = res?.data?.user;
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
    } else if (!user?.onboardingCompleted) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

        {/* ── LEFT COLUMN: Context & Journey ────────────── */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary-tint px-2.5 py-0.5 rounded-full border border-primary-border">
              Account Access
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Welcome Back.
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-primary tracking-tight">
              Continue Your Placement Journey.
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed max-w-md">
            Sign in to access your authentic performance records, resume ongoing aptitude and coding modules, and attempt scheduled mock assessments.
          </p>

          {/* Value Highlights */}
          <div className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary-tint text-primary flex items-center justify-center shrink-0">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <span>Practice with structured, difficulty-graded modules</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary-tint text-primary flex items-center justify-center shrink-0">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <span>Track real test progress and accurate solution metrics</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary-tint text-primary flex items-center justify-center shrink-0">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <span>Prepare for real campus recruiters and coding rounds</span>
            </div>
          </div>

          {/* Abstract Placement Journey Stepper */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
              Systematic Milestones
            </span>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {JOURNEY_STEPS.map((step, idx) => (
                <div
                  key={step.name}
                  className={`p-2 rounded-lg border text-[11px] font-medium ${
                    idx === 4
                      ? "bg-primary-soft border-primary-border text-primary font-semibold"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="block truncate">{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Sign In Form ────────────────── */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <Card className="p-6 sm:p-8 shadow-xs border-slate-200">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Sign In to RecruitReady
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered credentials to access your portal.
              </p>
            </div>

            {errorMessage && (
              <div
                className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700"
                role="alert"
              >
                <span className="font-semibold block">{errorMessage}</span>
              </div>
            )}

            {/* Social Authentication */}
            <div className="space-y-3 mb-5">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={(msg) => setErrorMessage(msg)}
                disabled={isSubmitting}
              />
              <GitHubSignInButton
                disabled={isSubmitting}
                onError={(msg) => setErrorMessage(msg)}
              />
            </div>

            {/* Visual Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative bg-white px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">
                or continue with email
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 pl-3.5 pr-10 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-4 h-4 text-slate-500" />
                    ) : (
                      <EyeIcon className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={isSubmitting}
                >
                  Sign In
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-600">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-primary hover:text-primary-dark hover:underline no-underline"
                >
                  Create Account
                </Link>
              </span>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;

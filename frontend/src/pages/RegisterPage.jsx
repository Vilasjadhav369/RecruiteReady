import Logo from "../components/common/Logo.jsx";
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { EyeIcon, EyeOffIcon, CheckIcon } from "../components/ui/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import GoogleSignInButton from "../components/auth/GoogleSignInButton.jsx";
import GitHubSignInButton from "../components/auth/GitHubSignInButton.jsx";
import { usePublicConfig } from "../hooks/usePublicConfig.js";
import { emitGlobalToast } from "../services/api.js";

function RegisterPage() {
  const { inviteCodeRequired } = usePublicConfig();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    branch: "",
    graduationYear: "",
    inviteCode: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailFailedNotice, setEmailFailedNotice] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get("error");
    if (err) {
      setErrorMessage(err);
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      college,
      branch,
      graduationYear,
    } = formData;

    // Client-side validations
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please enter both your first and last name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    if (inviteCodeRequired && !formData.inviteCode.trim()) {
      setErrorMessage("Please enter an invite code.");
      return;
    }

    if (!consent) {
      setErrorMessage("You must accept the Terms of Service and Privacy Policy to register for this test version.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        college: college.trim(),
        branch: branch.trim(),
        graduationYear: graduationYear ? Number(graduationYear) : undefined,
        inviteCode: formData.inviteCode.trim() || undefined,
        consent: true,
      });

      const emailSent = res?.emailSent !== false && res?.data?.emailSent !== false;
      if (!emailSent) {
        setEmailFailedNotice(true);
        emitGlobalToast({
          message: "Account created, but we could not send the email. Use Resend.",
          variant: "warning",
        });
        return;
      }

      const user = res?.data?.user;
      if (user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Registration could not be completed. Please try again.";
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
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

        {/* ── LEFT COLUMN: Context & Highlights ─────────── */}
        <div className="lg:col-span-5 space-y-6 text-left pt-2 lg:sticky lg:top-24">
          <Logo variant="full" size="lg" to="/" className="mb-2" /><div className="inline-flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary-tint px-2.5 py-0.5 rounded-full border border-primary-border">
              New Student Registration
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Start Your Placement Journey.
            </h1>
            <p className="text-lg font-semibold text-primary">
              Structured, Centralized Preparation.
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Create your account to unlock curated problem sets, company recruitment archives, and timed mock tests customized for college placements.
          </p>

          <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary-tint text-primary flex items-center justify-center shrink-0 mt-0.5">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold block text-slate-900">Comprehensive Modules</span>
                <span className="text-slate-500 text-xs">Quantitative, logical, DSA, and technical tracks.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary-tint text-primary flex items-center justify-center shrink-0 mt-0.5">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold block text-slate-900">Simulated Testing</span>
                <span className="text-slate-500 text-xs">Accurate timers, sectional cuts, and detailed reviews.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary-tint text-primary flex items-center justify-center shrink-0 mt-0.5">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold block text-slate-900">Honest Progress Records</span>
                <span className="text-slate-500 text-xs">Real metric tracking backed directly by your submissions.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Registration Form ───────────── */}
        <div className="lg:col-span-7 w-full">
          <Card className="p-6 sm:p-8 shadow-xs border-slate-200">
            {emailFailedNotice ? (
              <div className="space-y-6 text-center py-4" role="status">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✉
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Account Created
                  </h2>
                  <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-lg text-xs sm:text-sm text-amber-900 font-medium leading-relaxed text-left">
                    Account created, but we could not send the email. Use Resend.
                  </div>
                </div>
                <div className="pt-2 flex flex-col gap-2.5">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full font-semibold"
                    onClick={() => navigate("/verify-email", { replace: true, state: { emailFailed: true } })}
                  >
                    Go to Verification / Resend Email
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full"
                    onClick={() => navigate("/onboarding", { replace: true })}
                  >
                    Continue to Onboarding
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Create Your Account
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill in your academic details to get started with RecruitReady.
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

            {/* Social Quick Sign-Up */}
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
                or register with email
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="e.g. Anand"
                    className="w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Sharma"
                    className="w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  className="w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Password (min 8 chars) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
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
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 pl-3.5 pr-10 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="w-4 h-4 text-slate-500" />
                      ) : (
                        <EyeIcon className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Academic Information (Optional) */}
              <div className="pt-2">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-t border-slate-100 pt-3">
                  Academic Information (Optional)
                </span>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="college"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      College / University
                    </label>
                    <input
                      id="college"
                      name="college"
                      type="text"
                      value={formData.college}
                      onChange={handleChange}
                      placeholder="e.g. Pune Institute of Computer Technology"
                      className="w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="branch"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Branch / Stream
                      </label>
                      <input
                        id="branch"
                        name="branch"
                        type="text"
                        value={formData.branch}
                        onChange={handleChange}
                        placeholder="e.g. Computer Science"
                        className="w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="graduationYear"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Graduation Year
                      </label>
                      <input
                        id="graduationYear"
                        name="graduationYear"
                        type="number"
                        min="2020"
                        max="2035"
                        value={formData.graduationYear}
                        onChange={handleChange}
                        placeholder="e.g. 2026"
                        className="w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {inviteCodeRequired && (
                <div className="pt-1">
                  <label
                    htmlFor="inviteCode"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Invite Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    required={inviteCodeRequired}
                    value={formData.inviteCode}
                    onChange={handleChange}
                    placeholder="Enter registration invite code"
                    className="w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  />
                </div>
              )}

              <div className="flex items-start gap-2.5 pt-1 text-left mb-2">
                <input
                  id="register-consent"
                  name="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                  required
                />
                <label htmlFor="register-consent" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                  I agree to the <Link to="/terms" target="_blank" className="text-primary underline hover:text-primary-dark">Terms of Service</Link> and <Link to="/privacy" target="_blank" className="text-primary underline hover:text-primary-dark">Privacy Policy</Link> (Test Version).
                </label>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={isSubmitting}
                >
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-primary hover:text-primary-dark hover:underline no-underline"
                >
                  Sign In
                </Link>
              </span>
            </div>
            </>
          )}
          </Card>
        </div>

      </div>
    </div>
  );
}

export default RegisterPage;

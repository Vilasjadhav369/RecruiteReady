import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService.js";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { usePublicConfig } from "../../hooks/usePublicConfig.js";

export function ForgotPasswordPage() {
  const { emailVerificationRequired } = usePublicConfig();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      // Generic error handling to avoid revealing system internals
      setErrorMessage(
        err.response?.data?.message ||
          "Unable to process password reset request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <Card className="p-6 sm:p-8 shadow-xs border-slate-200">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Forgot Your Password?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Enter your registered email address and we'll send you a secure link to reset your password.
            </p>
          </div>

          {!emailVerificationRequired ? (
            <div className="space-y-6 text-center" role="status">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                ℹ
              </div>

              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-xs sm:text-sm text-amber-900 leading-relaxed font-medium text-left">
                Password reset by email is off in this test version. Ask the organiser to reset it.
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>←</span>
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : submitted ? (
            <div className="space-y-6 text-center" role="status">
              <div className="w-12 h-12 bg-blue-50 text-primary border border-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Check Your Inbox
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  If an account exists for <span className="font-medium text-slate-900">{email}</span>, a password reset link has been dispatched.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-left">
                <strong>Notice:</strong> The link will expire in 20 minutes for security reasons. Please check your spam folder if you do not receive it shortly.
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                >
                  Send to a different email
                </Button>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-primary hover:text-primary-hover text-center transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

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
                  className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full h-10 font-semibold"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending Reset Link...</span>
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="pt-3 text-center border-t border-slate-100">
                <Link
                  to="/login"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>←</span>
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

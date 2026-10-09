import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/authService.js";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { EyeIcon, EyeOffIcon, CheckIcon } from "../../components/ui/Icons.jsx";

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Password reset token is missing. Please request a new link.");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ token: token.trim(), password });
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          "Password reset link is invalid or has expired. Please request a new one."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <Card className="p-6 sm:p-8 shadow-xs border-slate-200">
          {!token ? (
            <div className="text-center space-y-4 py-4" role="alert">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                !
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900">
                  Invalid Reset Link
                </h1>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  This password reset link is missing a verification token or has expired.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/forgot-password">
                  <Button variant="primary" size="md" className="w-full">
                    Request New Reset Link
                  </Button>
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-6 py-4" role="status">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                <CheckIcon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Password Updated
                </h1>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Your password has been reset successfully. You can now sign in using your new credentials.
                </p>
              </div>
              <div>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full h-10 font-semibold"
                  onClick={() => navigate("/login", { replace: true })}
                >
                  Sign In to RecruitReady
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Reset Your Password
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-2">
                  Create a new password of at least 8 characters.
                </p>
              </div>

              {errorMessage && (
                <div
                  className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full h-10 pl-3.5 pr-10 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full h-10 pl-3.5 pr-10 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
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
                      <span>Updating Password...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                <div className="pt-3 text-center border-t border-slate-100">
                  <Link
                    to="/login"
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel and Return to Sign In
                  </Link>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ResetPasswordPage;

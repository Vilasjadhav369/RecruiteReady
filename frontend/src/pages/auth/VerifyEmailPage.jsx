import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyEmail, resendVerification } from "../../services/authService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { CheckIcon } from "../../components/ui/Icons.jsx";

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshUser } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  const [status, setStatus] = useState(token ? "verifying" : "idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendEmail, setResendEmail] = useState(user?.email || "");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!token || verifiedRef.current) return;
    verifiedRef.current = true;

    const performVerification = async () => {
      try {
        await verifyEmail(token.trim());
        setStatus("success");
        if (isAuthenticated && refreshUser) {
          refreshUser();
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err.response?.data?.message ||
            "Verification link is invalid or has expired. Please request a new one."
        );
      }
    };

    performVerification();
  }, [token, isAuthenticated, refreshUser]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResending(true);
    try {
      await resendVerification(resendEmail.trim());
      setResendSuccess(true);
    } catch {
      // Generic message to prevent enumeration
      setResendSuccess(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <Card className="p-6 sm:p-8 shadow-xs border-slate-200">
          {status === "verifying" && (
            <div className="text-center py-8 space-y-4" role="status">
              <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h1 className="text-lg font-bold text-slate-900">
                  Verifying Your Email
                </h1>
                <p className="text-xs text-slate-500">
                  Checking authentication credentials...
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-6 space-y-6" role="status">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                <CheckIcon className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Email Verified!
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Your email address has been confirmed. Your RecruitReady portal account is completely verified.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full h-10 font-semibold"
                  onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login", { replace: true })}
                >
                  {isAuthenticated ? "Continue to Dashboard" : "Sign In to Your Account"}
                </Button>
              </div>
            </div>
          )}

          {(status === "error" || status === "idle") && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl font-bold ${
                  status === "error"
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-blue-50 text-primary border border-blue-100"
                }`}>
                  {status === "error" ? "!" : "✉"}
                </div>

                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {status === "error" ? "Verification Link Expired" : "Verify Your Email"}
                </h1>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {status === "error"
                    ? errorMessage
                    : "Please check your inbox for the confirmation link sent after registration, or request a new one below."}
                </p>
              </div>

              {resendSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 text-center space-y-1">
                  <div className="font-semibold">Verification link sent!</div>
                  <div className="text-slate-600">
                    If an unverified account exists for this email, a new confirmation link was dispatched.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResend} className="space-y-3 pt-2">
                  <div>
                    <label
                      htmlFor="resendEmail"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      id="resendEmail"
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={resending}
                    className="w-full h-10 font-semibold"
                  >
                    {resending ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Link...</span>
                      </div>
                    ) : (
                      "Resend Verification Email"
                    )}
                  </Button>
                </form>
              )}

              <div className="pt-3 text-center border-t border-slate-100 flex justify-center gap-4 text-xs font-medium text-slate-600">
                <Link to="/login" className="hover:text-primary transition-colors">
                  Return to Sign In
                </Link>
                {isAuthenticated && (
                  <>
                    <span>•</span>
                    <Link to="/dashboard" className="hover:text-primary transition-colors">
                      Back to Dashboard
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default VerifyEmailPage;

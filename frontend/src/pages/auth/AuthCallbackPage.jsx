import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * AuthCallbackPage — Handles client-side receipt of OAuth redirect sessions (e.g. GitHub).
 * Extracts JWT token, establishes authenticated context state, and safely redirects based on role.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!token) {
      navigate("/login?error=" + encodeURIComponent("Authentication failed: No session token received."), {
        replace: true,
      });
      return;
    }

    const processAuth = async () => {
      try {
        const user = await loginWithToken(token);
        if (user?.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (!user?.consentAcceptedAt) {
          navigate("/consent", { replace: true });
        } else if (!user?.onboardingCompleted) {
          navigate("/onboarding", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          "Failed to establish session from GitHub. Please try again.";
        setErrorMsg(msg);
        navigate(`/login?error=${encodeURIComponent(msg)}`, { replace: true });
      }
    };

    processAuth();
  }, [location.search, loginWithToken, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs space-y-4">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Connecting Your Account
          </h2>
          <p className="text-xs text-slate-500">
            {errorMsg ? errorMsg : "Finalizing authentication with RecruitReady..."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthCallbackPage;

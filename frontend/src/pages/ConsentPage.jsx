import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { recordUserConsent } from "../services/authService.js";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import Logo from "../components/common/Logo.jsx";

export default function ConsentPage() {
  const { user, updateUser, logout } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleAccept = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setErrorMsg("Please check the box to agree to the Terms and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await recordUserConsent();
      const updatedUser = res?.data?.user;
      if (updatedUser) {
        updateUser(updatedUser);
      } else {
        updateUser({ consentAcceptedAt: new Date(), consentVersion: "1.0-test" });
      }

      if (user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (!user?.onboardingCompleted) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to record consent. Please try again.";
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full">
        <div className="text-center mb-6">
          <Logo variant="full" size="md" to="/" className="inline-block mb-3" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            Test Version Agreement
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
            One-Time Evaluation Consent
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Please confirm terms before accessing your placement dashboard.
          </p>
        </div>

        <Card className="p-6 sm:p-8 space-y-6 bg-white border-slate-200 shadow-xs">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="font-semibold text-slate-800">
              Welcome, {user?.firstName || "Candidate"}!
            </p>
            <p>
              RecruitReady is currently in private test deployment for candidate evaluation. By proceeding:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-xs">
              <li>You agree to use practice assessments and resources solely for personal evaluation.</li>
              <li>You acknowledge test records and questions may be adjusted during the evaluation.</li>
              <li>You understand data is hosted on testing infrastructure with no hiring guarantees.</li>
              <li>You may request account removal at any time by contacting <span className="font-mono font-medium text-slate-900">[CONTACT_EMAIL]</span>.</li>
            </ul>
          </div>

          <form onSubmit={handleAccept} className="space-y-5">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-700">
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
              />
              <span>
                I have read and agree to the{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-900 underline hover:text-primary"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-900 underline hover:text-primary"
                >
                  Privacy Policy
                </Link>{" "}
                (Test Version).
              </span>
            </label>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={isSubmitting}
                disabled={!agreed}
              >
                Accept & Continue
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                fullWidth
                onClick={handleDecline}
                disabled={isSubmitting}
              >
                Decline & Sign Out
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

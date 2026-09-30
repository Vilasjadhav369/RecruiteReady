import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after successful login
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Client validation
    if (!email.trim() || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login({ email: email.trim(), password });
      const userRole = res?.data?.user?.role;
      if (userRole === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Invalid email or password. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-[#102A43] rounded-xl mx-auto flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 14L9 4L15 14" stroke="#E8F1FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.5 10.5H12.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight">Sign In to RecruitReady</h1>
          <p className="text-xs text-[#52606D] mt-1">
            Access your placement preparation account and resources
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-7 sm:p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-red-700 font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1.5" htmlFor="email">
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
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] placeholder-[#9FB3C8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#172B4D]" htmlFor="password">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] placeholder-[#9FB3C8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:opacity-60 px-5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 pt-5 border-t border-[#D9E2EC] text-center">
            <span className="text-xs text-[#52606D]">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#2563EB] hover:text-[#1d4ed8] no-underline"
              >
                Register
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

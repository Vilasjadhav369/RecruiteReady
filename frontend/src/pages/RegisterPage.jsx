import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { EyeIcon, EyeOffIcon } from "../components/ui/Icons.jsx";

function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    branch: "",
    graduationYear: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

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

    if (!email.trim()) {
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

    setIsSubmitting(true);

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        college: college.trim(),
        branch: branch.trim(),
        graduationYear: graduationYear ? Number(graduationYear) : undefined,
      });

      // Redirect to authenticated student dashboard area
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Registration could not be completed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-[#102A43] rounded-xl mx-auto flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 14L9 4L15 14" stroke="#E8F1FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.5 10.5H12.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight">Create Your Account</h1>
          <p className="text-xs text-[#52606D] mt-1">
            Join RecruitReady to start your structured placement preparation
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
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1.5" htmlFor="firstName">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Anand"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] placeholder-[#9FB3C8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1.5" htmlFor="lastName">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] placeholder-[#9FB3C8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1.5" htmlFor="email">
                Email Address *
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
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] placeholder-[#9FB3C8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1.5" htmlFor="password">
                  Password (min 8 chars) *
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
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] placeholder-[#9FB3C8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
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
                <label className="block text-xs font-semibold text-[#172B4D] mb-1.5" htmlFor="confirmPassword">
                  Confirm Password *
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
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] placeholder-[#9FB3C8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
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

            {/* Academic Information */}
            <div className="pt-2">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#9FB3C8] mb-3">
                Academic Details (Optional)
              </span>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#52606D] mb-1" htmlFor="college">
                    College / University
                  </label>
                  <input
                    id="college"
                    name="college"
                    type="text"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder="e.g. Pune Institute of Computer Technology"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] placeholder-[#9FB3C8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#52606D] mb-1" htmlFor="branch">
                      Branch / Stream
                    </label>
                    <input
                      id="branch"
                      name="branch"
                      type="text"
                      value={formData.branch}
                      onChange={handleChange}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] placeholder-[#9FB3C8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#52606D] mb-1" htmlFor="graduationYear">
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
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] placeholder-[#9FB3C8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:opacity-60 px-5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 pt-5 border-t border-[#D9E2EC] text-center">
            <span className="text-xs text-[#52606D]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#2563EB] hover:text-[#1d4ed8] no-underline"
              >
                Sign In
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

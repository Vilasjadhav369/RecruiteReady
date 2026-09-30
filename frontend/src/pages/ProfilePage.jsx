import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { updateProfile } from "../services/authService.js";
import { ArrowRightIcon } from "../components/dashboard/DashboardIcons.jsx";
import { Link } from "react-router-dom";

/**
 * ProfilePage — Authenticated student profile management.
 * Allows editing academic details, target companies, and preparation goals.
 */
function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    college: "",
    branch: "",
    graduationYear: "",
  });

  const [targetCompanies, setTargetCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState("");

  const [preparationGoals, setPreparationGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Sync form with authenticated user state
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        college: user.college || "",
        branch: user.branch || "",
        graduationYear: user.graduationYear ? String(user.graduationYear) : "",
      });
      setTargetCompanies(user.targetCompanies || []);
      setPreparationGoals(user.preparationGoals || []);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCompany = (e) => {
    e.preventDefault();
    const trimmed = newCompany.trim();
    if (trimmed && !targetCompanies.includes(trimmed)) {
      setTargetCompanies([...targetCompanies, trimmed]);
      setNewCompany("");
    }
  };

  const handleRemoveCompany = (companyToRemove) => {
    setTargetCompanies(targetCompanies.filter((c) => c !== companyToRemove));
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    const trimmed = newGoal.trim();
    if (trimmed && !preparationGoals.includes(trimmed)) {
      setPreparationGoals([...preparationGoals, trimmed]);
      setNewGoal("");
    }
  };

  const handleRemoveGoal = (goalToRemove) => {
    setPreparationGoals(preparationGoals.filter((g) => g !== goalToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage("First name and last name cannot be empty.");
      return;
    }

    if (formData.graduationYear) {
      const gradNum = Number(formData.graduationYear);
      if (isNaN(gradNum) || gradNum < 2000 || gradNum > 2100) {
        setErrorMessage("Please enter a valid graduation year between 2000 and 2100.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        college: formData.college.trim(),
        branch: formData.branch.trim(),
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : null,
        targetCompanies,
        preparationGoals,
      };

      const updatedUserData = await updateProfile(payload);
      updateUser(updatedUserData);
      setSuccessMessage("Profile updated successfully. Changes are now active across your dashboard.");

      // Clear success banner after 4 seconds
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#52606D] mb-1">
            <Link to="/dashboard" className="text-[#2563EB] hover:underline no-underline">
              Dashboard
            </Link>
            <span>/</span>
            <span>Profile Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D] tracking-tight">
            Student Profile
          </h1>
          <p className="text-xs text-[#52606D] mt-1">
            Manage your personal information, academic background, and target companies
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#52606D] hover:text-[#172B4D] border border-[#D9E2EC] bg-white px-3.5 py-2 rounded-lg transition-colors no-underline w-fit"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-medium flex items-center gap-2.5">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2.5">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Basic Information */}
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-base font-bold text-[#172B4D] mb-4 pb-2 border-b border-[#D9E2EC]">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
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
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1.5" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC]/70 border border-[#D9E2EC] rounded-lg text-sm text-[#52606D] cursor-not-allowed"
              />
              <span className="text-[11px] text-[#9FB3C8] mt-1 block">
                Email cannot be modified directly. Contact support for email changes.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1.5">
                Account Role
              </label>
              <div className="flex items-center gap-2 h-[42px]">
                <span className="px-3 py-1.5 rounded-lg bg-[#E8F1FF] text-[#2563EB] font-semibold text-xs capitalize border border-[#2563EB]/20">
                  {user?.role || "Student"}
                </span>
                <span className="text-[11px] text-[#9FB3C8]">
                  Server-verified authenticated status
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Academic Details */}
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-base font-bold text-[#172B4D] mb-4 pb-2 border-b border-[#D9E2EC]">
            Academic Background
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1.5" htmlFor="college">
                College / University
              </label>
              <input
                id="college"
                name="college"
                type="text"
                value={formData.college}
                onChange={handleChange}
                placeholder="e.g. Pune Institute of Computer Technology"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1.5" htmlFor="branch">
                  Branch / Department
                </label>
                <input
                  id="branch"
                  name="branch"
                  type="text"
                  value={formData.branch}
                  onChange={handleChange}
                  placeholder="e.g. Computer Engineering"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1.5" htmlFor="graduationYear">
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
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-sm text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Target Companies */}
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-base font-bold text-[#172B4D] mb-1">
            Target Companies
          </h2>
          <p className="text-xs text-[#52606D] mb-4">
            Select the organizations whose placement patterns and interview processes you are targeting.
          </p>

          {/* Active tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {targetCompanies.map((company) => (
              <span
                key={company}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8F1FF] text-[#2563EB] text-xs font-semibold"
              >
                <span>{company}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCompany(company)}
                  className="hover:text-red-600 transition-colors cursor-pointer text-sm leading-none"
                  aria-label={`Remove ${company}`}
                >
                  ×
                </button>
              </span>
            ))}
            {targetCompanies.length === 0 && (
              <span className="text-xs text-[#9FB3C8] italic">No target companies added yet.</span>
            )}
          </div>

          {/* Add tag form */}
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="e.g. Google, Microsoft, TCS"
              className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-xs text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#2563EB]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCompany(e);
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCompany}
              className="px-4 py-2 bg-[#F8FAFC] border border-[#D9E2EC] hover:bg-[#E8F1FF] hover:border-[#2563EB]/40 text-[#2563EB] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Card 4: Preparation Goals */}
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-base font-bold text-[#172B4D] mb-1">
            Preparation Goals
          </h2>
          <p className="text-xs text-[#52606D] mb-4">
            Set custom milestones for topics, problem counts, or target mock test scores.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {preparationGoals.map((goal) => (
              <span
                key={goal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#D9E2EC] text-[#172B4D] text-xs font-medium"
              >
                <span>{goal}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGoal(goal)}
                  className="text-[#9FB3C8] hover:text-red-600 transition-colors cursor-pointer text-sm leading-none"
                  aria-label={`Remove goal ${goal}`}
                >
                  ×
                </button>
              </span>
            ))}
            {preparationGoals.length === 0 && (
              <span className="text-xs text-[#9FB3C8] italic">No preparation goals defined yet.</span>
            )}
          </div>

          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="e.g. Master Binary Search, Solve 50 DP questions"
              className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-xs text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#2563EB]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddGoal(e);
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddGoal}
              className="px-4 py-2 bg-[#F8FAFC] border border-[#D9E2EC] hover:bg-[#E8F1FF] hover:border-[#2563EB]/40 text-[#2563EB] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-lg border border-[#D9E2EC] text-xs font-semibold text-[#52606D] hover:text-[#172B4D] bg-white transition-colors no-underline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:opacity-60 px-6 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;

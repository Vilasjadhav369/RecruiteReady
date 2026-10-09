import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { submitOnboarding } from "../services/authService.js";
import { getCompanies } from "../services/companyService.js";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import {
  CheckIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from "../components/ui/Icons.jsx";

const PREPARATION_LEVELS = [
  {
    id: "Just Starting",
    title: "Just Starting",
    badge: "Level 1",
    description: "Starting placement prep from scratch. Need foundational concepts in aptitude and coding.",
  },
  {
    id: "Beginner",
    title: "Beginner",
    badge: "Level 2",
    description: "Familiar with basic syntax and math. Need structured topic-by-topic guided practice.",
  },
  {
    id: "Intermediate",
    title: "Intermediate",
    badge: "Level 3",
    description: "Comfortable with standard DSA and aptitude. Working on speed, edge cases, and problem solving.",
  },
  {
    id: "Advanced",
    title: "Advanced",
    badge: "Level 4",
    description: "High accuracy in aptitude & DSA. Targeting product companies, competitive coding, and system design.",
  },
  {
    id: "Placement Ready",
    title: "Placement Ready",
    badge: "Level 5",
    description: "Campus recruitment ready. Looking for full-length timed mock tests and company archives.",
  },
];

const BRANCH_OPTIONS = [
  "Computer Science & Engineering (CSE)",
  "Information Technology (IT)",
  "Electronics & Communication (ECE)",
  "Electronics & Telecommunication (ENTC)",
  "Electrical Engineering (EE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Other",
];

const GRADUATION_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

const PREPARATION_GOAL_OPTIONS = [
  { id: "Aptitude", label: "Quantitative & Logical Aptitude", icon: "📐" },
  { id: "Coding", label: "Data Structures & Algorithms (DSA)", icon: "💻" },
  { id: "Core CS", label: "Core CS Fundamentals (OS, DBMS, CN)", icon: "⚙️" },
  { id: "Interview Preparation", label: "Technical & System Design Interviews", icon: "🎙️" },
  { id: "Company Preparation", label: "Company-Specific Recruitment Tracks", icon: "🏢" },
  { id: "Mock Tests", label: "Timed Assessments & Exam Simulation", icon: "⏱️" },
  { id: "Communication", label: "HR, Soft Skills & Group Discussions", icon: "🗣️" },
];

export function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states initialized with existing user metadata (e.g. from Google/GitHub or registration)
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");

  const [college, setCollege] = useState(user?.college || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [customBranch, setCustomBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState(user?.graduationYear || 2026);

  const [preparationLevel, setPreparationLevel] = useState(user?.preparationLevel || "Beginner");

  // Companies state
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [targetCompanies, setTargetCompanies] = useState(user?.targetCompanies || []);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Goals state
  const [preparationGoals, setPreparationGoals] = useState(user?.preparationGoals || []);

  // Sync state if user changes in context
  useEffect(() => {
    if (user) {
      if (!firstName && user.firstName) setFirstName(user.firstName);
      if (!lastName && user.lastName) setLastName(user.lastName);
      if (!profilePhoto && user.profilePhoto) setProfilePhoto(user.profilePhoto);
      if (!college && user.college) setCollege(user.college);
      if (!branch && user.branch) {
        if (BRANCH_OPTIONS.includes(user.branch)) {
          setBranch(user.branch);
        } else {
          setBranch("Other");
          setCustomBranch(user.branch);
        }
      }
      if (!graduationYear && user.graduationYear) setGraduationYear(user.graduationYear);
      if (!preparationLevel && user.preparationLevel) setPreparationLevel(user.preparationLevel);
      if (targetCompanies.length === 0 && user.targetCompanies?.length) setTargetCompanies(user.targetCompanies);
      if (preparationGoals.length === 0 && user.preparationGoals?.length) setPreparationGoals(user.preparationGoals);
    }
  }, [user]);

  // Load real companies from database
  useEffect(() => {
    let isMounted = true;
    async function loadCompanies() {
      try {
        setLoadingCompanies(true);
        const data = await getCompanies({ limit: 100 });
        if (isMounted) {
          setAvailableCompanies(data?.companies || []);
        }
      } catch (err) {
        console.warn("Failed to load companies for onboarding:", err);
      } finally {
        if (isMounted) setLoadingCompanies(false);
      }
    }
    loadCompanies();
    return () => {
      isMounted = false;
    };
  }, []);

  // If already completed or admin, redirect immediately
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  if (user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleNext = () => {
    setErrorMsg("");
    // Validations per step
    if (currentStep === 1) {
      if (!firstName.trim()) {
        setErrorMsg("Please provide your first name.");
        return;
      }
      if (!lastName.trim()) {
        setErrorMsg("Please provide your last name.");
        return;
      }
    } else if (currentStep === 2) {
      if (!college.trim()) {
        setErrorMsg("Please specify your college or university.");
        return;
      }
      if (!branch) {
        setErrorMsg("Please select your branch of study.");
        return;
      }
      if (branch === "Other" && !customBranch.trim()) {
        setErrorMsg("Please specify your department / branch name.");
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinalSubmit(false);
    }
  };

  const handleBack = () => {
    setErrorMsg("");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    await handleFinalSubmit(true);
  };

  const handleFinalSubmit = async (isSkipped = false) => {
    setIsSubmitting(true);
    setErrorMsg("");

    const resolvedBranch = branch === "Other" ? customBranch.trim() : branch;

    const payload = {
      firstName: firstName.trim() || user?.firstName || "Student",
      lastName: lastName.trim() || user?.lastName || "Member",
      profilePhoto: profilePhoto.trim(),
      college: college.trim(),
      branch: resolvedBranch,
      graduationYear: graduationYear ? Number(graduationYear) : undefined,
      preparationLevel: preparationLevel || "Beginner",
      targetCompanies,
      preparationGoals,
      skipped: isSkipped,
    };

    try {
      const updated = await submitOnboarding(payload);
      if (updated) {
        updateUser(updated);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Onboarding submission failed:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Could not save your preferences. Please try again or skip for now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTargetCompany = (compName) => {
    setTargetCompanies((prev) =>
      prev.includes(compName)
        ? prev.filter((c) => c !== compName)
        : [...prev, compName]
    );
  };

  const toggleGoal = (goalId) => {
    setPreparationGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    );
  };

  // Filter companies for Step 4
  const filteredCompanies = availableCompanies.filter((comp) => {
    if (!companySearch.trim()) return true;
    const q = companySearch.toLowerCase();
    return (
      comp.name.toLowerCase().includes(q) ||
      (comp.industry && comp.industry.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-xs">
            R
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base">
              Recruit<span className="text-primary">Ready</span>
            </span>
            <span className="ml-2 text-xs text-slate-500 font-medium hidden sm:inline">
              Placement Onboarding
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1.5 px-3 rounded-md hover:bg-slate-100"
        >
          Skip for now
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto my-auto py-8">
        {/* Progress Bar & Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2.5">
            <span className="uppercase tracking-wider text-primary font-bold">
              Step {currentStep} of 5
            </span>
            <span>
              {currentStep === 1 && "Basic Profile"}
              {currentStep === 2 && "Academic Details"}
              {currentStep === 3 && "Preparation Level"}
              {currentStep === 4 && "Target Companies"}
              {currentStep === 5 && "Preparation Goals"}
            </span>
          </div>

          <div
            className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-label={`Onboarding progress: step ${currentStep} of 5`}
          >
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>

          {/* Stepper Dots */}
          <div className="flex justify-between items-center mt-3 px-1">
            {[1, 2, 3, 4, 5].map((stepNum) => {
              const isPast = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              return (
                <div key={stepNum} className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                      isPast
                        ? "bg-primary text-white"
                        : isCurrent
                        ? "bg-primary-tint text-primary border border-primary font-extrabold"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isPast ? <CheckIcon className="w-3.5 h-3.5 stroke-[3]" /> : stepNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Card Content */}
        <Card className="p-6 sm:p-8 bg-white border border-slate-200/90 shadow-xs">
          {errorMsg && (
            <div
              className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2"
              role="alert"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── STEP 1: Basic Profile ── */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Let's set up your profile
                </h1>
                <p className="text-sm text-slate-500">
                  Confirm your name and basic details to personalize your experience.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="onboarding-firstName"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="onboarding-firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Anand"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboarding-lastName"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="onboarding-lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Sharma"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="onboarding-photo"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Profile Photo URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="onboarding-photo"
                    type="url"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    If signed in with Google or GitHub, your avatar was automatically retrieved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Academic Background ── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Academic Background
                </h1>
                <p className="text-sm text-slate-500">
                  Match your college eligibility with company hiring criteria.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label
                    htmlFor="onboarding-college"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    College / University <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="onboarding-college"
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Pune Institute of Computer Technology"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="onboarding-branch"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Branch / Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="onboarding-branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  >
                    <option value="">Select your branch</option>
                    {BRANCH_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {branch === "Other" && (
                  <div>
                    <label
                      htmlFor="onboarding-custom-branch"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Specify Branch Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="onboarding-custom-branch"
                      type="text"
                      value={customBranch}
                      onChange={(e) => setCustomBranch(e.target.value)}
                      placeholder="e.g. Instrumentation & Control"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="onboarding-gradYear"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {GRADUATION_YEARS.map((yr) => {
                      const isSelected = Number(graduationYear) === yr;
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setGraduationYear(yr)}
                          className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {yr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Preparation Level ── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  How would you describe your placement preparation?
                </h1>
                <p className="text-sm text-slate-500">
                  We'll adapt your practice suggestions and recommended modules based on this.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {PREPARATION_LEVELS.map((lvl) => {
                  const isSelected = preparationLevel === lvl.id;
                  return (
                    <div
                      key={lvl.id}
                      onClick={() => setPreparationLevel(lvl.id)}
                      className={`cursor-pointer p-4 rounded-xl border text-left transition flex items-start gap-3.5 ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                          : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setPreparationLevel(lvl.id);
                        }
                      }}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {lvl.title}
                          </span>
                          <span className="text-[10px] font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full border border-primary-border">
                            {lvl.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {lvl.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 4: Target Companies ── */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Which companies are you targeting?
                </h1>
                <p className="text-sm text-slate-500">
                  Select the organizations you want to prioritize for company-specific interview prep.
                </p>
              </div>

              {/* Selected companies chips */}
              {targetCompanies.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Selected ({targetCompanies.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {targetCompanies.map((comp) => (
                      <span
                        key={comp}
                        className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-primary text-white shadow-xs"
                      >
                        {comp}
                        <button
                          type="button"
                          onClick={() => toggleTargetCompany(comp)}
                          className="hover:opacity-80 rounded-full p-0.5 focus:outline-none"
                          aria-label={`Remove ${comp}`}
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Search available companies (e.g. Google, TCS, Microsoft)..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              {/* Companies grid */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {loadingCompanies ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Loading companies catalog...
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    {availableCompanies.length === 0
                      ? "No companies available yet."
                      : `No companies matching "${companySearch}".`}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredCompanies.map((comp) => {
                      const isSelected = targetCompanies.includes(comp.name);
                      return (
                        <button
                          key={comp._id || comp.name}
                          type="button"
                          onClick={() => toggleTargetCompany(comp.name)}
                          className={`p-3 rounded-lg border text-left flex items-center justify-between transition ${
                            isSelected
                              ? "bg-primary-tint border-primary text-primary font-semibold"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {comp.logoUrl ? (
                              <img
                                src={comp.logoUrl}
                                alt={comp.name}
                                className="w-6 h-6 rounded object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                                {comp.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs truncate">{comp.name}</span>
                          </div>

                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${
                              isSelected
                                ? "bg-primary border-primary text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <CheckIcon className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 5: Preparation Goals ── */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  What do you want to improve most?
                </h1>
                <p className="text-sm text-slate-500">
                  Select all topics that align with your upcoming placement season targets.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {PREPARATION_GOAL_OPTIONS.map((goal) => {
                  const isSelected = preparationGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? "bg-primary-tint border-primary ring-1 ring-primary/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{goal.icon}</span>
                        <div>
                          <span
                            className={`text-xs block font-bold ${
                              isSelected ? "text-primary" : "text-slate-900"
                            }`}
                          >
                            {goal.id}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            {goal.label}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs shrink-0 transition ${
                          isSelected
                            ? "bg-primary border-primary text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="pt-8 mt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="text-xs"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="text-xs font-semibold px-5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Completing...
                  </span>
                ) : currentStep === 5 ? (
                  <span className="flex items-center gap-1.5">
                    Complete Setup
                    <CheckIcon className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Continue
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl w-full mx-auto text-center pt-4 text-xs text-slate-400">
        RecruitReady — Engineered for High Placement Conversion
      </footer>
    </div>
  );
}

export default OnboardingPage;

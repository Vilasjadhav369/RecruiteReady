import React, { useState, useEffect, useRef, useMemo } from "react";
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
  PlusIcon,
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

function normalizeString(str) {
  if (!str || typeof str !== "string") return "";
  return str.trim().replace(/\s+/g, " ").toLowerCase();
}

export function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  // Form states initialized with existing user metadata
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");

  const [college, setCollege] = useState(user?.college || "");
  const [branch, setBranch] = useState(() => {
    if (!user?.branch) return "";
    return BRANCH_OPTIONS.includes(user.branch) ? user.branch : "Other";
  });
  const [customBranch, setCustomBranch] = useState(() => {
    if (!user?.branch) return "";
    return BRANCH_OPTIONS.includes(user.branch) ? "" : user.branch;
  });
  const [graduationYear, setGraduationYear] = useState(user?.graduationYear || 2026);

  const [preparationLevel, setPreparationLevel] = useState(user?.preparationLevel || "Beginner");

  // Companies state
  const [catalogCompanies, setCatalogCompanies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [targetCompanies, setTargetCompanies] = useState(user?.targetCompanies || []);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);

  // Goals state
  const [preparationGoals, setPreparationGoals] = useState(user?.preparationGoals || []);

  const searchRequestIdRef = useRef(0);
  const errorAlertRef = useRef(null);

  // Sync state once if user becomes available after initial mount
  const syncedUserIdRef = useRef(null);
  useEffect(() => {
    if (user && syncedUserIdRef.current !== user._id) {
      syncedUserIdRef.current = user._id;
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.profilePhoto) setProfilePhoto(user.profilePhoto);
      if (user.college) setCollege(user.college);
      if (user.branch) {
        if (BRANCH_OPTIONS.includes(user.branch)) {
          setBranch(user.branch);
        } else {
          setBranch("Other");
          setCustomBranch(user.branch);
        }
      }
      if (user.graduationYear) setGraduationYear(user.graduationYear);
      if (user.preparationLevel) setPreparationLevel(user.preparationLevel);
      if (Array.isArray(user.targetCompanies) && user.targetCompanies.length > 0) {
        setTargetCompanies(user.targetCompanies);
      }
      if (Array.isArray(user.preparationGoals) && user.preparationGoals.length > 0) {
        setPreparationGoals(user.preparationGoals);
      }
    }
  }, [user]);

  // Load initial popular companies from database
  useEffect(() => {
    let isMounted = true;
    async function loadInitialCompanies() {
      try {
        setLoadingCompanies(true);
        const data = await getCompanies({ limit: 100 });
        if (isMounted) {
          setCatalogCompanies(data?.companies || []);
        }
      } catch (err) {
        console.warn("Failed to load companies for onboarding:", err);
      } finally {
        if (isMounted) setLoadingCompanies(false);
      }
    }
    loadInitialCompanies();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced server search for companies catalog
  useEffect(() => {
    const trimmed = companySearch.trim();
    if (!trimmed) {
      return;
    }

    setIsSearchingCompanies(true);
    const reqId = ++searchRequestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const data = await getCompanies({ search: trimmed, limit: 12 });
        if (searchRequestIdRef.current === reqId) {
          setSearchResults(data?.companies || []);
          setIsSearchingCompanies(false);
        }
      } catch {
        if (searchRequestIdRef.current === reqId) {
          setIsSearchingCompanies(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [companySearch]);

  // Target companies normalized set
  const normalizedTargetCompaniesSet = useMemo(() => {
    return new Set(targetCompanies.map((c) => normalizeString(c)));
  }, [targetCompanies]);

  const isCompanySelected = (compName) => {
    return normalizedTargetCompaniesSet.has(normalizeString(compName));
  };

  // Filter or combine companies for Step 4
  const queryTrimmed = companySearch.trim();
  const displayedCompanies = useMemo(() => {
    if (queryTrimmed) {
      // Merge results from debounced search and any matching initial catalog items
      const q = queryTrimmed.toLowerCase();
      const catalogMatches = catalogCompanies.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.industry && c.industry.toLowerCase().includes(q))
      );
      const combined = [...searchResults];
      catalogMatches.forEach((c) => {
        if (!combined.some((item) => normalizeString(item.name) === normalizeString(c.name))) {
          combined.push(c);
        }
      });
      return combined;
    }
    return catalogCompanies;
  }, [queryTrimmed, searchResults, catalogCompanies]);

  const canAddCustomCompany =
    queryTrimmed.length > 0 &&
    !displayedCompanies.some(
      (c) => normalizeString(c.name) === normalizeString(queryTrimmed)
    ) &&
    !isCompanySelected(queryTrimmed);

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
        const msg = "Please provide your first name.";
        setErrorMsg(msg);
        setLiveAnnouncement(msg);
        errorAlertRef.current?.focus();
        return;
      }
      if (!lastName.trim()) {
        const msg = "Please provide your last name.";
        setErrorMsg(msg);
        setLiveAnnouncement(msg);
        errorAlertRef.current?.focus();
        return;
      }
    } else if (currentStep === 2) {
      if (!college.trim()) {
        const msg = "Please specify your college or university.";
        setErrorMsg(msg);
        setLiveAnnouncement(msg);
        errorAlertRef.current?.focus();
        return;
      }
      if (!branch) {
        const msg = "Please select your branch of study.";
        setErrorMsg(msg);
        setLiveAnnouncement(msg);
        errorAlertRef.current?.focus();
        return;
      }
      if (branch === "Other" && !customBranch.trim()) {
        const msg = "Please specify your department / branch name.";
        setErrorMsg(msg);
        setLiveAnnouncement(msg);
        errorAlertRef.current?.focus();
        return;
      }
    }

    if (currentStep < 5) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setLiveAnnouncement(`Navigated to Step ${next} of 5`);
    } else {
      handleFinalSubmit(false);
    }
  };

  const handleBack = () => {
    setErrorMsg("");
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setLiveAnnouncement(`Returned to Step ${prev} of 5`);
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
      const msg =
        err.response?.data?.message ||
        "Could not save your preferences. Please try again or skip for now.";
      setErrorMsg(msg);
      setLiveAnnouncement(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTargetCompany = (compName) => {
    const cleanName = typeof compName === "string" ? compName.trim().replace(/\s+/g, " ") : "";
    if (!cleanName) return;

    if (isCompanySelected(cleanName)) {
      setTargetCompanies((prev) =>
        prev.filter((c) => normalizeString(c) !== normalizeString(cleanName))
      );
      setLiveAnnouncement(`Removed ${cleanName} from target companies.`);
    } else {
      setTargetCompanies((prev) => [...prev, cleanName]);
      setLiveAnnouncement(`Added ${cleanName} to target companies.`);
    }
  };

  const handleAddCustomCompany = (nameToAdd) => {
    const cleanName = typeof nameToAdd === "string" ? nameToAdd.trim().replace(/\s+/g, " ") : "";
    if (!cleanName) return;

    if (isCompanySelected(cleanName)) {
      setLiveAnnouncement(`${cleanName} is already selected.`);
      return;
    }

    setTargetCompanies((prev) => [...prev, cleanName]);
    setLiveAnnouncement(`Added ${cleanName} as target company.`);
    setCompanySearch("");
    setSearchResults([]);
  };

  const toggleGoal = (goalId) => {
    setPreparationGoals((prev) => {
      const exists = prev.includes(goalId);
      const next = exists ? prev.filter((g) => g !== goalId) : [...prev, goalId];
      setLiveAnnouncement(
        exists ? `Deselected ${goalId} goal.` : `Selected ${goalId} goal.`
      );
      return next;
    });
  };

  // Keyboard navigation for preparation level radio group
  const handleLevelKeyDown = (e, currentIndex) => {
    let nextIndex = currentIndex;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % PREPARATION_LEVELS.length;
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + PREPARATION_LEVELS.length) % PREPARATION_LEVELS.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = PREPARATION_LEVELS.length - 1;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setPreparationLevel(PREPARATION_LEVELS[currentIndex].id);
      setLiveAnnouncement(`Selected ${PREPARATION_LEVELS[currentIndex].title} preparation level.`);
      return;
    } else {
      return;
    }

    const nextLevel = PREPARATION_LEVELS[nextIndex];
    setPreparationLevel(nextLevel.id);
    setLiveAnnouncement(`Selected ${nextLevel.title} preparation level.`);
    const el = document.getElementById(`prep-level-radio-${nextLevel.id.replace(/\s+/g, "-")}`);
    el?.focus();
  };


  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Basic Profile";
      case 2:
        return "Academic Details";
      case 3:
        return "Preparation Level";
      case 4:
        return "Target Companies";
      case 5:
        return "Preparation Goals";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Screen reader live announcement region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Top Header */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-xs select-none">
            R
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
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
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1.5 px-3 rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px]"
        >
          Skip for now
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto my-auto py-6 sm:py-8">
        {/* Progress Bar & Indicators */}
        <div className="mb-6 sm:mb-8" aria-label="Onboarding Progress">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2.5">
            <span className="uppercase tracking-wider text-primary font-bold">
              Step {currentStep} of 5
            </span>
            <span className="truncate max-w-[180px] sm:max-w-none text-right font-medium">
              {getStepTitle()}
            </span>
          </div>

          <div
            className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-label={`Onboarding progress: step ${currentStep} of 5 - ${getStepTitle()}`}
          >
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>

          {/* Stepper Dots */}
          <div className="flex justify-between items-center mt-3 px-1" aria-hidden="true">
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
        <Card className="p-5 sm:p-8 bg-white border border-slate-200/90 shadow-xs">
          {errorMsg && (
            <div
              ref={errorAlertRef}
              tabIndex={-1}
              className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              role="alert"
              aria-live="assertive"
              id="onboarding-error-alert"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
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
                <p className="text-xs sm:text-sm text-slate-500">
                  Confirm your name and basic details to personalize your placement roadmap.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="onboarding-firstName"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      First Name <span className="text-red-500" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      id="onboarding-firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Anand"
                      aria-required="true"
                      aria-invalid={!firstName.trim() && Boolean(errorMsg)}
                      aria-describedby={!firstName.trim() && Boolean(errorMsg) ? "onboarding-error-alert" : undefined}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboarding-lastName"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Last Name <span className="text-red-500" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      id="onboarding-lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Sharma"
                      aria-required="true"
                      aria-invalid={!lastName.trim() && Boolean(errorMsg)}
                      aria-describedby={!lastName.trim() && Boolean(errorMsg) ? "onboarding-error-alert" : undefined}
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
                    aria-describedby="onboarding-photo-hint"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                  <p id="onboarding-photo-hint" className="mt-1 text-[11px] text-slate-500">
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
                <p className="text-xs sm:text-sm text-slate-500">
                  Match your college eligibility with company hiring criteria.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label
                    htmlFor="onboarding-college"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    College / University <span className="text-red-500" aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <input
                    id="onboarding-college"
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Pune Institute of Computer Technology"
                    aria-required="true"
                    aria-invalid={!college.trim() && Boolean(errorMsg)}
                    aria-describedby={!college.trim() && Boolean(errorMsg) ? "onboarding-error-alert" : undefined}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="onboarding-branch"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Branch / Department <span className="text-red-500" aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <select
                    id="onboarding-branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    aria-required="true"
                    aria-invalid={!branch && Boolean(errorMsg)}
                    aria-describedby={!branch && Boolean(errorMsg) ? "onboarding-error-alert" : undefined}
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
                      Specify Branch Name <span className="text-red-500" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      id="onboarding-custom-branch"
                      type="text"
                      value={customBranch}
                      onChange={(e) => setCustomBranch(e.target.value)}
                      placeholder="e.g. Instrumentation & Control"
                      aria-required="true"
                      aria-invalid={!customBranch.trim() && Boolean(errorMsg)}
                      aria-describedby={!customBranch.trim() && Boolean(errorMsg) ? "onboarding-error-alert" : undefined}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>
                )}

                <div>
                  <label
                    id="onboarding-gradYear-label"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Graduation Year <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div
                    role="radiogroup"
                    aria-labelledby="onboarding-gradYear-label"
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2"
                  >
                    {GRADUATION_YEARS.map((yr) => {
                      const isSelected = Number(graduationYear) === yr;
                      return (
                        <button
                          key={yr}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setGraduationYear(yr);
                            setLiveAnnouncement(`Selected graduation year ${yr}.`);
                          }}
                          className={`min-h-[44px] py-2.5 px-2 text-xs font-semibold rounded-lg border text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs font-bold"
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
                <h1
                  id="onboarding-prep-level-heading"
                  className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
                >
                  How would you describe your placement preparation?
                </h1>
                <p id="onboarding-prep-level-desc" className="text-xs sm:text-sm text-slate-500">
                  We'll adapt your practice suggestions and recommended modules based on this.
                </p>
              </div>

              <div
                role="radiogroup"
                aria-labelledby="onboarding-prep-level-heading"
                aria-describedby="onboarding-prep-level-desc"
                className="space-y-3 pt-2"
              >
                {PREPARATION_LEVELS.map((lvl, idx) => {
                  const isSelected = preparationLevel === lvl.id;
                  const radioId = `prep-level-radio-${lvl.id.replace(/\s+/g, "-")}`;
                  return (
                    <div
                      key={lvl.id}
                      id={radioId}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => {
                        setPreparationLevel(lvl.id);
                        setLiveAnnouncement(`Selected ${lvl.title} preparation level.`);
                      }}
                      onKeyDown={(e) => handleLevelKeyDown(e, idx)}
                      className={`cursor-pointer p-4 rounded-xl border text-left transition flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                          : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-slate-300 bg-white"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
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
                <p className="text-xs sm:text-sm text-slate-500">
                  Select companies from the catalog or add your dream employers.
                </p>
              </div>

              {/* Selected companies chips */}
              {targetCompanies.length > 0 && (
                <div className="space-y-2">
                  <span
                    id="selected-companies-label"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Selected ({targetCompanies.length}):
                  </span>
                  <div
                    aria-labelledby="selected-companies-label"
                    className="flex flex-wrap gap-2"
                  >
                    {targetCompanies.map((comp) => (
                      <span
                        key={comp}
                        className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-primary text-white shadow-xs"
                      >
                        <span className="truncate max-w-[200px]">{comp}</span>
                        <button
                          type="button"
                          onClick={() => toggleTargetCompany(comp)}
                          className="hover:opacity-80 rounded-full p-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white min-w-[20px] min-h-[20px] flex items-center justify-center"
                          aria-label={`Remove ${comp} from target companies`}
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Search input with debounced server search & custom addition */}
              <div className="space-y-2">
                <div className="relative">
                  <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompanySearch(val);
                      if (!val.trim()) {
                        setSearchResults([]);
                        setIsSearchingCompanies(false);
                      }
                    }}
                    placeholder="Search catalog or type custom company (e.g. Google, TCS)..."
                    aria-label="Search company catalog"
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                  {companySearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCompanySearch("");
                        setSearchResults([]);
                        setIsSearchingCompanies(false);
                      }}
                      aria-label="Clear company search"
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Option to add custom company if typed string isn't in catalog or already selected */}
                {canAddCustomCompany && (
                  <button
                    type="button"
                    onClick={() => handleAddCustomCompany(queryTrimmed)}
                    className="w-full p-2.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>
                      Add <strong>&ldquo;{queryTrimmed}&rdquo;</strong> as custom target company
                    </span>
                  </button>
                )}
              </div>

              {/* Companies grid */}
              <div
                className="max-h-64 overflow-y-auto space-y-2 pr-1"
                aria-label="Available companies catalog"
              >
                {loadingCompanies || isSearchingCompanies ? (
                  <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span>Searching companies...</span>
                  </div>
                ) : displayedCompanies.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    {queryTrimmed
                      ? `No catalog companies matching "${companySearch}". You can add it using the button above.`
                      : "No companies found in catalog."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {displayedCompanies.map((comp) => {
                      const isSelected = isCompanySelected(comp.name);
                      return (
                        <button
                          key={comp._id || comp.name}
                          type="button"
                          onClick={() => toggleTargetCompany(comp.name)}
                          aria-pressed={isSelected}
                          className={`p-3 rounded-lg border text-left flex items-center justify-between transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isSelected
                              ? "bg-primary-tint border-primary text-primary font-semibold"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                            {comp.logoUrl ? (
                              <img
                                src={comp.logoUrl}
                                alt=""
                                aria-hidden="true"
                                className="w-6 h-6 rounded object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
                              />
                            ) : (
                              <div
                                aria-hidden="true"
                                className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0"
                              >
                                {comp.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs truncate">{comp.name}</span>
                          </div>

                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 transition ${
                              isSelected
                                ? "bg-primary border-primary text-white"
                                : "border-slate-300 bg-white"
                            }`}
                            aria-hidden="true"
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
                <h1
                  id="onboarding-goals-heading"
                  className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
                >
                  What do you want to improve most?
                </h1>
                <p id="onboarding-goals-desc" className="text-xs sm:text-sm text-slate-500">
                  Select all focus tracks that align with your upcoming placement season targets.
                </p>
              </div>

              <div
                role="group"
                aria-labelledby="onboarding-goals-heading"
                aria-describedby="onboarding-goals-desc"
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2"
              >
                {PREPARATION_GOAL_OPTIONS.map((goal) => {
                  const isSelected = preparationGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected
                          ? "bg-primary-tint border-primary ring-1 ring-primary/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="text-lg shrink-0" aria-hidden="true">
                          {goal.icon}
                        </span>
                        <div className="min-w-0">
                          <span
                            className={`text-xs block font-bold truncate ${
                              isSelected ? "text-primary" : "text-slate-900"
                            }`}
                          >
                            {goal.id}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight block">
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
                        aria-hidden="true"
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
          <div className="pt-6 sm:pt-8 mt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="text-xs min-h-[40px] px-4"
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
                className="text-xs font-semibold px-5 min-h-[40px]"
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

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { updateProfile } from "../services/authService.js";
import { syncGoals } from "../services/goalService.js";
import { calculateProfileCompletion } from "../utils/profileCompletion.js";

// Extracted Sub-components for Modular Personal & Academic Experience
import PersonalAcademicTab from "../components/profile/PersonalAcademicTab.jsx";
import TargetCompaniesTab from "../components/profile/TargetCompaniesTab.jsx";
import PreparationGoalsTab from "../components/profile/PreparationGoalsTab.jsx";
import ProfileIdentitySidebar from "../components/profile/ProfileIdentitySidebar.jsx";
import AccountSecurityTab from "../components/profile/AccountSecurityTab.jsx";

import {
  PageHeader,
  Card,
  CardFooter,
  Button,
  LoadingState,
} from "../components/ui/index.js";
import { Tabs } from "../components/ui/Tabs.jsx";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  CloseIcon,
  CheckIcon,
  ProfileIcon,
  AcademicCapIcon,
  CompanyIcon,
  FlagIcon,
  ShieldCheckIcon,
} from "../components/ui/Icons.jsx";

/**
 * ProfilePage — Student Profile, Academic Credentials, Target Companies & Account Security.
 * Phase 1 Information Architecture Refactor:
 * - Genuine accessible tabs: Personal, Academic, Targets, Goals, Security
 * - URL addressable navigation via search params (?tab=personal|academic|targets|goals|security)
 * - Hash fragment backward-compatibility (#personal-section, #academic-section, #target-companies-section, #preparation-goals-section)
 * - Move Account Security to accessible settings tab & /settings route
 * - Preserves validation, goal sync, recovery retry, dirty form guards, and sticky save bar
 * - Redundant back buttons removed (breadcrumbs provide one-click return)
 */
function ProfilePage({ defaultTab = "personal" }) {
  const { user, updateUser, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Basic Personal & Academic Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    college: "",
    branch: "",
    graduationYear: "",
    cgpa: "",
    backlogs: "",
    profilePhoto: "",
    preparationLevel: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [targetCompanies, setTargetCompanies] = useState([]);
  const [preparationGoals, setPreparationGoals] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [goalSyncWarning, setGoalSyncWarning] = useState(false);
  const [isSyncingGoals, setIsSyncingGoals] = useState(false);

  // Tab resolution logic (URL query param -> URL hash fallback -> defaultTab)
  const validTabs = ["personal", "academic", "targets", "goals", "security"];
  const urlTab = searchParams.get("tab");

  const resolveInitialTab = useCallback(() => {
    if (urlTab && validTabs.includes(urlTab)) return urlTab;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash === "#academic-section") return "academic";
    if (hash === "#target-companies-section") return "targets";
    if (hash === "#preparation-goals-section") return "goals";
    if (hash === "#security-section" || hash === "#security") return "security";
    if (hash === "#personal-section") return "personal";
    return defaultTab;
  }, [urlTab, defaultTab]);

  const [activeTab, setActiveTab] = useState(resolveInitialTab);

  // Synchronize activeTab when query param or defaultTab changes
  useEffect(() => {
    const nextTab = resolveInitialTab();
    setActiveTab(nextTab);
  }, [resolveInitialTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Sync form state when authenticated user data becomes available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        college: user.college || "",
        branch: user.branch || "",
        graduationYear: user.graduationYear ? String(user.graduationYear) : "",
        cgpa: user.cgpa !== null && user.cgpa !== undefined ? String(user.cgpa) : "",
        backlogs: user.backlogs !== null && user.backlogs !== undefined ? String(user.backlogs) : "0",
        profilePhoto: user.profilePhoto || "",
        preparationLevel: user.preparationLevel || "",
      });
      setTargetCompanies(Array.isArray(user.targetCompanies) ? user.targetCompanies : []);
      setPreparationGoals(Array.isArray(user.preparationGoals) ? user.preparationGoals : []);
      setFormErrors({});
    }
  }, [user]);

  // Check if form has unsaved modifications
  const isDirty = useMemo(() => {
    if (!user) return false;
    const initialGrad = user.graduationYear ? String(user.graduationYear) : "";
    const initialCgpa = user.cgpa !== null && user.cgpa !== undefined ? String(user.cgpa) : "";
    const initialBacklogs = user.backlogs !== null && user.backlogs !== undefined ? String(user.backlogs) : "0";

    const basicChanged =
      formData.firstName !== (user.firstName || "") ||
      formData.lastName !== (user.lastName || "") ||
      formData.college !== (user.college || "") ||
      formData.branch !== (user.branch || "") ||
      formData.graduationYear !== initialGrad ||
      formData.cgpa !== initialCgpa ||
      formData.backlogs !== initialBacklogs ||
      formData.profilePhoto !== (user.profilePhoto || "") ||
      formData.preparationLevel !== (user.preparationLevel || "");

    const initialCompanies = user.targetCompanies || [];
    const companiesChanged =
      targetCompanies.length !== initialCompanies.length ||
      targetCompanies.some((c, i) => c !== initialCompanies[i]);

    const initialGoals = user.preparationGoals || [];
    const goalsChanged =
      preparationGoals.length !== initialGoals.length ||
      preparationGoals.some((g, i) => g !== initialGoals[i]);

    return basicChanged || companiesChanged || goalsChanged;
  }, [formData, targetCompanies, preparationGoals, user]);

  // Unsaved changes browser navigation guard (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes in your candidate profile. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Unsaved changes internal React Router navigation guard
  useEffect(() => {
    if (!isDirty) return;

    const handleInternalNavigationClick = (e) => {
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const targetUrl = new URL(anchor.href, window.location.origin);
      if (targetUrl.pathname !== window.location.pathname) {
        const confirmLeave = window.confirm(
          "You have unsaved changes in your profile. Are you sure you want to leave without saving?"
        );
        if (!confirmLeave) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("click", handleInternalNavigationClick, true);
    return () => {
      document.removeEventListener("click", handleInternalNavigationClick, true);
    };
  }, [isDirty]);

  // Active user representation with live draft values for previewing completion
  const draftUser = useMemo(() => {
    return {
      ...(user || {}),
      firstName: formData.firstName,
      lastName: formData.lastName,
      college: formData.college,
      branch: formData.branch,
      graduationYear: formData.graduationYear ? Number(formData.graduationYear) : null,
      cgpa: formData.cgpa ? Number(formData.cgpa) : null,
      backlogs: formData.backlogs ? Number(formData.backlogs) : 0,
      profilePhoto: formData.profilePhoto,
      preparationLevel: formData.preparationLevel,
      targetCompanies,
      preparationGoals,
    };
  }, [user, formData, targetCompanies, preparationGoals]);

  const completion = useMemo(() => {
    return calculateProfileCompletion(draftUser);
  }, [draftUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        college: user.college || "",
        branch: user.branch || "",
        graduationYear: user.graduationYear ? String(user.graduationYear) : "",
        cgpa: user.cgpa !== null && user.cgpa !== undefined ? String(user.cgpa) : "",
        backlogs: user.backlogs !== null && user.backlogs !== undefined ? String(user.backlogs) : "0",
        profilePhoto: user.profilePhoto || "",
        preparationLevel: user.preparationLevel || "",
      });
      setTargetCompanies(user.targetCompanies || []);
      setPreparationGoals(user.preparationGoals || []);
      setFormErrors({});
      setProfileError("");
      setProfileSuccess("");
    }
  };

  const handleAddCompany = (companyToAdd) => {
    if (!companyToAdd || typeof companyToAdd !== "string") return;
    const cleanName = companyToAdd.trim().replace(/\s+/g, " ");
    if (!cleanName) return;

    const alreadyExists = targetCompanies.some(
      (c) => c.trim().replace(/\s+/g, " ").toLowerCase() === cleanName.toLowerCase()
    );
    if (!alreadyExists) {
      setTargetCompanies((prev) => [...prev, cleanName]);
    }
  };

  const handleRemoveCompany = (companyToRemove) => {
    setTargetCompanies((prev) =>
      prev.filter(
        (c) => c.trim().replace(/\s+/g, " ").toLowerCase() !== companyToRemove.trim().replace(/\s+/g, " ").toLowerCase()
      )
    );
  };

  const handleAddGoal = (goalToAdd) => {
    if (!goalToAdd || typeof goalToAdd !== "string") return;
    const cleanGoal = goalToAdd.trim().replace(/\s+/g, " ");
    if (!cleanGoal) return;

    const alreadyExists = preparationGoals.some(
      (g) => g.trim().replace(/\s+/g, " ").toLowerCase() === cleanGoal.toLowerCase()
    );
    if (!alreadyExists) {
      setPreparationGoals((prev) => [...prev, cleanGoal]);
    }
  };

  const handleRemoveGoal = (goalToRemove) => {
    setPreparationGoals((prev) =>
      prev.filter(
        (g) => g.trim().replace(/\s+/g, " ").toLowerCase() !== goalToRemove.trim().replace(/\s+/g, " ").toLowerCase()
      )
    );
  };

  // Profile Submit with comprehensive validation
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required.";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    if (formData.graduationYear) {
      const gradNum = Number(formData.graduationYear);
      if (isNaN(gradNum) || gradNum < 2000 || gradNum > 2100) {
        errors.graduationYear = "Please enter a valid graduation year between 2000 and 2100.";
      }
    }

    if (formData.cgpa !== "" && formData.cgpa !== null) {
      const cgpaNum = Number(formData.cgpa);
      if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
        errors.cgpa = "CGPA must be a valid number between 0 and 10.";
      }
    }

    if (formData.backlogs !== "" && formData.backlogs !== null) {
      const backlogsNum = Number(formData.backlogs);
      if (isNaN(backlogsNum) || !Number.isInteger(backlogsNum) || backlogsNum < 0) {
        errors.backlogs = "Backlogs must be a non-negative whole number (0 or greater).";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setProfileError("Please correct the highlighted fields before saving.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        college: formData.college.trim(),
        branch: formData.branch.trim(),
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : null,
        cgpa: formData.cgpa !== "" ? Number(formData.cgpa) : null,
        backlogs: formData.backlogs !== "" ? Number(formData.backlogs) : 0,
        profilePhoto: formData.profilePhoto.trim(),
        preparationLevel: formData.preparationLevel,
        targetCompanies,
        preparationGoals,
      };

      const updatedUserData = await updateProfile(payload);
      if (updatedUserData) {
        updateUser(updatedUserData);
      }
      setProfileSuccess("Profile updated successfully. Your verified candidate record is up to date.");
      setFormErrors({});

      if (updatedUserData?.goalSyncPending) {
        setGoalSyncWarning(true);
        try {
          await syncGoals();
          setGoalSyncWarning(false);
        } catch (syncErr) {
          console.warn("Automatic goal synchronization recovery deferred to user retry:", syncErr);
        }
      } else {
        setGoalSyncWarning(false);
      }

      setTimeout(() => setProfileSuccess(""), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile. Please try again.";
      setProfileError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryGoalSync = async () => {
    if (isSyncingGoals) return;
    setIsSyncingGoals(true);
    setProfileError("");
    try {
      await syncGoals();
      setGoalSyncWarning(false);
      setProfileSuccess("Preparation goals synchronized successfully.");
      setTimeout(() => setProfileSuccess(""), 5000);
    } catch (err) {
      console.error("Manual goal sync recovery failed:", err);
      setProfileError("Goal synchronization could not be completed. Please check your connection and try again.");
    } finally {
      setIsSyncingGoals(false);
    }
  };

  if (authLoading && !user) {
    return <LoadingState message="Loading candidate profile..." />;
  }

  const profileTabs = [
    {
      id: "personal",
      label: "Personal",
      icon: <ProfileIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "academic",
      label: "Academic",
      icon: <AcademicCapIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "targets",
      label: "Target Companies",
      count: targetCompanies.length > 0 ? targetCompanies.length : undefined,
      icon: <CompanyIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "goals",
      label: "Goals",
      count: preparationGoals.length > 0 ? preparationGoals.length : undefined,
      icon: <FlagIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "security",
      label: "Security & Sessions",
      icon: <ShieldCheckIcon className="w-3.5 h-3.5" />,
    },
  ];

  const isFormTab = activeTab !== "security";

  return (
    <div className="max-w-[1240px] mx-auto space-y-4 pb-6 px-4 sm:px-6">
      {/* 1. Page Header (Redundant back button removed; breadcrumbs provide return) */}
      <PageHeader
        title="Candidate Profile & Settings"
        description="Manage your verified personal details, academic background, recruitment targets, and account security."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile & Settings" },
        ]}
      />

      {/* Global Alerts */}
      {profileSuccess && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-primary-soft border border-primary-tint text-primary-dark text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircleIcon className="w-5 h-5 text-primary shrink-0" />
            <span>{profileSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setProfileSuccess("")}
            className="text-primary-dark hover:text-primary transition-colors cursor-pointer p-1"
            aria-label="Dismiss notification"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {profileError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{profileError}</span>
          </div>
          <button
            type="button"
            onClick={() => setProfileError("")}
            className="text-rose-700 hover:text-rose-900 transition-colors cursor-pointer p-1"
            aria-label="Dismiss error"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {goalSyncWarning && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircleIcon className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Your profile changes were saved, but preparation goal tracking records are pending synchronization.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRetryGoalSync}
              disabled={isSyncingGoals}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSyncingGoals ? "Syncing..." : "Sync Goals Now"}
            </button>
            <button
              type="button"
              onClick={() => setGoalSyncWarning(false)}
              className="text-amber-700 hover:text-amber-900 transition-colors cursor-pointer p-1"
              aria-label="Dismiss warning"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Accessible Navigation Tabs */}
      <Tabs
        tabs={profileTabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        variant="pill"
      />

      {/* Main Grid: Responsive 8:4 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= TAB CONTENT (8 cols on desktop) ================= */}
        <div className="lg:col-span-8 order-1 lg:order-1 space-y-6">
          {isFormTab ? (
            <form onSubmit={handleProfileSubmit} noValidate className="space-y-6">
              {/* Tab: Personal Information */}
              {activeTab === "personal" && (
                <PersonalAcademicTab
                  formData={{
                    ...formData,
                    email: user?.email || "",
                  }}
                  errors={formErrors}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  section="personal"
                />
              )}

              {/* Tab: Academic Background */}
              {activeTab === "academic" && (
                <PersonalAcademicTab
                  formData={{
                    ...formData,
                    email: user?.email || "",
                  }}
                  errors={formErrors}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  section="academic"
                />
              )}

              {/* Tab: Target Companies */}
              {activeTab === "targets" && (
                <div id="target-companies-section">
                  <TargetCompaniesTab
                    targetCompanies={targetCompanies}
                    onAddCompany={handleAddCompany}
                    onRemoveCompany={handleRemoveCompany}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Tab: Preparation Goals */}
              {activeTab === "goals" && (
                <div id="preparation-goals-section">
                  <PreparationGoalsTab
                    preparationGoals={preparationGoals}
                    onAddGoal={handleAddGoal}
                    onRemoveGoal={handleRemoveGoal}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Sticky Form Action Bar (only active on form tabs) */}
              <Card className="border-slate-200/90 shadow-xs sticky bottom-4 z-10 bg-white/95 backdrop-blur-xs">
                <CardFooter className="py-3 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    {isDirty ? (
                      <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Unsaved changes detected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <CheckIcon className="w-3.5 h-3.5 text-primary" />
                        All candidate details synchronized
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={!isDirty || isSubmitting}
                    >
                      Reset
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={isSubmitting}
                      disabled={isSubmitting || !isDirty}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </form>
          ) : (
            /* Tab: Account Security (manages its own actions) */
            <div id="security-section">
              <AccountSecurityTab user={user} />
            </div>
          )}
        </div>

        {/* ================= IDENTITY & READINESS SIDEBAR (4 cols on desktop) ================= */}
        <div className="lg:col-span-4 order-2 lg:order-2">
          <ProfileIdentitySidebar
            user={user}
            formData={formData}
            completion={completion}
          />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

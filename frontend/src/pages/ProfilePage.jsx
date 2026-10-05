import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { updateProfile, changePassword } from "../services/authService.js";
import { getCompanies } from "../services/companyService.js";
import { calculateProfileCompletion } from "../utils/profileCompletion.js";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Input,
  Avatar,
  ProgressBar,
  LoadingState,
} from "../components/ui/index.js";
import {
  AcademicCapIcon,
  CompanyIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CalendarIcon,
  PlusIcon,
  CloseIcon,
  ArrowLeftIcon,
  CheckIcon,
} from "../components/ui/Icons.jsx";

const FALLBACK_COMPANY_SUGGESTIONS = [
  "Tata Consultancy Services",
  "Infosys",
  "Amazon",
  "Wipro",
  "Cognizant",
  "Accenture",
];

const SUGGESTED_GOALS = [
  "Solve 100 Coding Problems",
  "Master Dynamic Programming",
  "Score 85%+ in Mock Tests",
  "Complete Quantitative Aptitude",
  "Review Core CS Fundamentals",
];

/**
 * ProfilePage — Student profile, academic credentials, target companies & account security.
 * Follows RecruitReady Design System: Apple + Linear + Premium University.
 */
function ProfilePage() {
  const { user, updateUser, loading: authLoading } = useAuth();

  // Basic Profile Form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    college: "",
    branch: "",
    graduationYear: "",
    profilePhoto: "",
  });

  const [targetCompanies, setTargetCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState("");
  const [companySuggestions, setCompanySuggestions] = useState(FALLBACK_COMPANY_SUGGESTIONS);

  const [preparationGoals, setPreparationGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password Change Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Fetch authentic companies from database for suggestions
  useEffect(() => {
    let isMounted = true;
    getCompanies({ limit: 12 })
      .then((data) => {
        if (isMounted && data?.companies && data.companies.length > 0) {
          const names = data.companies.map((c) => c.name);
          setCompanySuggestions(names);
        }
      })
      .catch(() => {
        // Keep fallback suggestions if company catalog fails
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync form state when authenticated user data becomes available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        college: user.college || "",
        branch: user.branch || "",
        graduationYear: user.graduationYear ? String(user.graduationYear) : "",
        profilePhoto: user.profilePhoto || "",
      });
      setTargetCompanies(Array.isArray(user.targetCompanies) ? user.targetCompanies : []);
      setPreparationGoals(Array.isArray(user.preparationGoals) ? user.preparationGoals : []);
    }
  }, [user]);

  // Check if form has unsaved modifications
  const isDirty = useMemo(() => {
    if (!user) return false;
    const initialGrad = user.graduationYear ? String(user.graduationYear) : "";
    const basicChanged =
      formData.firstName !== (user.firstName || "") ||
      formData.lastName !== (user.lastName || "") ||
      formData.college !== (user.college || "") ||
      formData.branch !== (user.branch || "") ||
      formData.graduationYear !== initialGrad ||
      formData.profilePhoto !== (user.profilePhoto || "");

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

  // Active user representation with live draft values for previewing completion
  const draftUser = useMemo(() => {
    return {
      ...(user || {}),
      firstName: formData.firstName,
      lastName: formData.lastName,
      college: formData.college,
      branch: formData.branch,
      graduationYear: formData.graduationYear ? Number(formData.graduationYear) : null,
      profilePhoto: formData.profilePhoto,
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
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        college: user.college || "",
        branch: user.branch || "",
        graduationYear: user.graduationYear ? String(user.graduationYear) : "",
        profilePhoto: user.profilePhoto || "",
      });
      setTargetCompanies(user.targetCompanies || []);
      setPreparationGoals(user.preparationGoals || []);
      setProfileError("");
      setProfileSuccess("");
    }
  };

  const handleAddCompany = (companyToAdd) => {
    const candidate = (companyToAdd || newCompany).trim();
    if (candidate && !targetCompanies.includes(candidate)) {
      setTargetCompanies((prev) => [...prev, candidate]);
      setNewCompany("");
    }
  };

  const handleRemoveCompany = (companyToRemove) => {
    setTargetCompanies((prev) => prev.filter((c) => c !== companyToRemove));
  };

  const handleAddGoal = (goalToAdd) => {
    const candidate = (goalToAdd || newGoal).trim();
    if (candidate && !preparationGoals.includes(candidate)) {
      setPreparationGoals((prev) => [...prev, candidate]);
      setNewGoal("");
    }
  };

  const handleRemoveGoal = (goalToRemove) => {
    setPreparationGoals((prev) => prev.filter((g) => g !== goalToRemove));
  };

  // Submit Profile Details
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    if (!formData.firstName.trim()) {
      setProfileError("First name is required.");
      return;
    }

    if (!formData.lastName.trim()) {
      setProfileError("Last name is required.");
      return;
    }

    if (formData.graduationYear) {
      const gradNum = Number(formData.graduationYear);
      if (isNaN(gradNum) || gradNum < 2000 || gradNum > 2100) {
        setProfileError("Please enter a valid graduation year between 2000 and 2100.");
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
        profilePhoto: formData.profilePhoto.trim(),
        targetCompanies,
        preparationGoals,
      };

      const updatedUserData = await updateProfile(payload);
      if (updatedUserData) {
        updateUser(updatedUserData);
      }
      setProfileSuccess("Profile updated successfully. Your candidate record is now up to date.");

      setTimeout(() => setProfileSuccess(""), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile. Please try again.";
      setProfileError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (!passwordData.currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New password and confirmation password do not match.");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      setPasswordSuccess(res?.message || "Password changed successfully.");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setPasswordSuccess(""), 5000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to change password. Please check your current password.";
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const availableCompanySuggestions = useMemo(() => {
    return companySuggestions.filter((c) => !targetCompanies.includes(c));
  }, [companySuggestions, targetCompanies]);

  const availableGoalSuggestions = useMemo(() => {
    return SUGGESTED_GOALS.filter((g) => !preparationGoals.includes(g));
  }, [preparationGoals]);

  if (authLoading && !user) {
    return <LoadingState message="Loading candidate profile..." />;
  }

  const studentFullName = `${formData.firstName || user?.firstName || "Student"} ${formData.lastName || user?.lastName || ""}`.trim();
  const registrationDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Active Candidate";

  const passwordMatch = Boolean(
    passwordData.newPassword &&
    passwordData.confirmPassword &&
    passwordData.newPassword === passwordData.confirmPassword
  );

  const passwordMismatch = Boolean(
    passwordData.newPassword &&
    passwordData.confirmPassword &&
    passwordData.newPassword !== passwordData.confirmPassword
  );

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Student Profile"
        description="Manage your verified personal details, academic background, recruitment targets, and account security."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Student Profile" },
        ]}
        actions={
          <Link to="/dashboard">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<ArrowLeftIcon className="w-4 h-4" />}
            >
              Back to Dashboard
            </Button>
          </Link>
        }
      />

      {/* Global Alerts */}
      {profileSuccess && (
        <div
          role="status"
          className="p-4 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#14532D] text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircleIcon className="w-5 h-5 text-[#166534] shrink-0" />
            <span>{profileSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setProfileSuccess("")}
            className="text-[#14532D] hover:text-[#166534] transition-colors cursor-pointer p-1"
            aria-label="Dismiss notification"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {profileError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200"
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

      {/* Main Grid: Left Overview Sidebar + Right Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT SIDEBAR (4 cols) ================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Overview Identity Card */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <Avatar
                  size="xl"
                  name={studentFullName}
                  src={formData.profilePhoto || user?.profilePhoto || undefined}
                  className="w-16 h-16 text-lg ring-4 ring-slate-100"
                />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {studentFullName}
                </h2>
                <p className="text-xs text-slate-500 font-medium font-mono">
                  {user?.email || "student@recruitready.in"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <Badge variant="primary">
                  {user?.role === "admin" ? "Administrator" : "Candidate Profile"}
                </Badge>
                <Badge variant="success" dot>
                  Active Account
                </Badge>
              </div>

              <div className="pt-4 border-t border-slate-100 text-left space-y-3 text-xs">
                <div className="flex items-center gap-2.5 text-slate-600">
                  <AcademicCapIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {formData.college || user?.college || "College not added yet"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-slate-600">
                  <CompanyIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {formData.branch || user?.branch || "Department not added yet"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-slate-600">
                  <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {formData.graduationYear || user?.graduationYear
                      ? `Class of ${formData.graduationYear || user?.graduationYear}`
                      : "Graduation year not set"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-slate-400 pt-1 text-[11px]">
                  <ShieldCheckIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Enrolled: {registrationDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Genuine Profile Completion Card */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Profile Readiness</CardTitle>
                <p className="text-[11px] text-slate-500">
                  {completion.completedCount} of {completion.totalCount} details added
                </p>
              </div>
              <span className="text-sm font-bold text-[#166534] font-mono">
                {completion.percentage}%
              </span>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <ProgressBar
                value={completion.percentage}
                max={100}
                variant={completion.isComplete ? "success" : "primary"}
                size="md"
              />

              <div className="space-y-2 text-xs">
                {completion.fields.map((f) => (
                  <div
                    key={f.key}
                    className="flex items-center justify-between text-slate-600 py-0.5"
                  >
                    <span className="flex items-center gap-2">
                      {f.completed ? (
                        <span className="w-4 h-4 rounded-full bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0">
                          <CheckIcon className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className={f.completed ? "text-slate-800 font-medium" : "text-slate-500"}>
                        {f.label}
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {f.completed ? "Done" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {completion.isComplete
                    ? "Your candidate profile is 100% complete. Campus placement analytics and recommendation algorithms are fully tailored to your goals."
                    : "Complete all fields to ensure accurate placement matching for company-specific aptitude and mock assessment modules."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Security & Verification Badge */}
          <Card className="border-slate-200/80 bg-slate-50/70 shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                <ShieldCheckIcon className="w-4 h-4 text-[#166534] shrink-0" />
                <span>Verified Credentials</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your account is protected by cryptographic password hashing and token-based authentication. Role privileges are strictly server-managed to safeguard assessment integrity.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT MAIN FORMS (8 cols) ================= */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* 1. Personal Information */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader>
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Official identity details displayed on your assessment scorecards.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="e.g. Anand"
                  />

                  <Input
                    label="Last Name"
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="e.g. Jadhav"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    id="email"
                    name="email"
                    type="email"
                    disabled
                    value={user?.email || ""}
                    helperText="Registered email address is verified and strictly read-only."
                  />

                  <Input
                    label="Candidate Authorization"
                    id="role"
                    name="role"
                    type="text"
                    disabled
                    value={user?.role === "admin" ? "Platform Administrator" : "Student Candidate"}
                    helperText="Assigned platform role tier."
                  />
                </div>

                <div>
                  <Input
                    label="Profile Photo URL"
                    id="profilePhoto"
                    name="profilePhoto"
                    type="url"
                    value={formData.profilePhoto}
                    onChange={handleInputChange}
                    placeholder="https://example.com/photo.jpg"
                    helperText="Direct image URL for your avatar. If blank, deterministic initials will be displayed."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Academic Background */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader>
                <div>
                  <CardTitle>Academic Background</CardTitle>
                  <CardDescription>
                    University and degree details used for placement eligibility criteria.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="College / University"
                  id="college"
                  name="college"
                  type="text"
                  value={formData.college}
                  onChange={handleInputChange}
                  placeholder="e.g. Pune Institute of Computer Technology"
                  helperText="Full institutional name without acronym."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Branch / Department"
                    id="branch"
                    name="branch"
                    type="text"
                    value={formData.branch}
                    onChange={handleInputChange}
                    placeholder="e.g. Computer Science & Engineering"
                  />

                  <Input
                    label="Graduation Year"
                    id="graduationYear"
                    name="graduationYear"
                    type="number"
                    min="2000"
                    max="2100"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    placeholder="e.g. 2026"
                    helperText="Academic completion year (2000 – 2100)."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. Placement Preferences & Target Companies */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader>
                <div>
                  <CardTitle>Target Companies</CardTitle>
                  <CardDescription>
                    Organizations whose placement syllabus and mock evaluations you are actively pursuing.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 tracking-tight mb-2">
                    Active Target Companies ({targetCompanies.length})
                  </label>
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    {targetCompanies.map((company) => (
                      <span
                        key={company}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
                      >
                        <span>{company}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCompany(company)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5"
                          aria-label={`Remove ${company}`}
                        >
                          <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    {targetCompanies.length === 0 && (
                      <span className="text-xs text-slate-400 italic py-1">
                        No target companies specified yet. Select or add organizations below.
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Enter company name..."
                    className="flex-1 h-9 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20 outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCompany();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCompany()}
                    iconLeft={<PlusIcon className="w-4 h-4" />}
                  >
                    Add
                  </Button>
                </div>

                {availableCompanySuggestions.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                      Available Companies from Catalog:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCompanySuggestions.map((suggested) => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => handleAddCompany(suggested)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-[#DCFCE7] hover:text-[#14532D] hover:border-[#BBF7D0] border border-slate-200/80 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                        >
                          + {suggested}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. Preparation Goals */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader>
                <div>
                  <CardTitle>Preparation Milestones</CardTitle>
                  <CardDescription>
                    Custom readiness targets, topic focuses, and milestone objectives.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 tracking-tight mb-2">
                    Defined Milestones ({preparationGoals.length})
                  </label>
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    {preparationGoals.map((goal) => (
                      <span
                        key={goal}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
                      >
                        <span>{goal}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(goal)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5"
                          aria-label={`Remove milestone ${goal}`}
                        >
                          <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    {preparationGoals.length === 0 && (
                      <span className="text-xs text-slate-400 italic py-1">
                        No preparation milestones defined yet. Add custom focus goals below.
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 max-w-lg">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="e.g. Master Graph Algorithms, 80%+ Mock Score..."
                    className="flex-1 h-9 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20 outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddGoal();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddGoal()}
                    iconLeft={<PlusIcon className="w-4 h-4" />}
                  >
                    Add
                  </Button>
                </div>

                {availableGoalSuggestions.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                      Suggested Goals:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableGoalSuggestions.map((suggested) => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => handleAddGoal(suggested)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-[#DCFCE7] hover:text-[#14532D] hover:border-[#BBF7D0] border border-slate-200/80 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                        >
                          + {suggested}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Action Footer */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardFooter className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {isDirty ? (
                    <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved modifications detected in profile form
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <CheckIcon className="w-3.5 h-3.5 text-[#166534]" />
                      All details synchronized with your candidate record
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleReset}
                    disabled={!isDirty || isSubmitting}
                  >
                    Reset
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={isSubmitting}
                    disabled={isSubmitting || !isDirty}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>

          {/* ================= 5. ACCOUNT SECURITY: CHANGE PASSWORD ================= */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Account Security</CardTitle>
                  <Badge variant="neutral">Password Management</Badge>
                </div>
                <CardDescription>
                  Update your authentication password. Passwords are securely hashed with bcrypt before storage.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {passwordSuccess && (
                <div
                  role="status"
                  className="mb-4 p-3 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] text-[#14532D] text-xs font-medium flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-[#166534] shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasswordSuccess("")}
                    className="text-[#14532D] hover:text-[#166534] p-1"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {passwordError && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasswordError("")}
                    className="text-rose-700 hover:text-rose-900 p-1"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                <Input
                  label="Current Password"
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="Enter current password"
                />

                <Input
                  label="New Password (min 8 characters)"
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter new strong password"
                  helperText="Use at least 8 characters. Do not reuse your current password."
                />

                <Input
                  label="Confirm New Password"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Re-enter new password"
                  helperText={
                    passwordMatch ? (
                      <span className="text-[#166534] font-medium flex items-center gap-1">
                        <CheckIcon className="w-3 h-3 text-[#166534]" /> Passwords match
                      </span>
                    ) : passwordMismatch ? (
                      <span className="text-red-600 font-medium">
                        Passwords do not match
                      </span>
                    ) : null
                  }
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={isChangingPassword}
                    disabled={
                      isChangingPassword ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword ||
                      passwordData.newPassword !== passwordData.confirmPassword
                    }
                    iconLeft={<ShieldCheckIcon className="w-4 h-4" />}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

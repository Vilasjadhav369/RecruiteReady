import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { updateProfile } from "../services/authService.js";
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
  ProfileIcon,
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

const SUGGESTED_COMPANIES = [
  "Google",
  "Microsoft",
  "Amazon",
  "TCS",
  "Infosys",
  "Wipro",
  "Accenture",
  "Cognizant",
  "Deloitte",
];

const SUGGESTED_GOALS = [
  "Master Dynamic Programming",
  "Solve 100 Coding Problems",
  "Score 85%+ in Mock Tests",
  "Complete Quantitative Aptitude",
  "Review System Design Fundamentals",
];

/**
 * ProfilePage — Student profile and academic placement settings.
 * Direction: Apple + Linear + Premium University
 */
function ProfilePage() {
  const { user, updateUser, loading: authLoading } = useAuth();

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

  // Sync form state when authenticated user data becomes available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        college: user.college || "",
        branch: user.branch || "",
        graduationYear: user.graduationYear ? String(user.graduationYear) : "",
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
      formData.graduationYear !== initialGrad;

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

  // Calculate profile completion metrics
  const completionDetails = useMemo(() => {
    const checks = [
      { label: "Personal Name", done: Boolean(formData.firstName.trim() && formData.lastName.trim()) },
      { label: "Verified Email", done: Boolean(user?.email) },
      { label: "College / University", done: Boolean(formData.college.trim()) },
      { label: "Branch / Department", done: Boolean(formData.branch.trim()) },
      { label: "Graduation Year", done: Boolean(formData.graduationYear) },
      { label: "Target Companies", done: targetCompanies.length > 0 },
      { label: "Preparation Goals", done: preparationGoals.length > 0 },
    ];
    const completedCount = checks.filter((c) => c.done).length;
    const percentage = Math.round((completedCount / checks.length) * 100);

    return { checks, completedCount, totalCount: checks.length, percentage };
  }, [formData, targetCompanies, preparationGoals, user]);

  const handleChange = (e) => {
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
      });
      setTargetCompanies(user.targetCompanies || []);
      setPreparationGoals(user.preparationGoals || []);
      setErrorMessage("");
      setSuccessMessage("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage("First name and last name are required.");
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
      if (updatedUserData) {
        updateUser(updatedUserData);
      }
      setSuccessMessage("Profile updated successfully. Your candidate record is now up to date.");

      // Clear success notification after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remaining suggestions
  const availableCompanySuggestions = useMemo(() => {
    return SUGGESTED_COMPANIES.filter((c) => !targetCompanies.includes(c));
  }, [targetCompanies]);

  const availableGoalSuggestions = useMemo(() => {
    return SUGGESTED_GOALS.filter((g) => !preparationGoals.includes(g));
  }, [preparationGoals]);

  if (authLoading && !user) {
    return <LoadingState message="Loading student profile..." />;
  }

  const studentFullName = `${formData.firstName || user?.firstName || "Student"} ${formData.lastName || user?.lastName || ""}`.trim();
  const registrationDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Active Candidate";

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Student Profile"
        description="Manage your verified personal details, academic background, and recruitment targets."
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

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer p-1"
            aria-label="Dismiss notification"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-rose-700 hover:text-rose-900 transition-colors cursor-pointer p-1"
            aria-label="Dismiss error"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Overview Sidebar + Right Form Sections */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT SIDEBAR (4 cols) ================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* Overview Identity Card */}
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <Avatar
                    size="xl"
                    name={studentFullName}
                    src={user?.profilePhoto || undefined}
                    className="w-16 h-16 text-lg ring-4 ring-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    {studentFullName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {user?.email || "student@recruiteready.edu"}
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
                      {formData.college || user?.college || "College not yet specified"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-600">
                    <CompanyIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {formData.branch || user?.branch || "Department not yet specified"}
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

            {/* Profile Completion Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Profile Completeness</CardTitle>
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  {completionDetails.percentage}%
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBar
                  value={completionDetails.percentage}
                  max={100}
                  variant={completionDetails.percentage === 100 ? "success" : "primary"}
                  size="md"
                />

                <div className="space-y-2 text-xs">
                  {completionDetails.checks.map((chk) => (
                    <div
                      key={chk.label}
                      className="flex items-center justify-between text-slate-600"
                    >
                      <span className="flex items-center gap-2">
                        {chk.done ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckIcon className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span className={chk.done ? "text-slate-800" : "text-slate-500"}>
                          {chk.label}
                        </span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {chk.done ? "Done" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {completionDetails.percentage === 100
                      ? "Your candidate profile is complete. Campus recruiters have full visibility into your preparation focus."
                      : "Complete all fields to optimize recommendation algorithms for aptitude, coding, and mock assessments."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Verification & Security Note */}
            <Card className="bg-slate-50/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                  <ShieldCheckIcon className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Verified Credentials</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your email address and account permissions are cryptographically verified by the server. Institutional credentials cannot be altered directly to maintain test integrity.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ================= RIGHT MAIN FORM (8 cols) ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Personal Information */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Official identification details for assessment scorecards and certificates.
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
                    onChange={handleChange}
                    placeholder="e.g. Rahul"
                  />

                  <Input
                    label="Last Name"
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Sharma"
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
                    helperText="Institutional email is verified and strictly immutable."
                  />

                  <Input
                    label="Account Role"
                    id="role"
                    name="role"
                    type="text"
                    disabled
                    value={user?.role === "admin" ? "Platform Administrator" : "Student Candidate"}
                    helperText="Designated candidate authorization tier."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Academic Background */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Academic Background</CardTitle>
                  <CardDescription>
                    University and degree information used for company eligibility criteria.
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
                  onChange={handleChange}
                  placeholder="e.g. Pune Institute of Computer Technology"
                  helperText="Full institutional name without abbreviation."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Branch / Department"
                    id="branch"
                    name="branch"
                    type="text"
                    value={formData.branch}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    placeholder="e.g. 2026"
                    helperText="Degree completion year (2000 – 2100)."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. Placement Preferences & Target Companies */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Target Companies</CardTitle>
                  <CardDescription>
                    Organizations whose placement syllabus and interview patterns you are actively targeting.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active company badges */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 tracking-tight mb-2">
                    Active Target Companies ({targetCompanies.length})
                  </label>
                  <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 rounded-lg bg-slate-50 border border-slate-200">
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
                        No target companies specified yet. Add organizations below.
                      </span>
                    )}
                  </div>
                </div>

                {/* Add new company input */}
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Enter company name (e.g. Microsoft)..."
                    className="flex-1 h-9 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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

                {/* Suggestions pill list */}
                {availableCompanySuggestions.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                      Suggested Organizations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCompanySuggestions.map((suggested) => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => handleAddCompany(suggested)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
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
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Preparation Milestones</CardTitle>
                  <CardDescription>
                    Custom readiness goals, topic focus areas, and practice targets.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active goal tags */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 tracking-tight mb-2">
                    Defined Milestones ({preparationGoals.length})
                  </label>
                  <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 rounded-lg bg-slate-50 border border-slate-200">
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
                        No preparation milestones added yet. Set your focus areas below.
                      </span>
                    )}
                  </div>
                </div>

                {/* Add new goal input */}
                <div className="flex gap-2 max-w-lg">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="e.g. Master Graph Algorithms, 80%+ Quantitative..."
                    className="flex-1 h-9 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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

                {/* Suggestions pill list */}
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
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                        >
                          + {suggested}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bottom Actions Card */}
            <Card>
              <CardFooter className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {isDirty ? (
                    <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved changes detected in form
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                      All changes saved to your institutional record
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
          </div>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;

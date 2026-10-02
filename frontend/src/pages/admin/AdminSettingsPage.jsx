import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { updateProfile } from "../../services/authService.js";
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
  StatusBadge,
  Input,
  Avatar,
  Modal,
  Toast,
  Skeleton,
} from "../../components/ui/index.js";
import {
  ProfileIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LogoutIcon,
  InfoIcon,
  CheckIcon,
} from "../../components/ui/Icons.jsx";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { user, updateUser, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ── Form State ──
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    college: "",
    branch: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // ── Toast State ──
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (variant, title, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ variant, title, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  // Sync form when user data loads or changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        college: user.college || "",
        branch: user.branch || "",
      });
      setFormError("");
    }
  }, [user]);

  // Determine if form has modifications
  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      formData.firstName.trim() !== (user.firstName || "").trim() ||
      formData.lastName.trim() !== (user.lastName || "").trim() ||
      formData.college.trim() !== (user.college || "").trim() ||
      formData.branch.trim() !== (user.branch || "").trim()
    );
  }, [formData, user]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
  };

  const handleResetForm = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        college: user.college || "",
        branch: user.branch || "",
      });
    }
    setFormError("");
  };

  // ── Save Profile Details ──
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.firstName.trim()) {
      setFormError("First name is required.");
      return;
    }
    if (!formData.lastName.trim()) {
      setFormError("Last name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        college: formData.college.trim(),
        branch: formData.branch.trim(),
      };

      const updatedUser = await updateProfile(payload);
      if (updatedUser) {
        updateUser(updatedUser);
      }
      showToast(
        "success",
        "Settings Saved",
        "Administrator profile details updated successfully."
      );
    } catch (err) {
      console.error("Save profile error:", err);
      setFormError(
        err.response?.data?.message ||
          "Failed to save profile changes. Please verify fields."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Secure Sign Out ──
  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Administrator"
    : "Administrator";

  // ── Loading Skeleton ──
  if (authLoading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="space-y-2 border-b border-slate-200/80 pb-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main Render ──
  return (
    <div className="space-y-6 pb-16">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] w-80 animate-in fade-in slide-in-from-top-2 duration-200">
          <Toast
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* ── 1. Page Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Settings"
        description="Manage your administrator account credentials, institutional profile, and session security."
        breadcrumbs={[{ label: "Admin Console" }, { label: "Settings" }]}
      />

      {/* ── 2. Administrator Identity Hero Card ─────────────────────── */}
      <Card className="border-slate-200/80 overflow-hidden">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <Avatar name={fullName} size="xl" />
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {fullName}
                  </h2>
                  <Badge variant="primary" size="sm">
                    Administrator
                  </Badge>
                  <StatusBadge status="active" />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-mono">
                  {user?.email || "—"}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                  <span>Registered: {formatDate(user?.createdAt)}</span>
                  <span>•</span>
                  <span>Institutional Authority: Full</span>
                </div>
              </div>
            </div>

            <div className="sm:self-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLogoutModalOpen(true)}
                className="text-slate-700 border-slate-300 hover:bg-slate-50"
                iconLeft={<LogoutIcon className="w-3.5 h-3.5 text-slate-500" />}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Profile Information (Editable Form) ───────────────────── */}
      <Card className="border-slate-200/80">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900">
            Administrator Profile
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Personal identity details and institutional affiliation displayed on administrative reports.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveProfile}>
          <CardContent className="p-6 space-y-5">
            {/* Form Error Banner */}
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                value={formData.firstName}
                onChange={(e) => handleFieldChange("firstName", e.target.value)}
                placeholder="First name"
              />
              <Input
                label="Last Name"
                required
                value={formData.lastName}
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
                placeholder="Last name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institution / University"
                value={formData.college}
                onChange={(e) => handleFieldChange("college", e.target.value)}
                placeholder="e.g. University Training & Placement Cell"
                helperText="Primary campus or organization affiliated with this console."
              />
              <Input
                label="Department / Office"
                value={formData.branch}
                onChange={(e) => handleFieldChange("branch", e.target.value)}
                placeholder="e.g. Directorate of Career Advancement"
                helperText="Departmental unit or academic division."
              />
            </div>
          </CardContent>

          <CardFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {isDirty ? (
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <span>●</span> Unsaved modifications
                </span>
              ) : (
                <span className="text-slate-400">All fields up to date.</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!isDirty || isSubmitting}
                onClick={handleResetForm}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!isDirty || isSubmitting}
                loading={isSubmitting}
                iconLeft={<CheckIcon className="w-3.5 h-3.5" />}
              >
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* ── 4. System Security & Authentication Specifications ──────── */}
      <Card className="border-slate-200/80">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-base font-bold text-slate-900">
              Security & Authentication Specifications
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Cryptographic standards and security configurations active on your administrator account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Primary Account Identifier
              </span>
              <p className="font-mono font-medium text-slate-900 text-xs sm:text-sm">
                {user?.email || "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Verified login identity. Email modifications are restricted to maintain platform audit integrity.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Authorization Scope
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="primary" size="sm">
                  Role: {user?.role || "admin"}
                </Badge>
                <span className="font-semibold text-slate-800">
                  Full Administrative Clearance
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Authorized for live question bank curation, code evaluation oversight, and analytics.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Password Encryption Protocol
              </span>
              <p className="font-medium text-slate-800">
                Bcrypt Cryptographic Hash (12 Salt Rounds)
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Passwords are one-way hashed before database insertion and never stored in plain text.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Session Token Bearer
              </span>
              <p className="font-medium text-slate-800">
                JSON Web Token (JWT) • HMAC-SHA256
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Protected authorization bearer transmitted securely via HTTP authorization headers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Platform Governance & Module Scope ────────────────────── */}
      <Card className="border-slate-200/80">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900">
            Console Permissions & Module Scope
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Active permissions allocated to your administrator account across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Student Accounts", path: "/admin/students", status: "Active" },
              { label: "Aptitude Bank", path: "/admin/aptitude", status: "Active" },
              { label: "Coding Problems", path: "/admin/coding", status: "Active" },
              { label: "Company Tracks", path: "/admin/companies", status: "Active" },
              { label: "Study Materials", path: "/admin/resources", status: "Active" },
              { label: "Mock Assessments", path: "/admin/mock-tests", status: "Active" },
              { label: "Review Moderation", path: "/admin/reviews", status: "Active" },
              { label: "Platform Analytics", path: "/admin/analytics", status: "Active" },
            ].map((mod) => (
              <div
                key={mod.label}
                className="p-3 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {mod.label}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono block truncate">
                  {mod.path}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Session Termination ──────────────────────────────────── */}
      <Card className="border-slate-200/80">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">
            Session Management
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Terminating your session will clear cached authentication credentials from this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Sign out from current device
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely invalidate your local session bearer and return to public portal.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLogoutModalOpen(true)}
            className="text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 self-start sm:self-auto"
            iconLeft={<LogoutIcon className="w-3.5 h-3.5 text-rose-600" />}
          >
            End Administrative Session
          </Button>
        </CardContent>
      </Card>

      {/* ── 7. Administrative Notice Footnote ────────────────────────── */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-3">
        <div className="w-6 h-6 rounded-md bg-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
          <InfoIcon className="w-3.5 h-3.5 text-slate-600" />
        </div>
        <div className="leading-relaxed">
          <strong className="text-slate-800">Administrator Governance Policy:</strong> Changes
          saved to your profile reflect immediately across generated reports and campus assessment
          bulletins. Platform configuration policies are strictly enforced through backend role-based
          access middleware.
        </div>
      </div>

      {/* ─── Logout Confirmation Modal ────────────────────────────────────── */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Sign Out of Admin Console?"
        description="Your active administrative session will be terminated and your authentication token cleared from local storage."
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Stay Signed In
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmLogout}
              iconLeft={<LogoutIcon className="w-3.5 h-3.5" />}
            >
              Confirm Sign Out
            </Button>
          </>
        }
      >
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
          <p>
            Administrator: <strong className="text-slate-900">{fullName}</strong>
          </p>
          <p>
            Email: <strong className="text-slate-900">{user?.email}</strong>
          </p>
        </div>
      </Modal>
    </div>
  );
}

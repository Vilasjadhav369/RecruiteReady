import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
} from "../ui/index.js";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CloseIcon,
  CheckIcon,
  AlertTriangleIcon,
} from "../ui/Icons.jsx";
import {
  changePassword,
  getSessions,
  revokeSession,
  logoutAllSessions,
  resendVerification,
} from "../../services/authService.js";

/**
 * AccountSecurityTab — Dedicated account security, authentication identities,
 * password management, and active sessions manager with accessible confirmation dialogs.
 * 
 * Follows RecruitReady Design System: Apple + Linear + Premium University.
 */
export default function AccountSecurityTab({ user }) {
  // Password Change Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Active Sessions & Email Verification State
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState({ text: "", type: "" });
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Confirmation Dialog State
  // type: 'single' | 'all' | null
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null,
    targetSessionId: null,
    targetSessionDevice: "",
  });

  const cancelBtnRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Fetch active sessions
  const fetchSessions = useCallback(async (isMounted = () => true) => {
    setLoadingSessions(true);
    try {
      const data = await getSessions();
      if (isMounted()) {
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch {
      // Non-blocking session fetch failure
    } finally {
      if (isMounted()) {
        setLoadingSessions(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchSessions(() => active);
    return () => {
      active = false;
    };
  }, [fetchSessions]);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog({
      isOpen: false,
      type: null,
      targetSessionId: null,
      targetSessionDevice: "",
    });
  }, []);

  const openSingleRevokeConfirm = useCallback((session) => {
    setConfirmDialog({
      isOpen: true,
      type: "single",
      targetSessionId: session._id,
      targetSessionDevice: `${session.browser || "Unknown Browser"} on ${session.os || "Unknown OS"}`,
    });
  }, []);

  const openLogoutAllConfirm = useCallback(() => {
    setConfirmDialog({
      isOpen: true,
      type: "all",
      targetSessionId: null,
      targetSessionDevice: "",
    });
  }, []);

  // Dialog Accessibility: Focus management & Escape key handling
  useEffect(() => {
    if (confirmDialog.isOpen) {
      previousActiveElementRef.current = document.activeElement;
      // Focus cancel button for safe keyboard navigation
      setTimeout(() => {
        if (cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          if (!sessionActionLoading) {
            closeConfirmDialog();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    } else if (previousActiveElementRef.current) {
      // Return focus to previously focused element when dialog closes
      if (typeof previousActiveElementRef.current.focus === "function") {
        previousActiveElementRef.current.focus();
      }
      previousActiveElementRef.current = null;
    }
  }, [confirmDialog.isOpen, sessionActionLoading, closeConfirmDialog]);

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
      setPasswordError("New password and confirm password do not match.");
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

  // Execute Revoke Session after confirmation
  const handleConfirmRevoke = async () => {
    if (confirmDialog.type === "single" && confirmDialog.targetSessionId) {
      const sessionId = confirmDialog.targetSessionId;
      setSessionActionLoading(true);
      setSessionMessage({ text: "", type: "" });
      try {
        await revokeSession(sessionId);
        setSessions((prev) => prev.filter((s) => s._id !== sessionId));
        setSessionMessage({ text: "Session revoked successfully.", type: "success" });
        closeConfirmDialog();
      } catch (err) {
        setSessionMessage({
          text: err.response?.data?.message || "Failed to revoke session.",
          type: "error",
        });
        closeConfirmDialog();
      } finally {
        setSessionActionLoading(false);
      }
    } else if (confirmDialog.type === "all") {
      setSessionActionLoading(true);
      setSessionMessage({ text: "", type: "" });
      try {
        await logoutAllSessions();
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        setSessionMessage({
          text: "All other active sessions have been logged out successfully.",
          type: "success",
        });
        closeConfirmDialog();
      } catch (err) {
        setSessionMessage({
          text: err.response?.data?.message || "Failed to log out other devices.",
          type: "error",
        });
        closeConfirmDialog();
      } finally {
        setSessionActionLoading(false);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResendingVerification(true);
    try {
      await resendVerification(user.email);
      setVerificationSent(true);
    } catch {
      // Non-blocking
    } finally {
      setResendingVerification(false);
    }
  };

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
    <>
      <Card className="border-slate-200/90 shadow-xs">
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Account Security & Sessions</CardTitle>
              <Badge variant="neutral">Security Management</Badge>
            </div>
            <CardDescription>
              Manage connected authentication methods, password recovery, and active browser sessions.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Linked Accounts & Email Verification Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Connected Authentication Identities
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-400 text-[11px] mb-1">Email Account</div>
                <div className="font-medium text-slate-900 truncate mb-1.5">
                  {user?.email || "Unknown"}
                </div>
                {user?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertCircleIcon className="w-3 h-3 text-amber-600" /> Pending Verification
                    </span>
                    {verificationSent ? (
                      <span className="text-[11px] text-emerald-600 font-medium">
                        Verification link sent!
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendingVerification}
                        className="text-[11px] text-primary hover:underline font-medium text-left cursor-pointer"
                      >
                        {resendingVerification ? "Sending..." : "Resend Link"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-400 text-[11px] mb-1">Google Identity</div>
                <div className="font-medium text-slate-900 mb-1.5">
                  {user?.googleId ? "Google Connected" : "Not Linked"}
                </div>
                {user?.googleId ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-600" /> Active
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Not linked</span>
                )}
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-400 text-[11px] mb-1">GitHub OAuth</div>
                <div className="font-medium text-slate-900 mb-1.5">
                  {user?.githubId ? "GitHub Connected" : "Not Linked"}
                </div>
                {user?.githubId ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-600" /> Active
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Not linked</span>
                )}
              </div>
            </div>
          </div>

          {/* Password Management */}
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-800 mb-3">
              Change Account Password
            </div>
            {passwordSuccess && (
              <div
                role="status"
                className="mb-4 p-3 rounded-lg bg-primary-soft border border-primary-tint text-primary-dark text-xs font-medium flex items-center justify-between gap-2 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-primary shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordSuccess("")}
                  className="text-primary-dark hover:text-primary p-1 cursor-pointer"
                  aria-label="Dismiss success message"
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
                  className="text-rose-700 hover:text-rose-900 p-1 cursor-pointer"
                  aria-label="Dismiss error message"
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
                    <span className="text-primary font-medium flex items-center gap-1">
                      <CheckIcon className="w-3 h-3 text-primary" /> Passwords match
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
          </div>

          {/* Active Sessions Management */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Active Device Sessions
                </div>
                <div className="text-xs text-slate-500">
                  Devices currently authorized to access your RecruitReady candidate account.
                </div>
              </div>
              {sessions.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openLogoutAllConfirm}
                  loading={sessionActionLoading}
                  disabled={sessionActionLoading}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                >
                  Log Out All Other Devices
                </Button>
              )}
            </div>

            {sessionMessage.text && (
              <div
                role="status"
                className={`mb-4 p-3 rounded-lg text-xs font-medium flex items-center justify-between gap-2 shadow-xs ${
                  sessionMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                <span>{sessionMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setSessionMessage({ text: "", type: "" })}
                  className="p-1 hover:opacity-75 cursor-pointer"
                  aria-label="Dismiss session message"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {loadingSessions ? (
              <div className="text-xs text-slate-400 py-4 italic">Loading active sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 italic">
                Current session active. No auxiliary sessions recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {sessions.map((sess) => (
                  <div
                    key={sess._id}
                    className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      sess.isCurrent
                        ? "bg-primary-soft/40 border-primary-tint"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-md shrink-0 ${
                          sess.isCurrent
                            ? "bg-primary text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        <ShieldCheckIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            {sess.browser} on {sess.os}
                          </span>
                          {sess.isCurrent && (
                            <Badge variant="primary">Current Device</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>IP: {sess.ipAddress}</span>
                          <span>•</span>
                          <span>
                            Last active:{" "}
                            {sess.lastUsedAt
                              ? new Date(sess.lastUsedAt).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Recently"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openSingleRevokeConfirm(sess)}
                        disabled={sessionActionLoading}
                        className="text-xs text-slate-600 hover:text-rose-600 hover:border-rose-300 self-end sm:self-center cursor-pointer"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accessible Revocation Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
        >
          {/* Backdrop Click Dismissal */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => !sessionActionLoading && closeConfirmDialog()}
            aria-hidden="true"
          />

          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 shrink-0">
                <AlertTriangleIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3
                  id="confirm-dialog-title"
                  className="text-sm font-semibold text-slate-900 tracking-tight"
                >
                  {confirmDialog.type === "single"
                    ? "Revoke Device Session?"
                    : "Log Out All Other Devices?"}
                </h3>
                <p
                  id="confirm-dialog-description"
                  className="text-xs text-slate-600 leading-relaxed"
                >
                  {confirmDialog.type === "single" ? (
                    <>
                      Are you sure you want to revoke access for{" "}
                      <span className="font-semibold text-slate-900">
                        {confirmDialog.targetSessionDevice}
                      </span>
                      ? This device will be signed out immediately and will need to log in again.
                    </>
                  ) : (
                    <>
                      Are you sure you want to terminate all other active sessions? All devices
                      except this current browser will be immediately logged out.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                ref={cancelBtnRef}
                type="button"
                variant="outline"
                size="sm"
                onClick={closeConfirmDialog}
                disabled={sessionActionLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                loading={sessionActionLoading}
                disabled={sessionActionLoading}
                onClick={handleConfirmRevoke}
              >
                {confirmDialog.type === "single" ? "Revoke Session" : "Log Out Devices"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

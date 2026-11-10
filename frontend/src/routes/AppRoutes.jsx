import Logo from "../components/common/Logo.jsx";
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { isCodingEnabled } from "../utils/featureFlags.js";
import MainLayout from "../layouts/MainLayout.jsx";
import StudentLayout from "../layouts/StudentLayout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AdminRoute from "../components/AdminRoute.jsx";

// Pages
import HomePage from "../pages/HomePage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage.jsx"));
const VerifyEmailPage = lazy(() => import("../pages/auth/VerifyEmailPage.jsx"));
const PrivacyPage = lazy(() => import("../pages/PrivacyPage.jsx"));
const TermsPage = lazy(() => import("../pages/TermsPage.jsx"));
const ConsentPage = lazy(() => import("../pages/ConsentPage.jsx"));
const AuthCallbackPage = lazy(() => import("../pages/auth/AuthCallbackPage.jsx"));
const DashboardPage = lazy(() => import("../pages/DashboardPage.jsx"));
const ProfilePage = lazy(() => import("../pages/ProfilePage.jsx"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage.jsx"));
const SavedPage = lazy(() => import("../pages/SavedPage.jsx"));
const OnboardingPage = lazy(() => import("../pages/OnboardingPage.jsx"));
import NotFoundPage from "../pages/NotFoundPage.jsx";

// Phase 7 — Aptitude Practice
const AptitudePracticePage = lazy(() => import("../pages/aptitude/AptitudePracticePage.jsx"));
const AptitudeSessionPage = lazy(() => import("../pages/aptitude/AptitudeSessionPage.jsx"));
const AptitudeResultPage = lazy(() => import("../pages/aptitude/AptitudeResultPage.jsx"));
const AptitudeHistoryPage = lazy(() => import("../pages/aptitude/AptitudeHistoryPage.jsx"));

// Phase 8 — Coding Practice
const CodingListPage = lazy(() => import("../pages/coding/CodingListPage.jsx"));
const CodingProblemPage = lazy(() => import("../pages/coding/CodingProblemPage.jsx"));
const CodingHistoryPage = lazy(() => import("../pages/coding/CodingHistoryPage.jsx"));
const CodingSubmissionPage = lazy(() => import("../pages/coding/CodingSubmissionPage.jsx"));

// Phase 9 — Company Preparation
const CompanyListPage = lazy(() => import("../pages/companies/CompanyListPage.jsx"));
const CompanyDetailPage = lazy(() => import("../pages/companies/CompanyDetailPage.jsx"));

// Phase 10 — Study Materials
const ResourceListPage = lazy(() => import("../pages/resources/ResourceListPage.jsx"));
const ResourceDetailPage = lazy(() => import("../pages/resources/ResourceDetailPage.jsx"));

// Phase 11 — Mock Tests
const MockTestListPage = lazy(() => import("../pages/mockTests/MockTestListPage.jsx"));
const MockTestDetailPage = lazy(() => import("../pages/mockTests/MockTestDetailPage.jsx"));
const MockTestSessionPage = lazy(() => import("../pages/mockTests/MockTestSessionPage.jsx"));
const MockTestResultPage = lazy(() => import("../pages/mockTests/MockTestResultPage.jsx"));
const MockTestHistoryPage = lazy(() => import("../pages/mockTests/MockTestHistoryPage.jsx"));

// Phase 12 — Progress & Analytics
const ProgressPage = lazy(() => import("../pages/ProgressPage.jsx"));

// Phase 13 — Reviews & Leaderboard
const ReviewsPage = lazy(() => import("../pages/ReviewsPage.jsx"));
const LeaderboardPage = lazy(() => import("../pages/LeaderboardPage.jsx"));

// Admin Pages & Layout
const AdminLayout = lazy(() => import("../layouts/AdminLayout.jsx"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage.jsx"));
const AdminStudentsPage = lazy(() => import("../pages/admin/AdminStudentsPage.jsx"));
const AdminAptitudePage = lazy(() => import("../pages/admin/AdminAptitudePage.jsx"));
const AdminCodingPage = lazy(() => import("../pages/admin/AdminCodingPage.jsx"));
const AdminCompaniesPage = lazy(() => import("../pages/admin/AdminCompaniesPage.jsx"));
const AdminResourcesPage = lazy(() => import("../pages/admin/AdminResourcesPage.jsx"));
const AdminMockTestsPage = lazy(() => import("../pages/admin/AdminMockTestsPage.jsx"));
const AdminReviewsPage = lazy(() => import("../pages/admin/AdminReviewsPage.jsx"));
const AdminAnalyticsPage = lazy(() => import("../pages/admin/AdminAnalyticsPage.jsx"));
const AdminSettingsPage = lazy(() => import("../pages/admin/AdminSettingsPage.jsx"));
const AdminAuditLogsPage = lazy(() => import("../pages/admin/AdminAuditLogsPage.jsx"));

/**
 * AppRoutes — Central application routing registry.
 * All Phases 1–13 are wired with real page components.
 */
function PageFallback() {
  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 bg-background"
      role="status"
      aria-live="polite"
    >
      <div className="rr-loader-bar" aria-hidden="true" />
      <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-center animate-pulse">
        <Logo variant="symbol" size={38} asLink={false} />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-semibold tracking-wider uppercase text-ink-2">RecruitReady</span>
        <span className="text-[11px] text-ink-3">Preparing placement experience…</span>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      {/* ── Public Layout Routes ───────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      {/* ── OAuth Callback Route ────────────────────────── */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* ── One-Time Student Consent Screen ─────────────────── */}
      <Route
        path="/consent"
        element={
          <ProtectedRoute>
            <ConsentPage />
          </ProtectedRoute>
        }
      />

      {/* ── Student Onboarding Wizard ────────────────────── */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* ── Authenticated Student Dashboard Routes ─────── */}
      <Route
        element={
          <ProtectedRoute>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<ProfilePage defaultTab="security" />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/bookmarks" element={<SavedPage />} />

        {/* Phase 7 — Aptitude Practice */}
        <Route path="/aptitude" element={<AptitudePracticePage />} />
        <Route path="/aptitude/session/:id" element={<AptitudeSessionPage />} />
        <Route path="/aptitude/result/:id" element={<AptitudeResultPage />} />
        <Route path="/aptitude/history" element={<AptitudeHistoryPage />} />

        {/* Phase 8 — Coding Practice */}
        <Route path="/coding" element={<CodingListPage />} />
        <Route path="/coding/problem/:id" element={<CodingProblemPage />} />
        <Route path="/coding/history" element={<CodingHistoryPage />} />
        <Route path="/coding/submission/:id" element={<CodingSubmissionPage />} />

        {/* Phase 9 — Company Preparation */}
        <Route path="/companies" element={<CompanyListPage />} />
        <Route path="/companies/:id" element={<CompanyDetailPage />} />

        {/* Phase 10 — Study Materials */}
        <Route path="/resources" element={<ResourceListPage />} />
        <Route path="/resources/:id" element={<ResourceDetailPage />} />

        {/* Phase 11 — Mock Tests */}
        <Route path="/mock-tests" element={<MockTestListPage />} />
        <Route path="/mock-tests/:id" element={<MockTestDetailPage />} />
        <Route path="/mock-tests/session/:id" element={<MockTestSessionPage />} />
        <Route path="/mock-tests/result/:id" element={<MockTestResultPage />} />
        <Route path="/mock-tests/history" element={<MockTestHistoryPage />} />

        {/* Phase 12 — Progress & Analytics */}
        <Route path="/progress" element={<ProgressPage />} />

        {/* Phase 13 — Reviews & Leaderboard */}
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>

      {/* ── Authenticated Admin Portal Routes ───────────── */}
      <Route
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/students" element={<AdminStudentsPage />} />
        <Route path="/admin/aptitude" element={<AdminAptitudePage />} />
        {isCodingEnabled() ? (
          <Route path="/admin/coding" element={<AdminCodingPage />} />
        ) : (
          <Route path="/admin/coding" element={<Navigate to="/admin" replace />} />
        )}
        <Route path="/admin/companies" element={<AdminCompaniesPage />} />
        <Route path="/admin/resources" element={<AdminResourcesPage />} />
        <Route path="/admin/mock-tests" element={<AdminMockTestsPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
      </Route>

      {/* ── 404 Catch-All ─────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}

export default AppRoutes;

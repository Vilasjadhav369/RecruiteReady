import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import StudentLayout from "../layouts/StudentLayout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AdminRoute from "../components/AdminRoute.jsx";

// Pages
import HomePage from "../pages/HomePage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

// Phase 7 — Aptitude Practice
import AptitudePracticePage from "../pages/aptitude/AptitudePracticePage.jsx";
import AptitudeSessionPage from "../pages/aptitude/AptitudeSessionPage.jsx";
import AptitudeResultPage from "../pages/aptitude/AptitudeResultPage.jsx";
import AptitudeHistoryPage from "../pages/aptitude/AptitudeHistoryPage.jsx";

// Phase 8 — Coding Practice
import CodingListPage from "../pages/coding/CodingListPage.jsx";
import CodingProblemPage from "../pages/coding/CodingProblemPage.jsx";
import CodingHistoryPage from "../pages/coding/CodingHistoryPage.jsx";
import CodingSubmissionPage from "../pages/coding/CodingSubmissionPage.jsx";

// Phase 9 — Company Preparation
import CompanyListPage from "../pages/companies/CompanyListPage.jsx";
import CompanyDetailPage from "../pages/companies/CompanyDetailPage.jsx";

// Phase 10 — Study Materials
import ResourceListPage from "../pages/resources/ResourceListPage.jsx";

// Phase 11 — Mock Tests
import MockTestListPage from "../pages/mockTests/MockTestListPage.jsx";
import MockTestSessionPage from "../pages/mockTests/MockTestSessionPage.jsx";
import MockTestResultPage from "../pages/mockTests/MockTestResultPage.jsx";
import MockTestHistoryPage from "../pages/mockTests/MockTestHistoryPage.jsx";

// Phase 12 — Progress & Analytics
import ProgressPage from "../pages/ProgressPage.jsx";

// Phase 13 — Reviews & Leaderboard
import ReviewsPage from "../pages/ReviewsPage.jsx";
import LeaderboardPage from "../pages/LeaderboardPage.jsx";

// Admin Pages & Layout
import AdminLayout from "../layouts/AdminLayout.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import AdminStudentsPage from "../pages/admin/AdminStudentsPage.jsx";
import AdminAptitudePage from "../pages/admin/AdminAptitudePage.jsx";
import AdminCodingPage from "../pages/admin/AdminCodingPage.jsx";
import AdminCompaniesPage from "../pages/admin/AdminCompaniesPage.jsx";
import AdminResourcesPage from "../pages/admin/AdminResourcesPage.jsx";
import AdminMockTestsPage from "../pages/admin/AdminMockTestsPage.jsx";
import AdminReviewsPage from "../pages/admin/AdminReviewsPage.jsx";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage.jsx";
import AdminPlaceholderPage from "../pages/admin/AdminPlaceholderPage.jsx";

/**
 * AppRoutes — Central application routing registry.
 * All Phases 1–13 are wired with real page components.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ── Public Layout Routes ───────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

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

        {/* Phase 11 — Mock Tests */}
        <Route path="/mock-tests" element={<MockTestListPage />} />
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
        <Route path="/admin/coding" element={<AdminCodingPage />} />
        <Route path="/admin/companies" element={<AdminCompaniesPage />} />
        <Route path="/admin/resources" element={<AdminResourcesPage />} />
        <Route path="/admin/mock-tests" element={<AdminMockTestsPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/settings" element={<AdminPlaceholderPage />} />
      </Route>

      {/* ── 404 Catch-All ─────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;

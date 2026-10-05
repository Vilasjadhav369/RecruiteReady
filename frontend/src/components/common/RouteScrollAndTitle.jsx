import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES = {
  '/': 'RecruitReady — Placement Preparation Portal',
  '/login': 'Sign In — RecruitReady',
  '/register': 'Create Account — RecruitReady',
  '/dashboard': 'Dashboard — RecruitReady',
  '/profile': 'My Profile — RecruitReady',
  '/notifications': 'Notifications — RecruitReady',
  '/aptitude': 'Aptitude Practice — RecruitReady',
  '/aptitude/history': 'Aptitude History — RecruitReady',
  '/coding': 'Coding Practice — RecruitReady',
  '/coding/history': 'Coding History — RecruitReady',
  '/mock-tests': 'Mock Assessments — RecruitReady',
  '/mock-tests/history': 'Mock Assessment History — RecruitReady',
  '/companies': 'Company Preparation — RecruitReady',
  '/resources': 'Study Materials & Cheatsheets — RecruitReady',
  '/progress': 'Progress Analytics — RecruitReady',
  '/reviews': 'Student Feedback & Reviews — RecruitReady',
  '/leaderboard': 'Competitive Leaderboard — RecruitReady',
  '/admin': 'Admin Console — RecruitReady',
  '/admin/students': 'Student Directory — RecruitReady Admin',
  '/admin/aptitude': 'Manage Aptitude — RecruitReady Admin',
  '/admin/coding': 'Manage Coding — RecruitReady Admin',
  '/admin/companies': 'Manage Companies — RecruitReady Admin',
  '/admin/resources': 'Manage Resources — RecruitReady Admin',
  '/admin/mock-tests': 'Manage Mock Tests — RecruitReady Admin',
  '/admin/reviews': 'Review Moderation — RecruitReady Admin',
  '/admin/analytics': 'Platform Analytics — RecruitReady Admin',
  '/admin/settings': 'Platform Settings — RecruitReady Admin',
  '/admin/notifications': 'Admin Notifications — RecruitReady',
};

/**
 * RouteScrollAndTitle — Manages scroll position restoration and browser document title
 * dynamically on every route transition without jarring behavior.
 */
export function RouteScrollAndTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window to top
    window.scrollTo(0, 0);

    // Determine matching title
    let title = ROUTE_TITLES[pathname];

    if (!title) {
      if (pathname.startsWith('/companies/')) {
        title = 'Company Details — RecruitReady';
      } else if (pathname.startsWith('/resources/')) {
        title = 'Study Resource — RecruitReady';
      } else if (pathname.startsWith('/coding/problem/')) {
        title = 'Coding Challenge — RecruitReady';
      } else if (pathname.startsWith('/coding/submission/')) {
        title = 'Submission Details — RecruitReady';
      } else if (pathname.startsWith('/aptitude/session/')) {
        title = 'Aptitude Session — RecruitReady';
      } else if (pathname.startsWith('/aptitude/result/')) {
        title = 'Aptitude Result — RecruitReady';
      } else if (pathname.startsWith('/mock-tests/session/')) {
        title = 'Mock Assessment in Progress — RecruitReady';
      } else if (pathname.startsWith('/mock-tests/result/')) {
        title = 'Assessment Result — RecruitReady';
      } else if (pathname.startsWith('/mock-tests/')) {
        title = 'Assessment Details — RecruitReady';
      } else {
        title = 'RecruitReady — Placement Preparation Portal';
      }
    }

    document.title = title;
  }, [pathname]);

  return null;
}

export default RouteScrollAndTitle;

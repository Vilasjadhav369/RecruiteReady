import React from "react";
import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-xs p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 mb-3">
            Test Version Notice
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Last Updated: November 2026 • Evaluation & Test Version
          </p>
        </div>

        {/* Notice */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs sm:text-sm text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">
            Welcome to the RecruitReady test deployment.
          </p>
          <p>
            These terms govern your participation in evaluating the platform. By creating an account or signing in, you agree to these test terms.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Nature of the Service</h2>
            <p>
              RecruitReady is currently provided on a trial, free-tier hosting basis for evaluation by a small community of candidates and reviewers. Services are provided "AS-IS" and "AS AVAILABLE" without uptime guarantees or service level agreements (SLAs).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Acceptable Use & Academic Integrity</h2>
            <p>
              You agree to use this platform in good faith for personal recruitment preparation:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
              <li>Do not attempt to scrape question banks, reverse engineer APIs, or bypass rate limits.</li>
              <li>Do not submit malicious inputs or attempt cross-account access.</li>
              <li>Practice tests and readiness indices are educational estimates, not hiring guarantees.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Service Modifications & Termination</h2>
            <p>
              We reserve the right to modify questions, disable modules (including coding execution), reset test session data, or terminate test access at any time during this evaluation phase.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Questions & Feedback</h2>
            <p>
              For questions regarding these terms, or to report bugs and feedback, please contact us at{" "}
              <a
                href="mailto:recruitready01@gmail.com"
                className="font-mono font-semibold text-primary hover:underline"
              >
                recruitready01@gmail.com
              </a>.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-slate-200 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <Link to="/" className="text-slate-700 hover:text-slate-900 font-semibold no-underline">
            ← Back to Home
          </Link>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-slate-700 hover:text-slate-900 no-underline">
              Privacy Policy
            </Link>
            <Link to="/register" className="text-slate-700 hover:text-slate-900 no-underline">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

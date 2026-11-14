import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-xs p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 mb-3">
            Test Version Notice
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Last Updated: November 2026 • Evaluation & Test Version
          </p>
        </div>

        {/* Notice */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs sm:text-sm text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">
            This platform is operating as an early test version for a limited group of evaluators.
          </p>
          <p>
            By using RecruitReady during this test deployment, you acknowledge that features, stored data, and test records are hosted on evaluation infrastructure and may be reset or archived prior to general availability.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              During this testing phase, we collect only the minimal data required to test candidate assessment workflows:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
              <li>Account credentials (name, email address, password hash).</li>
              <li>Academic profile details you choose to provide (college, branch, graduation year).</li>
              <li>Assessment activity (answers to practice questions, mock test attempts, scores, and timestamps).</li>
              <li>Basic technical logs (IP address, user-agent, request timings) for security and debugging.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. How Information is Used</h2>
            <p>
              Your information is used solely to provide platform functionality, compute readiness scores, and evaluate candidate usability. We do not sell, rent, or monetize your personal information or test history with any third parties or advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Data Retention & Deletion</h2>
            <p>
              Data created during this test release may be retained for evaluation purposes. You may request account and data removal at any time by contacting us at the address below.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Contact & Inquiries</h2>
            <p>
              If you have any questions or feedback regarding this test version privacy notice, please email us at{" "}
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
            <Link to="/terms" className="text-slate-700 hover:text-slate-900 no-underline">
              Terms of Service
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

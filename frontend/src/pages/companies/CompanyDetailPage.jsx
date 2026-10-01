import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompany } from '../../services/companyService.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  LoadingState,
  ErrorState,
} from '../../components/ui/index.js';
import {
  ChevronLeftIcon,
  ExternalLinkIcon,
  AptitudeIcon,
  CodingIcon,
  DocumentIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  CompanyIcon,
  ClockIcon,
} from '../../components/ui/Icons.jsx';

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCompany(id);
        if (!data) {
          setError('Company preparation profile could not be located.');
        } else {
          setCompany(data);
        }
      } catch (err) {
        console.error('Failed to load company details:', err);
        setError(err.response?.data?.message || 'Failed to load company preparation profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading company recruitment details..." />;
  }

  if (error || !company) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <ErrorState
          title="Company Not Found"
          message={error || 'This hiring track is currently unavailable.'}
          onRetry={() => navigate('/companies')}
        />
      </div>
    );
  }

  const initial = company.name ? company.name.charAt(0).toUpperCase() : 'C';

  const breadcrumbs = [
    { label: 'Student Dashboard', href: '/dashboard' },
    { label: 'Company Preparation', href: '/companies' },
    { label: company.name },
  ];

  const headerActions = (
    <div className="flex items-center gap-2.5 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        iconLeft={<ChevronLeftIcon className="w-4 h-4" />}
        onClick={() => navigate('/companies')}
      >
        All Companies
      </Button>

      {company.website && (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button
            variant="outline"
            size="sm"
            iconLeft={<ExternalLinkIcon className="w-3.5 h-3.5" />}
          >
            Visit Website
          </Button>
        </a>
      )}

      {company.careersUrl && (
        <a
          href={company.careersUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button
            variant="primary"
            size="sm"
            iconRight={<ExternalLinkIcon className="w-3.5 h-3.5" />}
          >
            Careers Portal
          </Button>
        </a>
      )}
    </div>
  );

  return (
    <div className="max-w-[1240px] mx-auto space-y-8">
      {/* Top Banner / Page Header */}
      <PageHeader
        title={company.name}
        description={company.description || 'Target enterprise recruitment syllabus, eligibility cutoffs, and company-specific rounds.'}
        breadcrumbs={breadcrumbs}
        badge={
          <Badge variant="primary" dot>
            {company.industry || 'Technology'}
          </Badge>
        }
        actions={headerActions}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Overview, Selection Process, Topics, Resources */}
        <div className="lg:col-span-2 space-y-6">
          {/* About & Overview Card */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-4">
              {company.logoUrl ? (
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div
                    style={{ display: 'none' }}
                    className="w-full h-full rounded-lg bg-blue-50 text-blue-700 font-bold text-base items-center justify-center"
                  >
                    {initial}
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                  {initial}
                </div>
              )}

              <div>
                <CardTitle className="text-lg">About {company.name}</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Industry: {company.industry || 'Enterprise'}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {company.description || 'No detailed company description provided yet.'}
              </p>
            </CardContent>
          </Card>

          {/* Selection Process Stepper */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">
                  Selection Process & Interview Rounds
                </CardTitle>
                {company.selectionProcess && company.selectionProcess.length > 0 && (
                  <Badge variant="default">
                    {company.selectionProcess.length} {company.selectionProcess.length === 1 ? 'Stage' : 'Stages'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {company.selectionProcess && company.selectionProcess.length > 0 ? (
                <div className="relative space-y-4">
                  {company.selectionProcess.map((round, idx) => {
                    const stepNumber = String(idx + 1).padStart(2, '0');
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-4 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {stepNumber}
                        </div>
                        <div className="pt-0.5">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {round}
                          </h4>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            Round {idx + 1} Assessment Stage
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  Not provided yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Targeted Preparation Topics */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base sm:text-lg">
                Targeted Preparation Syllabus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Aptitude Topics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <AptitudeIcon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Aptitude & Logical Reasoning
                    </h4>
                  </div>
                  {company.aptitudeTopics && company.aptitudeTopics.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/aptitude')}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Practice Aptitude →
                    </Button>
                  )}
                </div>

                {company.aptitudeTopics && company.aptitudeTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {company.aptitudeTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-100 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No company-specific aptitude topics added yet.
                  </p>
                )}
              </div>

              {/* Coding Topics */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CodingIcon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Coding & Algorithms
                    </h4>
                  </div>
                  {company.codingTopics && company.codingTopics.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/coding')}
                      className="text-xs text-emerald-600 hover:text-emerald-700"
                    >
                      Practice Coding →
                    </Button>
                  )}
                </div>

                {company.codingTopics && company.codingTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {company.codingTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs font-medium text-emerald-800"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No company-specific coding topics added yet.
                  </p>
                )}
              </div>

              {/* Technical / Interview Topics */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <DocumentIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Technical & Core CS Concepts
                  </h4>
                </div>

                {company.interviewTopics && company.interviewTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {company.interviewTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No company-specific interview topics added yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resources Section */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base sm:text-lg">
                Preparation Resources & Study Material
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {company.resources && company.resources.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {company.resources.map((res, idx) => (
                    <div
                      key={idx}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <DocumentIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <h5 className="text-sm font-semibold text-slate-800">
                            {res.title}
                          </h5>
                          {res.type && (
                            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                              {res.type}
                            </span>
                          )}
                        </div>
                      </div>

                      {res.url && (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            iconRight={<ExternalLinkIcon className="w-3.5 h-3.5" />}
                          >
                            Open
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No company-specific resources added yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Roles, Eligibility, Quick Actions */}
        <div className="space-y-6">
          {/* Roles Offered */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Roles Offered
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {company.roles && company.roles.length > 0 ? (
                <div className="space-y-2">
                  {company.roles.map((role, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 flex items-center gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      <span className="truncate">{role}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Not provided yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Campus Eligibility */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Campus Eligibility Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {company.eligibility || 'Standard degree requirements apply.'}
              </p>
            </CardContent>
          </Card>

          {/* Quick Practice Actions */}
          <Card className="bg-slate-900 border-slate-900 text-white shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Ready to Practice for {company.name}?
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Solve aptitude tests, data structure problems, and mock assessments configured for campus placements.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  size="sm"
                  onClick={() => navigate('/aptitude')}
                  className="justify-center"
                >
                  Practice Aptitude
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  size="sm"
                  onClick={() => navigate('/coding')}
                  className="justify-center bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
                >
                  Practice Coding
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={() => navigate('/mock-tests')}
                  className="justify-center bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  Take Full Mock Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

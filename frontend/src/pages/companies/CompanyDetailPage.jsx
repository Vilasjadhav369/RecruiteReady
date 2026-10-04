import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCompany, toggleTargetCompany } from '../../services/companyService.js';
import { useAuth } from '../../context/AuthContext.jsx';
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
  BookmarkIcon,
  ClockIcon,
} from '../../components/ui/Icons.jsx';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'CO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);

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

  const handleToggleTarget = async () => {
    if (!company || toggling) return;
    try {
      setToggling(true);
      const res = await toggleTargetCompany(company._id);
      if (res?.user && updateUser) {
        updateUser(res.user);
      }
      setCompany((prev) => (prev ? { ...prev, isTarget: res.isTarget } : prev));
    } catch (err) {
      console.error('Failed to toggle target company:', err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading company recruitment profile..." />;
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

  const initials = getInitials(company.name);
  const isTarget = Boolean(company.isTarget || (user?.targetCompanies || []).includes(company.name));

  const breadcrumbs = [
    { label: 'Student Dashboard', to: '/dashboard' },
    { label: 'Companies', to: '/companies' },
    { label: company.name },
  ];

  const headerActions = (
    <div className="flex items-center gap-2.5 flex-wrap">
      <Link to="/companies">
        <Button
          variant="outline"
          size="sm"
          iconLeft={<ChevronLeftIcon className="w-4 h-4" />}
        >
          All Companies
        </Button>
      </Link>

      {/* Target Toggle Button */}
      <Button
        variant={isTarget ? 'primary' : 'outline'}
        size="sm"
        disabled={toggling}
        loading={toggling}
        iconLeft={<BookmarkIcon className="w-3.5 h-3.5" />}
        onClick={handleToggleTarget}
      >
        {isTarget ? 'Target Company' : 'Add to Targets'}
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
            variant="outline"
            size="sm"
            iconRight={<ExternalLinkIcon className="w-3.5 h-3.5" />}
          >
            Careers Portal
          </Button>
        </a>
      )}
    </div>
  );

  // Combine company-embedded resources with linked study materials
  const allResources = [
    ...(company.resources || []).map((r) => ({
      title: r.title,
      url: r.url,
      type: r.type || 'Link',
    })),
    ...(company.relatedMaterials || []).map((m) => ({
      title: m.title,
      url: m.url || m.fileUrl,
      type: m.type ? m.type.toUpperCase() : 'Material',
    })),
  ];

  return (
    <div className="max-w-[1240px] mx-auto space-y-8">
      {/* ── Page Header ── */}
      <PageHeader
        title={company.name}
        description={company.description || 'Target enterprise recruitment syllabus, eligibility cutoffs, and company-specific rounds.'}
        breadcrumbs={breadcrumbs}
        badge={
          <Badge variant="primary">
            {company.industry || 'Technology'}
          </Badge>
        }
        actions={headerActions}
      />

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols): Overview, Selection Process, Topics, Resources */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center gap-4">
              {company.logoUrl ? (
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
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
                    className="w-full h-full rounded-lg bg-[#DCFCE7] text-brand-dark font-bold text-base items-center justify-center"
                  >
                    {initials}
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-brand-dark font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                  {initials}
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
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">
                  Selection Process & Interview Rounds
                </CardTitle>
                {company.selectionProcess && company.selectionProcess.length > 0 && (
                  <Badge variant="default" size="sm">
                    {company.selectionProcess.length} {company.selectionProcess.length === 1 ? 'Stage' : 'Stages'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {company.selectionProcess && company.selectionProcess.length > 0 ? (
                <div className="space-y-3.5">
                  {company.selectionProcess.map((round, idx) => {
                    const stepNumber = String(idx + 1).padStart(2, '0');
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-brand text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
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
                  Selection process details have not been provided yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Targeted Preparation Syllabus */}
          <Card className="border-slate-200 shadow-xs">
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
                    <div className="w-7 h-7 rounded-lg bg-[#DCFCE7] text-brand-dark flex items-center justify-center shrink-0">
                      <AptitudeIcon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Aptitude & Quantitative Topics
                    </h4>
                  </div>
                  {company.aptitudeTopics && company.aptitudeTopics.length > 0 && (
                    <Link
                      to="/aptitude"
                      className="text-xs font-semibold text-brand hover:text-brand-dark hover:underline"
                    >
                      Practice Aptitude →
                    </Link>
                  )}
                </div>

                {company.aptitudeTopics && company.aptitudeTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {company.aptitudeTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No company-specific aptitude topics listed yet.
                  </p>
                )}
              </div>

              {/* Coding Topics */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#DCFCE7] text-brand-dark flex items-center justify-center shrink-0">
                      <CodingIcon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Coding & Algorithmic Patterns
                    </h4>
                  </div>
                  {company.codingTopics && company.codingTopics.length > 0 && (
                    <Link
                      to="/coding"
                      className="text-xs font-semibold text-brand hover:text-brand-dark hover:underline"
                    >
                      Practice Coding →
                    </Link>
                  )}
                </div>

                {company.codingTopics && company.codingTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {company.codingTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-xs font-medium text-brand-dark"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No company-specific coding topics listed yet.
                  </p>
                )}
              </div>

              {/* Technical / Interview Topics */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
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
                        className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No company-specific interview topics listed yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preparation Resources & Study Material */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base sm:text-lg">
                Preparation Resources & Study Material
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {allResources.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {allResources.map((res, idx) => (
                    <div
                      key={idx}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <DocumentIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <h5 className="text-sm font-semibold text-slate-800 truncate">
                            {res.title}
                          </h5>
                          {res.type && (
                            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
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
                  No company-specific resources uploaded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Target Card, Roles, Eligibility, Practice Actions */}
        <div className="space-y-6">
          {/* Target Company Status Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookmarkIcon className={`w-4 h-4 ${isTarget ? 'text-brand' : 'text-slate-400'}`} />
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Target Company Status
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5">
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTarget
                  ? `${company.name} is saved to your target companies. It is featured on your dashboard and personalized study tracks.`
                  : `Save ${company.name} to your target list to track preparation milestones and prioritize relevant problems.`}
              </p>

              <Button
                variant={isTarget ? 'outline' : 'primary'}
                fullWidth
                size="sm"
                disabled={toggling}
                loading={toggling}
                onClick={handleToggleTarget}
                iconLeft={isTarget ? <CheckCircleIcon className="w-3.5 h-3.5 text-brand" /> : <BookmarkIcon className="w-3.5 h-3.5" />}
              >
                {isTarget ? 'Remove from Targets' : 'Add to Target Companies'}
              </Button>
            </CardContent>
          </Card>

          {/* Roles Offered */}
          <Card className="border-slate-200 shadow-xs">
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
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 flex items-center gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                      <span className="truncate">{role}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Roles information not provided yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Campus Eligibility */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Campus Eligibility Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {company.eligibility || 'Standard degree and CGPA requirements apply.'}
              </p>
            </CardContent>
          </Card>

          {/* Preparation Engines Card */}
          <Card className="bg-slate-900 border-slate-900 text-white shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Prepare for {company.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Solve aptitude tests, data structures problems, and timed mock assessments.
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
                  Take Mock Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getCompanyPreparation,
  updateCompanyProgress,
  checkCompanyEligibility,
  toggleTargetCompany,
} from '../../services/companyService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  ProgressBar,
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
  CheckIcon,
  CompanyIcon,
  BookmarkIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  ClockIcon,
  InfoIcon,
} from '../../components/ui/Icons.jsx';
import BookmarkButton from '../../components/bookmarks/BookmarkButton.jsx';

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

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingTarget, setTogglingTarget] = useState(false);
  const [updatingChecklistKey, setUpdatingChecklistKey] = useState(null);
  const [resourceFilter, setResourceFilter] = useState('all');

  // Interactive eligibility check state
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [customEligibilityResult, setCustomEligibilityResult] = useState(null);

  const fetchPreparationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCompanyPreparation(id);
      setData(res);
    } catch (err) {
      console.error('Failed to load company preparation:', err);
      setError(err.response?.data?.message || 'Failed to load company preparation track.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreparationData();
  }, [id]);

  const {
    company,
    eligibility: initialEligibility,
    roadmap = [],
    sections = {},
    studentProgress = {},
  } = data || {};

  const activeEligibility = customEligibilityResult || initialEligibility;

  // Handler for Start Preparation / Target Toggle
  const handleStartPreparation = async () => {
    if (!company || togglingTarget) return;

    try {
      setTogglingTarget(true);
      // If not yet a target, add it
      if (!studentProgress.isTarget) {
        const res = await toggleTargetCompany(company._id);
        if (res?.user && updateUser) {
          updateUser(res.user);
        }
        setData((prev) =>
          prev
            ? {
                ...prev,
                studentProgress: {
                  ...prev.studentProgress,
                  isTarget: true,
                  hasStartedPreparation: true,
                },
              }
            : prev
        );
      }
      // Smooth scroll to roadmap section
      const roadmapEl = document.getElementById('preparation-roadmap');
      if (roadmapEl) {
        roadmapEl.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to start preparation:', err);
    } finally {
      setTogglingTarget(false);
    }
  };

  const handleToggleTargetDirect = async () => {
    if (!company || togglingTarget) return;
    try {
      setTogglingTarget(true);
      const res = await toggleTargetCompany(company._id);
      if (res?.user && updateUser) {
        updateUser(res.user);
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              studentProgress: {
                ...prev.studentProgress,
                isTarget: res.isTarget,
                hasStartedPreparation: res.isTarget || (prev.studentProgress.completedItems || 0) > 0,
              },
            }
          : prev
      );
    } catch (err) {
      console.error('Failed to toggle target company:', err);
    } finally {
      setTogglingTarget(false);
    }
  };

  // Handler for Checklist item toggling (persisted to CompanyPreparationProgress)
  const handleToggleChecklistItem = async (section, itemKey, currentCompleted) => {
    const key = `${section}::${itemKey}`;
    if (updatingChecklistKey === key) return;

    const nextCompleted = !currentCompleted;

    // Optimistically update UI
    setData((prev) => {
      if (!prev) return prev;
      const secData = prev.sections[section];
      if (!secData) return prev;

      const updatedItems = secData.items.map((it) => {
        const itKey = it.itemKey || it.topic || it.title;
        if (itKey === itemKey) {
          return { ...it, isCompleted: nextCompleted };
        }
        return it;
      });

      const updatedSecCompleted = updatedItems.filter((i) => i.isCompleted).length;

      // Recalculate overall progress
      const allSecs = {
        ...prev.sections,
        [section]: { ...secData, completed: updatedSecCompleted, items: updatedItems },
      };

      const totalItems = Object.values(allSecs).reduce((sum, s) => sum + (s.total || 0), 0);
      const totalComp = Object.values(allSecs).reduce((sum, s) => sum + (s.completed || 0), 0);
      const pct = totalItems > 0 ? Math.round((totalComp / totalItems) * 100) : null;

      return {
        ...prev,
        sections: allSecs,
        studentProgress: {
          ...prev.studentProgress,
          completedItems: totalComp,
          percentage: pct,
          hasStartedPreparation: prev.studentProgress.isTarget || totalComp > 0,
        },
      };
    });

    try {
      setUpdatingChecklistKey(key);
      await updateCompanyProgress(company._id, {
        section,
        itemKey,
        completed: nextCompleted,
      });
    } catch (err) {
      console.error('Failed to persist checklist progress:', err);
      // Revert on error
      fetchPreparationData();
    } finally {
      setUpdatingChecklistKey(null);
    }
  };

  // Run interactive eligibility check
  const handleInteractiveEligibilityCheck = async () => {
    if (!company || checkingEligibility) return;
    try {
      setCheckingEligibility(true);
      const res = await checkCompanyEligibility(company._id);
      setCustomEligibilityResult(res);
    } catch (err) {
      console.error('Failed to check eligibility:', err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  // Filtered resources
  const availableResources = sections?.resources?.items || [];
  const resourceTypes = useMemo(() => {
    const set = new Set();
    availableResources.forEach((r) => {
      if (r.type) set.add(r.type.toLowerCase());
    });
    return Array.from(set);
  }, [availableResources]);

  const filteredResources = useMemo(() => {
    if (resourceFilter === 'all') return availableResources;
    return availableResources.filter((r) => r.type?.toLowerCase() === resourceFilter.toLowerCase());
  }, [availableResources, resourceFilter]);

  if (loading) {
    return <LoadingState message="Loading company recruitment profile & preparation track..." />;
  }

  if (error || !company) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <ErrorState
          title="Company Preparation Track Not Found"
          message={error || 'This enterprise hiring track is currently unavailable.'}
          onRetry={fetchPreparationData}
        />
      </div>
    );
  }

  const initials = getInitials(company.name);
  const isTarget = Boolean(studentProgress?.isTarget);

  const breadcrumbs = [
    { label: 'Student Dashboard', to: '/dashboard' },
    { label: 'Companies', to: '/companies' },
    { label: company.name },
  ];

  const headerActions = (
    <div className="flex items-center gap-2.5 flex-wrap">
      <Button
        to="/companies"
        variant="outline"
        size="sm"
        iconLeft={<ChevronLeftIcon className="w-4 h-4" />}
      >
        All Companies
      </Button>

      <BookmarkButton
        itemType="company"
        itemId={company._id}
        initialBookmarked={studentProgress?.isBookmarked}
        variant="button"
        showLabel
      />

      <Button
        variant={isTarget ? 'outline' : 'primary'}
        size="sm"
        disabled={togglingTarget}
        loading={togglingTarget}
        iconLeft={isTarget ? <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" /> : <BookmarkIcon className="w-3.5 h-3.5" />}
        onClick={handleToggleTargetDirect}
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
            iconRight={<ExternalLinkIcon className="w-3.5 h-3.5" />}
          >
            Official Website
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

      {/* ── Top Hero: Preparation Progress & Quick Actions ── */}
      <Card className="border-slate-200/80 shadow-xs bg-white overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Company Preparation 2.0 Track
              </span>
              {isTarget && (
                <Badge variant="success" dot>
                  Active Target Company
                </Badge>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Structured Preparation for {company.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Verified recruitment roadmap covering core aptitude question sets, coding algorithm patterns, technical interviews, and official preparation links.
            </p>

            <div className="pt-1 flex items-center gap-3 justify-center md:justify-start text-xs text-slate-500 font-mono">
              <span>{studentProgress.completedItems || 0} of {studentProgress.totalTrackableItems || 0} milestones completed</span>
              {studentProgress.percentage !== null && (
                <span className="font-bold text-emerald-700">({studentProgress.percentage}%)</span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              iconRight={<ArrowRightIcon className="w-4 h-4" />}
              onClick={handleStartPreparation}
            >
              {isTarget ? 'Resume Preparation' : 'Start Preparation'}
            </Button>
            <Button
              variant="outline"
              size="md"
              iconLeft={<AcademicCapIcon className="w-4 h-4" />}
              onClick={handleInteractiveEligibilityCheck}
            >
              Check Eligibility
            </Button>
          </div>
        </div>

        {/* Real Progress Bar */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Preparation Progress</span>
            <span className="font-mono text-slate-600 font-bold">
              {studentProgress.percentage !== null ? `${studentProgress.percentage}%` : 'Not Started'}
            </span>
          </div>
          <ProgressBar
            value={studentProgress.percentage || 0}
            max={100}
            variant="success"
            size="md"
          />
        </div>
      </Card>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols): Overview, Eligibility, Selection, Roadmap, Domain Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. About Company Card */}
          <Card id="company-overview" className="border-slate-200/80 shadow-xs">
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
                    className="w-full h-full rounded-lg bg-emerald-50 text-emerald-800 font-bold text-base items-center justify-center"
                  >
                    {initials}
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                  {initials}
                </div>
              )}

              <div>
                <CardTitle className="text-lg">About {company.name}</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Industry: {company.industry || 'Technology'}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {company.description || 'Company information has not been added yet.'}
              </p>
            </CardContent>
          </Card>

          {/* 2. Campus Eligibility & Student Eligibility Check */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5 text-emerald-700" />
                <CardTitle className="text-base sm:text-lg">Campus Eligibility & Cutoffs</CardTitle>
              </div>

              {activeEligibility && (
                <Badge
                  variant={
                    activeEligibility.status === 'likely_eligible'
                      ? 'success'
                      : activeEligibility.status === 'may_not_meet'
                      ? 'danger'
                      : 'neutral'
                  }
                  dot
                >
                  {activeEligibility.statusLabel}
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  General Eligibility Criteria
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {company.eligibility || 'Eligibility information has not been added yet.'}
                </p>
              </div>

              {/* Structured Criteria Breakdown if present */}
              {activeEligibility?.details && activeEligibility.details.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Student Profile Verification Breakdown
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeEligibility.details.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs space-y-1 ${
                          item.met === true
                            ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                            : item.met === false
                            ? 'bg-rose-50/40 border-rose-200 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{item.criterion}</span>
                          {item.met === true ? (
                            <Badge variant="success">Eligible</Badge>
                          ) : item.met === false ? (
                            <Badge variant="danger">Not Met</Badge>
                          ) : (
                            <Badge variant="neutral">Incomplete</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Required: <strong className="text-slate-700">{item.required}</strong>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Your Profile: <strong className="text-slate-700">{item.actual}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
                <InfoIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {activeEligibility?.disclaimer ||
                    'Based on the information currently available. Does not guarantee campus hiring eligibility.'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Selection Process Timeline */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Selection Process & Rounds</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered interview stages verified for {company.name}'s hiring drives.
                </p>
              </div>
              {company.selectionProcess && company.selectionProcess.length > 0 && (
                <Badge variant="primary">
                  {company.selectionProcess.length} {company.selectionProcess.length === 1 ? 'Round' : 'Rounds'}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {company.selectionProcess && company.selectionProcess.length > 0 ? (
                <div className="space-y-3">
                  {company.selectionProcess.map((round, idx) => {
                    const stepNumber = String(idx + 1).padStart(2, '0');
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {stepNumber}
                        </div>
                        <div className="pt-0.5 flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">
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
                  Selection process information has not been added yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 4. Preparation Roadmap */}
          <Card id="preparation-roadmap" className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Preparation Roadmap</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sequential preparation milestones configured from {company.name}'s syllabus.
                </p>
              </div>
              <SparklesIcon className="w-4 h-4 text-emerald-700" />
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {roadmap && roadmap.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-6">
                  {roadmap.map((step) => (
                    <div key={step.id} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          step.isCompleted
                            ? 'bg-emerald-600 border-white text-white'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        {step.isCompleted ? <CheckIcon className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            STEP 0{step.stepNumber}
                          </span>
                          <Badge variant={step.isCompleted ? 'success' : step.status === 'in_progress' ? 'warning' : 'neutral'}>
                            {step.isCompleted ? 'Completed' : step.status === 'in_progress' ? 'In Progress' : 'Pending'}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{step.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>

                        {step.totalCount > 0 && (
                          <div className="pt-1 flex items-center justify-between text-xs text-slate-500 font-mono">
                            <span>
                              {step.completedCount || 0} of {step.totalCount} completed
                            </span>
                            {step.actionUrl && (
                              <Link
                                to={step.actionUrl}
                                className="text-emerald-700 hover:text-emerald-800 font-semibold no-underline hover:underline flex items-center gap-1"
                              >
                                {step.actionLabel} →
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  Roadmap parameters have not been populated yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 5. Aptitude Preparation Topics */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
                  <AptitudeIcon className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Aptitude Preparation</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Topics assessed during online aptitude rounds.
                  </p>
                </div>
              </div>
              <Button to="/aptitude" variant="outline" size="sm">
                Aptitude Bank →
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              {sections?.aptitude?.items && sections.aptitude.items.length > 0 ? (
                <div className="space-y-3">
                  {sections.aptitude.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Interactive Checklist Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem('aptitude', item.topic, item.isCompleted)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                            item.isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                          }`}
                          aria-label={`Toggle completion for ${item.topic}`}
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                        </button>

                        <div className="min-w-0">
                          <span className={`text-sm font-semibold block truncate ${item.isCompleted ? 'text-slate-900 font-bold' : 'text-slate-800'}`}>
                            {item.topic}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {item.verifiedByActivity ? (
                              <span className="text-emerald-700 font-medium">✓ Practiced in sessions</span>
                            ) : (
                              'Ready for practice'
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={item.practiceUrl}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
                        >
                          Practice Topic
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No aptitude topics have been added for this company.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 6. Coding Preparation Topics */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0">
                  <CodingIcon className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Coding Preparation</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Algorithmic and problem-solving patterns tested in technical assessments.
                  </p>
                </div>
              </div>
              <Button to="/coding" variant="outline" size="sm">
                Coding Bank →
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              {sections?.coding?.items && sections.coding.items.length > 0 ? (
                <div className="space-y-3">
                  {sections.coding.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem('coding', item.topic, item.isCompleted)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                            item.isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                          }`}
                          aria-label={`Toggle completion for ${item.topic}`}
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                        </button>

                        <div className="min-w-0">
                          <span className={`text-sm font-semibold block truncate ${item.isCompleted ? 'text-slate-900 font-bold' : 'text-slate-800'}`}>
                            {item.topic}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {item.verifiedByActivity ? (
                              <span className="text-emerald-700 font-medium">✓ Solved problem in topic</span>
                            ) : item.attempted ? (
                              <span className="text-amber-700 font-medium">Attempted in submissions</span>
                            ) : (
                              'Pattern ready'
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={item.practiceUrl}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80 hover:bg-slate-200 transition-colors"
                        >
                          Practice Problems
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No coding topics have been added for this company.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 7. Interview Preparation Topics */}
          <Card id="interview-prep" className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 flex items-center justify-center shrink-0">
                  <DocumentIcon className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Technical & Interview Preparation</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Core computer science subjects and technical discussion concepts.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {sections?.interview?.items && sections.interview.items.length > 0 ? (
                <div className="space-y-3">
                  {sections.interview.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem('interview', item.topic, item.isCompleted)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                            item.isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                          }`}
                          aria-label={`Toggle completion for ${item.topic}`}
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                        </button>

                        <div className="min-w-0">
                          <span className={`text-sm font-semibold block truncate ${item.isCompleted ? 'text-slate-900 font-bold' : 'text-slate-800'}`}>
                            {item.topic}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {item.isCompleted ? 'Marked reviewed' : 'Review core concepts'}
                          </span>
                        </div>
                      </div>

                      <Badge variant={item.isCompleted ? 'success' : 'neutral'}>
                        {item.isCompleted ? 'Prepared' : 'To Review'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No interview topics have been added yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 8. Company Resources & Study Material */}
          <Card id="company-resources" className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Preparation Resources & Materials</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Curated study materials and references for this hiring track.
                </p>
              </div>

              {resourceTypes.length > 1 && (
                <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setResourceFilter('all')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      resourceFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({availableResources.length})
                  </button>
                  {resourceTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setResourceFilter(t)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all capitalize cursor-pointer ${
                        resourceFilter === t
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-6">
              {filteredResources.length > 0 ? (
                <div className="space-y-3">
                  {filteredResources.map((res, idx) => {
                    const itemKey = res.itemKey || res.title || `res_${idx}`;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleChecklistItem('resources', itemKey, res.isCompleted)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                              res.isCompleted
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                            }`}
                            aria-label={`Toggle completion for ${res.title}`}
                          >
                            <CheckIcon className="w-3.5 h-3.5" />
                          </button>

                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-slate-900 block truncate">
                              {res.title}
                            </span>
                            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-mono block">
                              {res.type || 'Link'}
                            </span>
                          </div>
                        </div>

                        {res.url && (
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              iconRight={<ExternalLinkIcon className="w-3.5 h-3.5" />}
                            >
                              Open Resource
                            </Button>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No company resources are available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Progress Summary, Roles, Target Status */}
        <div className="space-y-6">
          {/* Your Progress Summary Card */}
          <Card className="border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-700" />
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Your Preparation Progress
                </CardTitle>
              </div>
              {studentProgress.percentage !== null && (
                <Badge variant="success">{studentProgress.percentage}%</Badge>
              )}
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {studentProgress.totalTrackableItems > 0 ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                      <span>Overall Syllabus Completion</span>
                      <span className="font-mono font-bold text-slate-900">
                        {studentProgress.completedItems || 0} / {studentProgress.totalTrackableItems || 0}
                      </span>
                    </div>
                    <ProgressBar
                      value={studentProgress.percentage || 0}
                      max={100}
                      variant="success"
                      size="md"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Aptitude Topics:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {sections?.aptitude?.completed || 0} / {sections?.aptitude?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Coding Patterns:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {sections?.coding?.completed || 0} / {sections?.coding?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Interview Concepts:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {sections?.interview?.completed || 0} / {sections?.interview?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Official Resources:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {sections?.resources?.completed || 0} / {sections?.resources?.total || 0}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center text-xs text-slate-500">
                  Start preparing to track your progress.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roles Offered Card */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Eligible Roles Offered
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
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
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

          {/* Practice Action Cards */}
          <Card className="bg-slate-900 border-slate-900 text-white shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Practice Engines
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Solve timed tests and coding challenges matching {company.name}'s difficulty.
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
                  Solve Coding
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

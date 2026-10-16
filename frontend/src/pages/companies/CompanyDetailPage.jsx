import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
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
import { Tabs } from '../../components/ui/Tabs.jsx';
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
  MockTestIcon,
} from '../../components/ui/Icons.jsx';
import BookmarkButton from '../../components/bookmarks/BookmarkButton.jsx';
import { recordRecentlyViewed } from "../../lib/recentlyViewed.js";

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'CO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

/**
 * CompanyDetailPage — Compact, Tabbed Company Recruitment & Preparation Track.
 * Phase 1 Information Architecture Refactor:
 * - Single company title & concise description in PageHeader
 * - Single consistent preparation-progress summary strip
 * - URL-addressable tabs: Overview, Roadmap, Practice, Resources (?tab=overview|roadmap|practice|resources)
 * - Meaningful content visible within the first 300px
 * - Preserves 100% of bookmarks, interactive checklist toggles, eligibility engine, and mock tests
 */
export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateUser } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingTarget, setTogglingTarget] = useState(false);
  const [updatingChecklistKey, setUpdatingChecklistKey] = useState(null);
  const [resourceFilter, setResourceFilter] = useState('all');

  // Interactive eligibility check state
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [customEligibilityResult, setCustomEligibilityResult] = useState(null);

  // Active Tab from URL params with fallback to 'overview'
  const validTabs = ['overview', 'roadmap', 'practice', 'resources'];
  const currentTab = validTabs.includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'overview';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

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

  useEffect(() => {
    if (company?.name) recordRecentlyViewed({ type: 'company', id, title: company.name, link: `/companies/${id}` });
  }, [company?.name, id]);

  const activeEligibility = customEligibilityResult || initialEligibility;

  // Handle Start / Resume Preparation
  const handleStartPreparation = async () => {
    if (!company || togglingTarget) return;

    try {
      setTogglingTarget(true);
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
      // Switch to roadmap tab
      handleTabChange('roadmap');
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

  // Checklist item toggle (persisted to CompanyPreparationProgress)
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
      // Switch to overview tab where eligibility card lives
      handleTabChange('overview');
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
    <div className="flex items-center gap-2 flex-wrap">
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
        iconLeft={
          isTarget ? (
            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <BookmarkIcon className="w-3.5 h-3.5" />
          )
        }
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
            Website
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
            Careers
          </Button>
        </a>
      )}
    </div>
  );

  // Calculate total practice items
  const totalPracticeItems =
    (sections?.aptitude?.items?.length || 0) +
    (sections?.coding?.items?.length || 0) +
    (sections?.interview?.items?.length || 0) +
    (sections?.mockTests?.items?.length || 0);

  const navTabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <CompanyIcon className="w-3.5 h-3.5" />,
    },
    {
      id: 'roadmap',
      label: 'Roadmap',
      count: roadmap.length > 0 ? roadmap.length : undefined,
      icon: <SparklesIcon className="w-3.5 h-3.5" />,
    },
    {
      id: 'practice',
      label: 'Practice & Syllabus',
      count: totalPracticeItems > 0 ? totalPracticeItems : undefined,
      icon: <AptitudeIcon className="w-3.5 h-3.5" />,
    },
    {
      id: 'resources',
      label: 'Resources',
      count: availableResources.length > 0 ? availableResources.length : undefined,
      icon: <DocumentIcon className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="max-w-[1240px] mx-auto space-y-4 sm:space-y-5 pb-8">
      {/* 1. Singular Page Header */}
      <PageHeader
        title={company.name}
        description={
          company.description
            ? company.description.length > 140
              ? `${company.description.slice(0, 140)}...`
              : company.description
            : 'Verified recruitment roadmap, eligibility criteria, and company-specific assessment syllabus.'
        }
        breadcrumbs={breadcrumbs}
        badge={
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="primary">{company.industry || 'Technology'}</Badge>
            {isTarget && (
              <Badge variant="success" dot>
                Target Track
              </Badge>
            )}
          </div>
        }
        actions={headerActions}
      />

      {/* 2. Single Consistent Preparation-Progress Summary Strip (fits within first 300px) */}
      <section
        aria-label="Preparation progress summary"
        className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 flex-1 min-w-0 max-w-2xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                Preparation Track Progress
              </span>
              <span className="font-mono text-slate-900 font-bold">
                {studentProgress.completedItems || 0} of {studentProgress.totalTrackableItems || 0}{' '}
                milestones{' '}
                {studentProgress.percentage !== null && (
                  <span className="text-emerald-700">({studentProgress.percentage}%)</span>
                )}
              </span>
            </div>
            <ProgressBar
              value={studentProgress.percentage || 0}
              max={100}
              variant="success"
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <Button
              variant="primary"
              size="sm"
              iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
              onClick={handleStartPreparation}
            >
              {studentProgress.percentage && studentProgress.percentage > 0
                ? 'Resume Preparation'
                : 'Start Preparation'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<AcademicCapIcon className="w-3.5 h-3.5" />}
              onClick={handleInteractiveEligibilityCheck}
              loading={checkingEligibility}
            >
              Check Eligibility
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Accessible, URL-Addressable Tabs */}
      <div className="space-y-4">
        <Tabs
          tabs={navTabs}
          activeTab={currentTab}
          onChange={handleTabChange}
          variant="pill"
        />

        {/* ── TAB 1: OVERVIEW ── */}
        {currentTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            <div className="lg:col-span-2 space-y-5">
              {/* About Company Card */}
              <Card className="border-slate-200/90 shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-3.5">
                  {company.logoUrl ? (
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      <img
                        src={company.logoUrl}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div
                        style={{ display: 'none' }}
                        className="w-full h-full rounded bg-emerald-50 text-emerald-800 font-bold text-xs items-center justify-center"
                      >
                        {initials}
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                  )}

                  <div>
                    <CardTitle className="text-base sm:text-lg">About {company.name}</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Industry: {company.industry || 'Technology'}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {company.description || 'Company recruitment profile is currently being updated.'}
                  </p>
                </CardContent>
              </Card>

              {/* Campus Eligibility & Interactive Student Checker */}
              <Card className="border-slate-200/90 shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="w-4 h-4 text-emerald-700" />
                    <CardTitle className="text-base">Campus Eligibility & Cutoffs</CardTitle>
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

                <CardContent className="p-5 space-y-4">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      General Eligibility Criteria
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {company.eligibility || 'Standard criteria: 60%+ in 10th, 12th & Graduation, no active backlogs.'}
                    </p>
                  </div>

                  {activeEligibility?.details && activeEligibility.details.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-xs font-semibold text-slate-700 block">
                        Candidate Verification Breakdown
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeEligibility.details.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                              item.met === true
                                ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                                : item.met === false
                                ? 'bg-rose-50/40 border-rose-200 text-slate-900'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs">{item.criterion}</span>
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
                              Your Record: <strong className="text-slate-700">{item.actual}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex items-start gap-2 text-xs text-slate-600">
                    <InfoIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px]">
                      {activeEligibility?.disclaimer ||
                        'Calculated against your saved candidate profile. Does not constitute an official campus offer.'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Selection Process Rounds */}
              <Card className="border-slate-200/90 shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Selection Process & Rounds</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sequential assessment stages reported for {company.name}.
                    </p>
                  </div>
                  {company.selectionProcess && company.selectionProcess.length > 0 && (
                    <Badge variant="primary">
                      {company.selectionProcess.length}{' '}
                      {company.selectionProcess.length === 1 ? 'Round' : 'Rounds'}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-5">
                  {company.selectionProcess && company.selectionProcess.length > 0 ? (
                    <div className="space-y-2.5">
                      {company.selectionProcess.map((round, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {String(idx + 1).padStart(2, '0')}
                          </div>
                          <div className="pt-0.5 flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                              {round}
                            </h4>
                            <span className="text-[11px] text-slate-500 mt-0.5 block">
                              Round {idx + 1} Assessment Stage
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2">
                      Selection stages are standard online assessment followed by technical and HR interviews.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar on Overview Tab */}
            <div className="space-y-5">
              {/* Eligible Roles Offered */}
              <Card className="border-slate-200/90 shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Roles Offered
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {company.roles && company.roles.length > 0 ? (
                    <div className="space-y-1.5">
                      {company.roles.map((role, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-800 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                          <span className="truncate">{role}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Graduate Software Engineer, Associate Consultant, System Analyst.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Practice Launcher */}
              <Card className="bg-slate-900 border-slate-900 text-white shadow-xs">
                <CardContent className="p-5 space-y-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-white">Target Preparation Track</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Practice questions modeled after {company.name}'s assessment patterns.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Button
                      variant="primary"
                      fullWidth
                      size="sm"
                      onClick={() => handleTabChange('practice')}
                      className="justify-center"
                    >
                      View Practice & Syllabus
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      size="sm"
                      onClick={() => handleTabChange('roadmap')}
                      className="justify-center bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
                    >
                      View Preparation Roadmap
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── TAB 2: ROADMAP ── */}
        {currentTab === 'roadmap' && (
          <Card className="border-slate-200/90 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Preparation Roadmap</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Step-by-step milestones customized for {company.name}'s hiring track.
                </p>
              </div>
              <SparklesIcon className="w-4 h-4 text-emerald-700" />
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              {roadmap && roadmap.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-5">
                  {roadmap.map((step) => (
                    <div key={step.id} className="relative group">
                      <div
                        className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          step.isCompleted
                            ? 'bg-emerald-600 border-white text-white'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        {step.isCompleted ? (
                          <CheckIcon className="w-3 h-3" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            STEP 0{step.stepNumber}
                          </span>
                          <Badge
                            variant={
                              step.isCompleted
                                ? 'success'
                                : step.status === 'in_progress'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {step.isCompleted
                              ? 'Completed'
                              : step.status === 'in_progress'
                              ? 'In Progress'
                              : 'Pending'}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{step.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>

                        {step.totalCount > 0 && (
                          <div className="pt-1 text-xs text-slate-500 font-mono">
                            <span>
                              {step.completedCount || 0} of {step.totalCount} completed
                            </span>
                          </div>
                        )}

                        {step.actionUrl && (
                          <div className="pt-1 flex items-center justify-end">
                            <Button
                              onClick={() => {
                                if (step.actionUrl.includes('mock')) handleTabChange('practice');
                                else if (step.actionUrl.includes('resource')) handleTabChange('resources');
                                else if (step.actionUrl.startsWith('/')) navigate(step.actionUrl);
                                else handleTabChange('practice');
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs font-semibold text-emerald-700"
                            >
                              {step.actionLabel || 'Go to module'} →
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Roadmap steps are currently being compiled for this recruitment cycle.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── TAB 3: PRACTICE & SYLLABUS ── */}
        {currentTab === 'practice' && (
          <div className="space-y-5">
            {/* 1. Company Mock Assessments */}
            <Card className="border-slate-200/90 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
                    <MockTestIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Company Mock Assessments</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Timed full-length assessments modeled after {company.name}'s recruitment pattern.
                    </p>
                  </div>
                </div>
                {sections?.mockTests?.total > 0 && (
                  <Badge
                    variant={
                      sections.mockTests.completed === sections.mockTests.total ? 'success' : 'default'
                    }
                    size="sm"
                  >
                    {sections.mockTests.completed} / {sections.mockTests.total} Completed
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="p-5">
                {sections?.mockTests?.items && sections.mockTests.items.length > 0 ? (
                  <div className="space-y-3">
                    {sections.mockTests.items.map((test) => {
                      const isSubmitted = test.attemptStatus === 'submitted';
                      const isInProgress = test.attemptStatus === 'in_progress';

                      return (
                        <div
                          key={test._id}
                          className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {test.title}
                              </span>
                              <Badge
                                variant={
                                  test.difficulty === 'easy'
                                    ? 'success'
                                    : test.difficulty === 'hard'
                                    ? 'danger'
                                    : 'warning'
                                }
                                size="sm"
                              >
                                {test.difficulty}
                              </Badge>
                              {isSubmitted && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                                  Submitted ({test.percentage}%)
                                </span>
                              )}
                              {isInProgress && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  In Progress
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              <span className="inline-flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                                {test.durationMinutes} mins
                              </span>
                              <span>•</span>
                              <span>{test.totalQuestions} Questions</span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <Button
                              to={`/mock-tests/${test._id}`}
                              variant={isSubmitted ? 'outline' : 'primary'}
                              size="sm"
                              className="font-semibold"
                            >
                              {isSubmitted ? 'Retake Test' : isInProgress ? 'Resume Test' : 'Start Test'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      No company-specific mock tests published for {company.name} yet.
                    </p>
                    <Button to="/mock-tests" variant="outline" size="sm">
                      Explore Platform Mock Tests
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Aptitude Preparation Checklist */}
            <Card className="border-slate-200/90 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
                    <AptitudeIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Aptitude Preparation Syllabus</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Topics assessed during online aptitude rounds. Click checkbox to track completion.
                    </p>
                  </div>
                </div>
                <Button to="/aptitude" variant="outline" size="sm">
                  Aptitude Bank →
                </Button>
              </CardHeader>

              <CardContent className="p-5">
                {sections?.aptitude?.items && sections.aptitude.items.length > 0 ? (
                  <div className="space-y-2.5">
                    {sections.aptitude.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleChecklistItem('aptitude', item.topic, item.isCompleted)
                            }
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
                            <span
                              className={`text-xs sm:text-sm font-semibold block truncate ${
                                item.isCompleted ? 'text-slate-900 font-bold' : 'text-slate-800'
                              }`}
                            >
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

                        <Link
                          to={item.practiceUrl}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-colors shrink-0 no-underline"
                        >
                          Practice
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">
                    No aptitude topics have been listed for this company.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 3. Coding Preparation Checklist */}
            <Card className="border-slate-200/90 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0">
                    <CodingIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Coding Preparation Syllabus</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Algorithmic patterns tested in technical interviews and online rounds.
                    </p>
                  </div>
                </div>
                <Button to="/coding" variant="outline" size="sm">
                  Coding Bank →
                </Button>
              </CardHeader>

              <CardContent className="p-5">
                {sections?.coding?.items && sections.coding.items.length > 0 ? (
                  <div className="space-y-2.5">
                    {sections.coding.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleChecklistItem('coding', item.topic, item.isCompleted)
                            }
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
                            <span
                              className={`text-xs sm:text-sm font-semibold block truncate ${
                                item.isCompleted ? 'text-slate-900 font-bold' : 'text-slate-800'
                              }`}
                            >
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

                        <Link
                          to={item.practiceUrl}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80 hover:bg-slate-200 transition-colors shrink-0 no-underline"
                        >
                          Practice
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">
                    No coding patterns listed for this company.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 4. Interview Preparation Checklist */}
            <Card className="border-slate-200/90 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 flex items-center justify-center shrink-0">
                    <DocumentIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Technical Interview Topics</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Core computer science subjects and technical discussion concepts.
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {sections?.interview?.items && sections.interview.items.length > 0 ? (
                  <div className="space-y-2.5">
                    {sections.interview.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleChecklistItem('interview', item.topic, item.isCompleted)
                            }
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
                            <span
                              className={`text-xs sm:text-sm font-semibold block truncate ${
                                item.isCompleted ? 'text-slate-900 font-bold' : 'text-slate-800'
                              }`}
                            >
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
                    Interview topics list is being curated.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── TAB 4: RESOURCES ── */}
        {currentTab === 'resources' && (
          <Card className="border-slate-200/90 shadow-xs">
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

            <CardContent className="p-5">
              {filteredResources.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredResources.map((res, idx) => {
                    const itemKey = res.itemKey || res.title || `res_${idx}`;
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleChecklistItem('resources', itemKey, res.isCompleted)
                            }
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
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
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
                            className="inline-flex shrink-0 no-underline"
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
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  No company resources are available under this filter yet.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

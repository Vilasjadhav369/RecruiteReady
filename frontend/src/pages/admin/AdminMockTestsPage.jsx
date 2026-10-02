import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getAdminMockTests,
  createMockTest,
  getAdminMockTestById,
  updateMockTest,
  updateMockTestStatus,
  getAdminAptitudeQuestions,
} from '../../services/adminService.js';
import {
  PageHeader,
  Badge,
  StatusBadge,
  Button,
  SearchInput,
  Select,
  Input,
  Textarea,
  Modal,
  Toast,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  ErrorState,
  SkeletonTableRow,
} from '../../components/ui/index.js';
import {
  MockTestIcon,
  PlusIcon,
  EditIcon,
  EyeIcon,
  ClockIcon,
  DocumentIcon,
  CheckCircleIcon,
  CheckIcon,
  SearchIcon,
} from '../../components/ui/Icons.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published Only' },
  { value: 'draft', label: 'Drafts Only' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'all', label: 'Mixed / All Levels' },
];

const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  durationMinutes: 60,
  difficulty: 'medium',
  categories: 'Quantitative Aptitude, Logical Reasoning, Verbal Ability',
  instructions:
    'Read each question carefully before answering. Each question carries marks as indicated. Submit before the timer expires.',
  isPublished: true,
  questions: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'object') return Number(val.total ?? val.count ?? 0) || 0;
  return Number(val) || 0;
};

const getDifficultyVariant = (d) => {
  if (d === 'easy') return 'success';
  if (d === 'medium') return 'warning';
  if (d === 'hard') return 'danger';
  return 'default';
};

const getDifficultyLabel = (d) => {
  if (d === 'all') return 'Mixed';
  if (!d) return 'Medium';
  return d.charAt(0).toUpperCase() + d.slice(1);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminMockTestsPage() {
  // ── Data State ──
  const [tests, setTests] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Search & Filter State ──
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const searchTimerRef = useRef(null);

  // ── Modal States ──
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── View Detail Modal ──
  const [viewTest, setViewTest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // ── Status Toggle Confirmation ──
  const [toggleTarget, setToggleTarget] = useState(null);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // ── Question Bank Integration for Assessment Composition ──
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);

  // ── Toast State ──
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (variant, title, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ variant, title, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  // ── Debounced Search ──
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  // ── Fetch Mock Tests ──
  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: pagination.page, limit: pagination.limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await getAdminMockTests(params);
      setTests(data?.mockTests || []);
      setPagination(
        data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
      );
    } catch (err) {
      console.error('Fetch mock tests error:', err);
      setError(
        err.response?.data?.message || 'Failed to load mock assessments.'
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // ── Fetch Available Questions for Selection ──
  const loadQuestionBank = useCallback(async () => {
    if (availableQuestions.length > 0) return;
    try {
      setLoadingQuestions(true);
      const data = await getAdminAptitudeQuestions({ limit: 100, status: 'active' });
      setAvailableQuestions(data?.questions || []);
    } catch (err) {
      console.error('Failed to load aptitude questions for test builder:', err);
    } finally {
      setLoadingQuestions(false);
    }
  }, [availableQuestions.length]);

  // ── Client-side Filter for loaded items (handles backend filtering limitation gracefully) ──
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      // Status filter
      if (statusFilter === 'published' && !test.isPublished) return false;
      if (statusFilter === 'draft' && test.isPublished) return false;

      // Search filter (title or description)
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase().trim();
        const titleMatch = (test.title || '').toLowerCase().includes(query);
        const descMatch = (test.description || '').toLowerCase().includes(query);
        const catMatch = (test.categories || []).some((c) =>
          c.toLowerCase().includes(query)
        );
        if (!titleMatch && !descMatch && !catMatch) return false;
      }
      return true;
    });
  }, [tests, statusFilter, debouncedSearch]);

  const hasActiveFilters = debouncedSearch || statusFilter !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // ── Form Field Updater ──
  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── Open Create Modal ──
  const handleOpenAdd = () => {
    setEditingTest(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setShowQuestionPicker(false);
    setQuestionSearch('');
    setIsFormModalOpen(true);
    loadQuestionBank();
  };

  // ── Open Edit Modal ──
  const handleOpenEdit = async (test) => {
    setEditingTest(test);
    loadQuestionBank();
    setShowQuestionPicker(false);
    setQuestionSearch('');

    // Prepopulate with base data
    setFormData({
      title: test.title || '',
      description: test.description || '',
      durationMinutes: test.durationMinutes || 60,
      difficulty: test.difficulty || 'medium',
      categories: (test.categories || []).join(', '),
      instructions: test.instructions || '',
      isPublished: test.isPublished ?? true,
      questions: test.questions || [],
    });
    setFormError(null);
    setIsFormModalOpen(true);

    // Fetch full details if needed
    try {
      const full = await getAdminMockTestById(test._id);
      if (full && full.questions) {
        setFormData((prev) => ({
          ...prev,
          questions: full.questions || [],
        }));
      }
    } catch (err) {
      console.error('Failed to load full test details for edit:', err);
    }
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingTest(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setShowQuestionPicker(false);
  };

  // ── Open View Details Modal ──
  const handleOpenViewModal = async (test) => {
    setIsViewModalOpen(true);
    setViewTest(test);
    try {
      const full = await getAdminMockTestById(test._id);
      if (full) setViewTest(full);
    } catch (err) {
      console.error('Failed to load full mock test detail:', err);
    }
  };

  // ── Toggle Question Selection in Form ──
  const handleToggleQuestion = (q) => {
    setFormData((prev) => {
      const existingIndex = prev.questions.findIndex(
        (item) => String(item.questionId) === String(q._id)
      );
      if (existingIndex >= 0) {
        // Remove question
        return {
          ...prev,
          questions: prev.questions.filter((_, i) => i !== existingIndex),
        };
      } else {
        // Add question
        const newEntry = {
          questionType: 'aptitude',
          questionId: q._id,
          questionTypeRef: 'AptitudeQuestion',
          marks: q.marks || 1,
        };
        return {
          ...prev,
          questions: [...prev.questions, newEntry],
        };
      }
    });
  };

  // ── Form Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Test title is required.');
      return;
    }
    const duration = Number(formData.durationMinutes);
    if (!duration || duration < 1) {
      setFormError('Duration must be at least 1 minute.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      durationMinutes: duration,
      difficulty: formData.difficulty,
      categories: formData.categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      instructions: formData.instructions.trim(),
      isPublished: formData.isPublished,
      questions: formData.questions,
    };

    try {
      setFormSubmitting(true);
      if (editingTest) {
        await updateMockTest(editingTest._id, payload);
        showToast('success', 'Mock Test Updated', 'Assessment updated successfully.');
      } else {
        await createMockTest(payload);
        showToast('success', 'Mock Test Created', 'New assessment published successfully.');
      }
      handleCloseFormModal();
      fetchTests();
    } catch (err) {
      console.error('Save mock test error:', err);
      setFormError(
        err.response?.data?.message || 'Failed to save mock test. Please check all fields.'
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Status Toggle Confirmation ──
  const handleRequestToggle = (test) => {
    setToggleTarget(test);
    setIsToggleModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const test = toggleTarget;
    try {
      setTogglingId(test._id);
      setIsToggleModalOpen(false);
      const newStatus = !test.isPublished;
      const updated = await updateMockTestStatus(test._id, newStatus);
      setTests((prev) =>
        prev.map((t) =>
          t._id === test._id
            ? { ...t, isPublished: updated?.isPublished ?? newStatus }
            : t
        )
      );
      showToast(
        'success',
        'Status Updated',
        `"${test.title}" is now ${newStatus ? 'Published' : 'Draft'}.`
      );
    } catch (err) {
      console.error('Toggle mock test status error:', err);
      showToast('error', 'Update Failed', 'Failed to update test status. Please try again.');
    } finally {
      setTogglingId(null);
      setToggleTarget(null);
    }
  };

  // ── Pagination Calculation ──
  const paginationStart =
    safeNumber(pagination.total) > 0
      ? (pagination.page - 1) * pagination.limit + 1
      : 0;
  const paginationEnd = Math.min(
    pagination.page * pagination.limit,
    safeNumber(pagination.total)
  );

  // ── Filtered Questions in Question Picker ──
  const filteredPickerQuestions = useMemo(() => {
    if (!questionSearch.trim()) return availableQuestions;
    const q = questionSearch.toLowerCase();
    return availableQuestions.filter(
      (item) =>
        (item.question || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.topic || '').toLowerCase().includes(q)
    );
  }, [availableQuestions, questionSearch]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] w-80 animate-in fade-in slide-in-from-top-2 duration-200">
          <Toast
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* ── Page Header ── */}
      <PageHeader
        title="Mock Tests"
        description="Create and manage placement mock assessments."
        badge={
          !loading && (
            <Badge variant="primary" size="sm">
              {safeNumber(pagination.total)} Assessments
            </Badge>
          )
        }
        actions={
          <Button
            variant="primary"
            size="md"
            iconLeft={<PlusIcon className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Create Mock Test
          </Button>
        }
      />

      {/* ── Filters Toolbar ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search mock tests by title, description, or category…"
            />
          </div>
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              options={STATUS_FILTER_OPTIONS}
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Filters active — showing matching assessments
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead className="text-center">Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} cols={7} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to Load Mock Tests"
          message={error}
          onRetry={fetchTests}
        />
      ) : filteredTests.length === 0 ? (
        <EmptyState
          icon={<MockTestIcon className="w-8 h-8" />}
          title={
            hasActiveFilters
              ? 'No mock tests match your search'
              : 'No mock tests created yet'
          }
          description={
            hasActiveFilters
              ? 'Try adjusting your search query or status filter, or create a new assessment.'
              : 'The mock assessment catalog is currently empty. Create the first mock test to get started.'
          }
          action={
            hasActiveFilters ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={<PlusIcon className="w-3.5 h-3.5" />}
                  onClick={handleOpenAdd}
                >
                  Create Mock Test
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<PlusIcon className="w-3.5 h-3.5" />}
                onClick={handleOpenAdd}
              >
                Create First Mock Test
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="hidden md:block bg-white border border-slate-200/80 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[240px]">Test</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="min-w-[180px]">Categories</TableHead>
                    <TableHead className="text-center">Questions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.map((test) => {
                    const qCount =
                      test.questions?.length ?? test.totalQuestions ?? 0;
                    return (
                      <TableRow key={test._id}>
                        {/* Title & Description */}
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm font-semibold text-slate-900 leading-snug">
                              {test.title || '—'}
                            </p>
                            {test.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {test.description}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Duration */}
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{test.durationMinutes || 0} min</span>
                          </span>
                        </TableCell>

                        {/* Difficulty */}
                        <TableCell>
                          <Badge
                            variant={getDifficultyVariant(test.difficulty)}
                            size="sm"
                          >
                            {getDifficultyLabel(test.difficulty)}
                          </Badge>
                        </TableCell>

                        {/* Categories */}
                        <TableCell>
                          {test.categories && test.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {test.categories.slice(0, 2).map((cat, idx) => (
                                <Badge key={idx} variant="default" size="sm">
                                  {cat}
                                </Badge>
                              ))}
                              {test.categories.length > 2 && (
                                <span className="text-[11px] text-slate-400 self-center">
                                  +{test.categories.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>

                        {/* Questions count */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800">
                            <DocumentIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{qCount}</span>
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge
                            status={test.isPublished ? 'published' : 'draft'}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenViewModal(test)}
                              title="View details"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(test)}
                              title="Edit test"
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={togglingId === test._id}
                              onClick={() => handleRequestToggle(test)}
                              className={
                                test.isPublished
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }
                            >
                              {test.isPublished ? 'Unpublish' : 'Publish'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Row */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {paginationStart}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700">
                  {paginationEnd}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                  {safeNumber(pagination.total)}
                </span>{' '}
                mock tests
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-600 font-medium px-2">
                  Page {pagination.page} of {pagination.pages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= (pagination.pages || 1)}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* ── Mobile Cards Layout ── */}
          <div className="md:hidden space-y-3">
            {filteredTests.map((test) => {
              const qCount =
                test.questions?.length ?? test.totalQuestions ?? 0;
              return (
                <div
                  key={test._id}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3"
                >
                  {/* Top: Difficulty + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={getDifficultyVariant(test.difficulty)}
                      size="sm"
                    >
                      {getDifficultyLabel(test.difficulty)}
                    </Badge>
                    <StatusBadge
                      status={test.isPublished ? 'published' : 'draft'}
                    />
                  </div>

                  {/* Title & Description */}
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {test.title || '—'}
                    </p>
                    {test.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {test.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                      {test.durationMinutes || 0} min
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <DocumentIcon className="w-3.5 h-3.5 text-slate-400" />
                      {qCount} Questions
                    </span>
                  </div>

                  {/* Categories */}
                  {test.categories && test.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {test.categories.map((cat, idx) => (
                        <Badge key={idx} variant="default" size="sm">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenViewModal(test)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEdit(test)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 ${
                        test.isPublished
                          ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                          : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                      }`}
                      loading={togglingId === test._id}
                      onClick={() => handleRequestToggle(test)}
                    >
                      {test.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Mobile Pagination */}
            <div className="flex items-center justify-between py-2">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.pages || 1}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= (pagination.pages || 1)}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Create / Edit Mock Test Modal ─────────────────────────────────── */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={editingTest ? 'Edit Mock Assessment' : 'Create New Mock Test'}
        description="Configure assessment title, duration, pattern, instructions, and assign questions."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={handleCloseFormModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={formSubmitting}
              onClick={handleSubmit}
            >
              {editingTest ? 'Save Changes' : 'Create Mock Test'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Form Error Message */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {formError}
            </div>
          )}

          {/* ── Section: Basic Information ── */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Assessment Specifications
            </h4>
            <Input
              label="Test Title"
              required
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. TCS NQT Full Placement Assessment — Set 1"
            />
            <Textarea
              label="Description"
              rows={2}
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief summary of syllabus, target rounds, or placement pattern…"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Duration (minutes)"
                required
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={(e) => updateField('durationMinutes', e.target.value)}
                placeholder="60"
                helperText="Total time allowed for completion."
              />
              <Select
                label="Difficulty Level"
                value={formData.difficulty}
                onChange={(e) => updateField('difficulty', e.target.value)}
                options={DIFFICULTY_OPTIONS}
              />
            </div>

            <Input
              label="Categories Covered (comma-separated)"
              value={formData.categories}
              onChange={(e) => updateField('categories', e.target.value)}
              placeholder="Quantitative Aptitude, Logical Reasoning, Verbal Ability"
              helperText="Topics or sections included in this mock test."
            />
          </div>

          {/* ── Section: Instructions ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
              Test Instructions
            </h4>
            <Textarea
              label="Student Instructions"
              rows={3}
              value={formData.instructions}
              onChange={(e) => updateField('instructions', e.target.value)}
              placeholder="Assessment rules, marking scheme, and guidelines for students…"
            />
          </div>

          {/* ── Section: Question Association ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
                  Question Bank Association
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formData.questions.length} questions currently assigned to this test.
                </p>
              </div>
              <Button
                type="button"
                variant={showQuestionPicker ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowQuestionPicker(!showQuestionPicker)}
              >
                {showQuestionPicker ? 'Done Selecting' : 'Select Questions'}
              </Button>
            </div>

            {/* Question Selector Drawer / Panel */}
            {showQuestionPicker && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-2">
                <div className="relative">
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="Search available questions by text, category, or topic…"
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                {loadingQuestions ? (
                  <div className="text-center py-4 text-xs text-slate-500">
                    Loading questions from Question Bank…
                  </div>
                ) : filteredPickerQuestions.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500">
                    No active questions found matching search.
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-200/60 pr-1">
                    {filteredPickerQuestions.map((q) => {
                      const isSelected = formData.questions.some(
                        (item) => String(item.questionId) === String(q._id)
                      );
                      return (
                        <div
                          key={q._id}
                          onClick={() => handleToggleQuestion(q)}
                          className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition text-xs ${
                            isSelected
                              ? 'bg-blue-50/80 border border-blue-200/80'
                              : 'hover:bg-slate-100/70'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent onClick
                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 line-clamp-2">
                              {q.question}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span className="font-medium text-slate-700">
                                {q.category}
                              </span>
                              <span>•</span>
                              <span>{q.topic}</span>
                              <span>•</span>
                              <Badge
                                variant={getDifficultyVariant(q.difficulty)}
                                size="sm"
                              >
                                {q.difficulty}
                              </Badge>
                              <span>•</span>
                              <span>{q.marks || 1} mark(s)</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Section: Publish Status ── */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="testPublished"
                checked={formData.isPublished}
                onChange={(e) => updateField('isPublished', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <label
                htmlFor="testPublished"
                className="text-xs font-medium text-slate-700 cursor-pointer select-none"
              >
                Publish immediately (active and visible to students in mock test catalog)
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── View Mock Test Details Modal ─────────────────────────────────── */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewTest(null);
        }}
        title={viewTest?.title || 'Mock Assessment Details'}
        description={
          viewTest
            ? `${getDifficultyLabel(viewTest.difficulty)} • ${viewTest.durationMinutes || 0} Minutes`
            : ''
        }
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsViewModalOpen(false);
                setViewTest(null);
              }}
            >
              Close
            </Button>
            {viewTest && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<EditIcon className="w-3.5 h-3.5" />}
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEdit(viewTest);
                }}
              >
                Edit Assessment
              </Button>
            )}
          </>
        }
      >
        {viewTest && (
          <div className="space-y-5">
            {/* Meta badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={viewTest.isPublished ? 'published' : 'draft'}
              />
              <Badge
                variant={getDifficultyVariant(viewTest.difficulty)}
                size="sm"
              >
                {getDifficultyLabel(viewTest.difficulty)}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                {viewTest.durationMinutes || 0} minutes
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                <DocumentIcon className="w-3.5 h-3.5 text-slate-400" />
                {viewTest.questions?.length ?? viewTest.totalQuestions ?? 0} Questions
              </span>
            </div>

            {/* Description */}
            {viewTest.description && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </h5>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {viewTest.description}
                </p>
              </div>
            )}

            {/* Instructions */}
            {viewTest.instructions && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Instructions for Students
                </h5>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
                  {viewTest.instructions}
                </p>
              </div>
            )}

            {/* Categories */}
            {viewTest.categories && viewTest.categories.length > 0 && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Categories Covered
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {viewTest.categories.map((cat, idx) => (
                    <Badge key={idx} variant="default" size="sm">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Questions summary */}
            <div>
              <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Assigned Questions (
                {viewTest.questions?.length ?? viewTest.totalQuestions ?? 0})
              </h5>
              {viewTest.questions && viewTest.questions.length > 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1.5 max-h-40 overflow-y-auto">
                  {viewTest.questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-200/50 last:border-0"
                    >
                      <span className="font-mono text-slate-600 truncate">
                        Question #{idx + 1} ({q.questionType || 'aptitude'})
                      </span>
                      <span className="shrink-0 font-medium text-slate-800">
                        {q.marks || 1} mark(s)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No questions currently linked to this assessment. Use Edit to associate questions.
                </p>
              )}
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              {viewTest.createdAt && (
                <span>Created: {formatDate(viewTest.createdAt)}</span>
              )}
              {viewTest.updatedAt && (
                <span>Last updated: {formatDate(viewTest.updatedAt)}</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Status Toggle Confirmation Modal ─────────────────────────────── */}
      <Modal
        isOpen={isToggleModalOpen}
        onClose={() => {
          setIsToggleModalOpen(false);
          setToggleTarget(null);
        }}
        title={
          toggleTarget?.isPublished
            ? 'Unpublish Mock Assessment?'
            : 'Publish Mock Assessment?'
        }
        description={
          toggleTarget?.isPublished
            ? 'This assessment will be saved as a draft and hidden from student practice catalogs.'
            : 'This assessment will become live and accessible to students for simulated placement practice.'
        }
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsToggleModalOpen(false);
                setToggleTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={toggleTarget?.isPublished ? 'danger' : 'success'}
              size="sm"
              onClick={handleConfirmToggle}
            >
              {toggleTarget?.isPublished ? 'Unpublish Test' : 'Publish Test'}
            </Button>
          </>
        }
      >
        {toggleTarget && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">
              {toggleTarget.title || '—'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={getDifficultyVariant(toggleTarget.difficulty)}
                size="sm"
              >
                {getDifficultyLabel(toggleTarget.difficulty)}
              </Badge>
              <span className="text-xs text-slate-500">
                {toggleTarget.durationMinutes || 0} min
              </span>
              <span className="text-xs text-slate-500">
                • {toggleTarget.questions?.length ?? toggleTarget.totalQuestions ?? 0} Questions
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

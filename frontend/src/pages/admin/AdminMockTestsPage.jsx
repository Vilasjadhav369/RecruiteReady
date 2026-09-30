import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminMockTests,
  createMockTest,
  updateMockTest,
  updateMockTestStatus,
} from '../../services/adminService.js';

const INITIAL_FORM = {
  title: '',
  description: '',
  durationMinutes: 60,
  difficulty: 'medium',
  categories: 'Quantitative Aptitude, Logical Reasoning, Verbal Ability',
  instructions:
    'Read each question carefully before answering. Each question carries marks as indicated. Submit before the timer expires.',
  isPublished: true,
};

export default function AdminMockTestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await getAdminMockTests(params);
      setTests(data?.mockTests || []);
    } catch (err) {
      console.error('Fetch mock tests error:', err);
      setError('Failed to load mock tests.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingTest(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (test) => {
    setEditingTest(test);
    setFormData({
      title: test.title || '',
      description: test.description || '',
      durationMinutes: test.durationMinutes || 60,
      difficulty: test.difficulty || 'medium',
      categories: (test.categories || []).join(', '),
      instructions: test.instructions || '',
      isPublished: test.isPublished ?? true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggle = async (test) => {
    try {
      setTogglingId(test._id);
      const updated = await updateMockTestStatus(test._id, !test.isPublished);
      setTests((prev) =>
        prev.map((t) => (t._id === test._id ? { ...t, isPublished: updated.isPublished } : t))
      );
      showSuccess(`"${test.title}" is now ${updated.isPublished ? 'Published' : 'Draft'}.`);
    } catch (err) {
      console.error('Toggle mock test status error:', err);
      alert('Failed to update test status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Test title is required.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      durationMinutes: Number(formData.durationMinutes) || 60,
      difficulty: formData.difficulty,
      categories: formData.categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      instructions: formData.instructions.trim(),
      isPublished: formData.isPublished,
    };

    try {
      setSubmitting(true);
      if (editingTest) {
        await updateMockTest(editingTest._id, payload);
        showSuccess('Mock test updated successfully.');
      } else {
        await createMockTest(payload);
        showSuccess('Mock test created successfully.');
      }
      setIsModalOpen(false);
      fetchTests();
    } catch (err) {
      console.error('Save mock test error:', err);
      setFormError(err.response?.data?.message || 'Failed to save mock test.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <span>✓</span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mock Test Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, configure, and publish full-length timed assessments modeled on campus recruitment rounds.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
        >
          <span>+</span> Create Mock Test
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search tests by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading mock tests...</div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 bg-rose-50 text-sm">{error}</div>
        ) : tests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No mock tests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Categories</th>
                  <th className="py-3 px-4 text-center">Questions</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((test) => (
                  <tr key={test._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{test.title}</div>
                      {test.description && (
                        <div className="text-xs text-slate-400 truncate max-w-[200px]">{test.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-xs font-mono">
                      {test.durationMinutes} min
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                          test.difficulty === 'easy'
                            ? 'bg-emerald-50 text-emerald-700'
                            : test.difficulty === 'hard'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {test.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs truncate max-w-[200px]">
                      {(test.categories || []).join(', ') || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700 text-xs font-mono">
                      {test.questions?.length || test.totalQuestions || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggle(test)}
                        disabled={togglingId === test._id}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${
                          test.isPublished
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {togglingId === test._id
                          ? 'Updating...'
                          : test.isPublished
                          ? 'Published'
                          : 'Draft'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(test)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingTest ? 'Edit Mock Test' : 'Create New Mock Test'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. TCS NQT Full Mock — Set 1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Brief summary of what this test simulates..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="all">Mixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categories (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.categories}
                  onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  placeholder="Quantitative Aptitude, Logical Reasoning"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions</label>
                <textarea
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="testPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="testPublished" className="text-xs font-medium text-slate-700">
                  Publish immediately (visible to students)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTest ? 'Save Changes' : 'Create Mock Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

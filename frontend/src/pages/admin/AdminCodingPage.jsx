import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminCodingProblems,
  createCodingProblem,
  updateCodingProblem,
  updateCodingProblemStatus,
} from '../../services/adminService.js';

const INITIAL_FORM_STATE = {
  title: '',
  slug: '',
  difficulty: 'medium',
  category: 'Algorithms',
  topics: 'Arrays, Strings',
  description: '',
  constraints: '1 <= N <= 10^5',
  inputFormat: 'A single string or array',
  outputFormat: 'Returned value',
  sampleInput: '4\n1 2 3 4',
  sampleOutput: '10',
  sampleExplanation: 'Sum of elements is 10',
  testInput: '4\n1 2 3 4',
  testExpectedOutput: '10',
  isActive: true,
};

export default function AdminCodingPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await getAdminCodingProblems(params);
      setProblems(data?.problems || []);
    } catch (err) {
      console.error('Fetch coding problems error:', err);
      setError('Failed to load coding problems.');
    } finally {
      setLoading(false);
    }
  }, [search, difficultyFilter, statusFilter]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingProblem(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (problem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title || '',
      slug: problem.slug || '',
      difficulty: problem.difficulty || 'medium',
      category: problem.category || 'Algorithms',
      topics: (problem.topics || []).join(', '),
      description: problem.description || '',
      constraints: (problem.constraints || []).join('\n'),
      inputFormat: problem.inputFormat || '',
      outputFormat: problem.outputFormat || '',
      sampleInput: problem.examples?.[0]?.input || '',
      sampleOutput: problem.examples?.[0]?.output || '',
      sampleExplanation: problem.examples?.[0]?.explanation || '',
      testInput: problem.testCases?.[0]?.input || 'sample input',
      testExpectedOutput: problem.testCases?.[0]?.expectedOutput || 'sample output',
      isActive: problem.isActive ?? true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (problem) => {
    try {
      setTogglingId(problem._id);
      const updated = await updateCodingProblemStatus(problem._id, !problem.isActive);
      setProblems((prev) =>
        prev.map((p) => (p._id === problem._id ? { ...p, isActive: updated.isActive } : p))
      );
      showSuccess(`Problem "${problem.title}" is now ${updated.isActive ? 'Active' : 'Draft'}.`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update problem status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      difficulty: formData.difficulty,
      category: formData.category.trim(),
      topics: formData.topics.split(',').map((t) => t.trim()).filter(Boolean),
      description: formData.description.trim(),
      constraints: formData.constraints.split('\n').map((c) => c.trim()).filter(Boolean),
      inputFormat: formData.inputFormat.trim(),
      outputFormat: formData.outputFormat.trim(),
      examples: [
        {
          input: formData.sampleInput || '1',
          output: formData.sampleOutput || '1',
          explanation: formData.sampleExplanation || '',
        },
      ],
      testCases: [
        {
          input: formData.testInput || '1',
          expectedOutput: formData.testExpectedOutput || '1',
          isHidden: false,
        },
      ],
      isActive: formData.isActive,
    };

    try {
      setSubmitting(true);
      if (editingProblem) {
        await updateCodingProblem(editingProblem._id, payload);
        showSuccess('Coding problem updated successfully.');
      } else {
        await createCodingProblem(payload);
        showSuccess('Coding problem created successfully.');
      }
      setIsModalOpen(false);
      fetchProblems();
    } catch (err) {
      console.error('Error saving problem:', err);
      setFormError(err.response?.data?.message || 'Failed to save problem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <span>✓</span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coding Practice Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Author and manage technical challenges, problem statements, constraints, and test scenarios.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
        >
          <span>+</span> Add Problem
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by title or topic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Drafts / Inactive</option>
        </select>
      </div>

      {/* Problems Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading coding problems...</div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 bg-rose-50 text-sm">{error}</div>
        ) : problems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No coding problems found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Topics</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {problems.map((problem) => (
                  <tr key={problem._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{problem.title}</div>
                      <div className="text-xs text-slate-400 font-mono">/{problem.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                          problem.difficulty === 'easy'
                            ? 'bg-emerald-50 text-emerald-700'
                            : problem.difficulty === 'hard'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{problem.category || 'General'}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-[150px]">
                      {(problem.topics || []).join(', ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(problem)}
                        disabled={togglingId === problem._id}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${
                          problem.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {togglingId === problem._id ? 'Updating...' : problem.isActive ? 'Active' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(problem)}
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingProblem ? 'Edit Coding Problem' : 'Create New Coding Problem'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="e.g. Reverse Linked List"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
                    placeholder="reverse-linked-list (auto-generated if empty)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Data Structures"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topics (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.topics}
                    onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Array, Hash Table"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Description *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Explain the problem clearly, including input expectations..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Constraints</label>
                <textarea
                  rows={2}
                  value={formData.constraints}
                  onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="One constraint per line"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Input</label>
                  <textarea
                    rows={2}
                    value={formData.sampleInput}
                    onChange={(e) => setFormData({ ...formData, sampleInput: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Output</label>
                  <textarea
                    rows={2}
                    value={formData.sampleOutput}
                    onChange={(e) => setFormData({ ...formData, sampleOutput: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-slate-700">
                  Publish immediately (Active for students)
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
                  {submitting ? 'Saving...' : editingProblem ? 'Save Changes' : 'Create Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

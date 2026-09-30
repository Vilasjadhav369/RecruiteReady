import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminResources,
  createResource,
  updateResource,
  updateResourceStatus,
} from '../../services/adminService.js';

const INITIAL_FORM = {
  title: '',
  description: '',
  type: 'article',
  category: 'Aptitude',
  topic: 'Quantitative Aptitude',
  url: '',
  isActive: true,
};

const TYPES = ['pdf', 'video', 'article', 'link', 'note'];
const CATEGORIES = ['Aptitude', 'Data Structures', 'Algorithms', 'Core CS', 'Interview Prep', 'System Design'];

export default function AdminResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await getAdminResources(params);
      setResources(data?.resources || []);
    } catch (err) {
      console.error('Fetch resources error:', err);
      setError('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingResource(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res) => {
    setEditingResource(res);
    setFormData({
      title: res.title || '',
      description: res.description || '',
      type: res.type || 'article',
      category: res.category || 'Aptitude',
      topic: res.topic || '',
      url: res.url || '',
      isActive: res.isActive ?? true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggle = async (res) => {
    try {
      setTogglingId(res._id);
      const updated = await updateResourceStatus(res._id, !res.isActive);
      setResources((prev) =>
        prev.map((item) => (item._id === res._id ? { ...item, isActive: updated.isActive } : item))
      );
      showSuccess(`Resource "${res.title}" is now ${updated.isActive ? 'Active' : 'Draft'}.`);
    } catch (err) {
      console.error('Toggle status error:', err);
      alert('Failed to update resource status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || !formData.url.trim() || !formData.topic.trim()) {
      setFormError('Title, topic, and URL are required.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      category: formData.category,
      topic: formData.topic.trim(),
      url: formData.url.trim(),
      isActive: formData.isActive,
    };

    try {
      setSubmitting(true);
      if (editingResource) {
        await updateResource(editingResource._id, payload);
        showSuccess('Resource updated successfully.');
      } else {
        await createResource(payload);
        showSuccess('Resource created successfully.');
      }
      setIsModalOpen(false);
      fetchResources();
    } catch (err) {
      console.error('Save resource error:', err);
      setFormError(err.response?.data?.message || 'Failed to save resource.');
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Study Materials Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Curate verified notes, cheat sheets, roadmaps, video tutorials, and reference documentation.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
        >
          <span>+</span> Add Resource
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search resources by title or topic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 capitalize"
        >
          <option value="">All Formats</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading resources...</div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 bg-rose-50 text-sm">{error}</div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No study materials found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{res.title}</div>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 hover:underline truncate max-w-xs block font-mono"
                      >
                        {res.url}
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                        {res.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-xs">{res.category}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{res.topic}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggle(res)}
                        disabled={togglingId === res._id}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${
                          res.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {togglingId === res._id ? 'Updating...' : res.isActive ? 'Active' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(res)}
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
                {editingResource ? 'Edit Study Material' : 'Add Study Material'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. Master Quantitative Aptitude Handbook"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Short summary of what this guide or note covers..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Format Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase text-xs"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic *</label>
                <input
                  type="text"
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. Dynamic Programming or Speed Math"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resource URL *</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="resourceActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="resourceActive" className="text-xs font-medium text-slate-700">
                  Visible to students (Active)
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
                  {submitting ? 'Saving...' : editingResource ? 'Save Changes' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

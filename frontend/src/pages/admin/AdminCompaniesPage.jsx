import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminCompanies,
  createCompany,
  updateCompany,
  updateCompanyStatus,
} from '../../services/adminService.js';

const INITIAL_FORM = {
  name: '',
  slug: '',
  logoUrl: '',
  industry: 'Technology',
  description: '',
  website: '',
  careersUrl: '',
  roles: 'Software Development Engineer, Systems Engineer',
  eligibility: 'B.E. / B.Tech / MCA with minimum 65% aggregate.',
  selectionProcess: 'Online Assessment\nTechnical Round 1\nTechnical Round 2\nHR Round',
  aptitudeTopics: 'Quantitative Aptitude, Logical Reasoning',
  codingTopics: 'Data Structures, Dynamic Programming',
  isActive: true,
};

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await getAdminCompanies(params);
      setCompanies(data?.companies || []);
    } catch (err) {
      console.error('Fetch companies error:', err);
      setError('Failed to load companies.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCompany(c);
    setFormData({
      name: c.name || '',
      slug: c.slug || '',
      logoUrl: c.logoUrl || '',
      industry: c.industry || 'Technology',
      description: c.description || '',
      website: c.website || '',
      careersUrl: c.careersUrl || '',
      roles: (c.roles || []).join(', '),
      eligibility: c.eligibility || '',
      selectionProcess: (c.selectionProcess || []).join('\n'),
      aptitudeTopics: (c.aptitudeTopics || []).join(', '),
      codingTopics: (c.codingTopics || []).join(', '),
      isActive: c.isActive ?? true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggle = async (c) => {
    try {
      setTogglingId(c._id);
      const updated = await updateCompanyStatus(c._id, !c.isActive);
      setCompanies((prev) =>
        prev.map((item) => (item._id === c._id ? { ...item, isActive: updated.isActive } : item))
      );
      showSuccess(`"${c.name}" is now ${updated.isActive ? 'Active' : 'Hidden'}.`);
    } catch (err) {
      console.error('Toggle status error:', err);
      alert('Failed to update company status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Company name is required.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug:
        formData.slug.trim() ||
        formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      logoUrl: formData.logoUrl.trim(),
      industry: formData.industry.trim(),
      description: formData.description.trim(),
      website: formData.website.trim(),
      careersUrl: formData.careersUrl.trim(),
      roles: formData.roles.split(',').map((r) => r.trim()).filter(Boolean),
      eligibility: formData.eligibility.trim(),
      selectionProcess: formData.selectionProcess.split('\n').map((p) => p.trim()).filter(Boolean),
      aptitudeTopics: formData.aptitudeTopics.split(',').map((t) => t.trim()).filter(Boolean),
      codingTopics: formData.codingTopics.split(',').map((t) => t.trim()).filter(Boolean),
      isActive: formData.isActive,
    };

    try {
      setSubmitting(true);
      if (editingCompany) {
        await updateCompany(editingCompany._id, payload);
        showSuccess('Company updated successfully.');
      } else {
        await createCompany(payload);
        showSuccess('Company created successfully.');
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err) {
      console.error('Save company error:', err);
      setFormError(err.response?.data?.message || 'Failed to save company.');
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Track Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Curate company recruitment patterns, rounds, eligibility criteria, and syllabus.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
        >
          <span>+</span> Add Company
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search companies by name or role..."
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
          <option value="active">Active Only</option>
          <option value="inactive">Hidden / Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading companies...</div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 bg-rose-50 text-sm">{error}</div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No companies found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Rounds</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400 font-mono">/{c.slug}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{c.industry || 'Technology'}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs truncate max-w-[200px]">
                      {(c.roles || []).join(', ') || 'Various'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {c.selectionProcess?.length || 0} stages
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggle(c)}
                        disabled={togglingId === c._id}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${
                          c.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {togglingId === c._id ? 'Updating...' : c.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(c)}
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingCompany ? 'Edit Company Guide' : 'Add New Company Track'}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="e.g. Google"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="e.g. Technology / FinTech"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">About / Overview</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Short description of the company and their engineering culture..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Roles (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.roles}
                    onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Eligibility Criteria</label>
                  <input
                    type="text"
                    value={formData.eligibility}
                    onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hiring Rounds / Selection Process (one per line)
                </label>
                <textarea
                  rows={3}
                  value={formData.selectionProcess}
                  onChange={(e) => setFormData({ ...formData, selectionProcess: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Key Aptitude Topics</label>
                  <input
                    type="text"
                    value={formData.aptitudeTopics}
                    onChange={(e) => setFormData({ ...formData, aptitudeTopics: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Key Coding Topics</label>
                  <input
                    type="text"
                    value={formData.codingTopics}
                    onChange={(e) => setFormData({ ...formData, codingTopics: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="companyActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="companyActive" className="text-xs font-medium text-slate-700">
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
                  {submitting ? 'Saving...' : editingCompany ? 'Save Changes' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

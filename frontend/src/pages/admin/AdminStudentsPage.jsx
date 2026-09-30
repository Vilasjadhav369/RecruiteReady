import { useState, useEffect, useCallback } from "react";
import { getStudents, updateStudentStatus } from "../../services/adminService.js";
import ErrorState from "../../components/ErrorState.jsx";

function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected student for detail modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudentsList = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudents({ search, status, page, limit: 10 });
      setStudents(data?.students || []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Unable to load student directory. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchStudentsList(1);
  }, [fetchStudentsList]);

  const handleToggleStatus = async (student) => {
    setActionLoading(true);
    try {
      const updated = await updateStudentStatus(student._id, !student.isActive);
      setStudents((prev) =>
        prev.map((s) => (s._id === student._id ? { ...s, isActive: updated.isActive } : s))
      );
      if (selectedStudent && selectedStudent._id === student._id) {
        setSelectedStudent((prev) => ({ ...prev, isActive: updated.isActive }));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update student status.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight">Student Directory</h1>
          <p className="text-xs text-[#52606D] mt-0.5">
            View registered student profiles and manage account activity.
          </p>
        </div>
        <div className="text-xs font-semibold text-[#52606D] bg-white border border-[#D9E2EC] px-3.5 py-1.5 rounded-lg shadow-xs self-start">
          Total Registered: <span className="text-[#172B4D] font-bold">{pagination.total}</span>
        </div>
      </div>

      {/* ── Search & Filters Bar ───────────────────────────────── */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or college..."
            className="w-full pl-9 pr-3.5 py-2 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-xs text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#2563EB]"
          />
          <div className="absolute left-3 top-2.5 text-[#9FB3C8]">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {["all", "active", "inactive"].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                status === st
                  ? "bg-[#102A43] text-white"
                  : "bg-[#F8FAFC] text-[#52606D] hover:bg-[#E8F1FF] hover:text-[#2563EB]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-8">
          <ErrorState message={error} onRetry={() => fetchStudentsList(pagination.page)} />
        </div>
      )}

      {/* ── Table / Cards ──────────────────────────────────────── */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="h-10 bg-[#F8FAFC] rounded-lg animate-pulse" />
            <div className="h-10 bg-[#F8FAFC] rounded-lg animate-pulse" />
            <div className="h-10 bg-[#F8FAFC] rounded-lg animate-pulse" />
          </div>
        ) : students.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#52606D] border-b border-[#D9E2EC] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">College</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Graduation</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2EC]/70">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-[#F8FAFC]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#E8F1FF] text-[#2563EB] font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {student.firstName?.[0]?.toUpperCase() ?? "S"}
                          </div>
                          <span className="font-bold text-[#172B4D]">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#52606D]">{student.email}</td>
                      <td className="py-3 px-4 text-[#172B4D]">{student.college || "—"}</td>
                      <td className="py-3 px-4 text-[#52606D]">{student.branch || "—"}</td>
                      <td className="py-3 px-4 text-[#52606D]">{student.graduationYear || "—"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            student.isActive
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {student.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleToggleStatus(student)}
                          className={`text-xs font-semibold cursor-pointer ${
                            student.isActive ? "text-red-600 hover:underline" : "text-green-600 hover:underline"
                          }`}
                        >
                          {student.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[#D9E2EC]">
              {students.map((student) => (
                <div key={student._id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#E8F1FF] text-[#2563EB] font-bold flex items-center justify-center text-xs">
                        {student.firstName?.[0]?.toUpperCase() ?? "S"}
                      </div>
                      <span className="text-xs font-bold text-[#172B4D]">
                        {student.firstName} {student.lastName}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        student.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {student.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-xs text-[#52606D] space-y-0.5">
                    <div>{student.email}</div>
                    <div>{student.college || "No college specified"}</div>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-[#D9E2EC]/50 text-xs">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="text-[#2563EB] font-semibold"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleToggleStatus(student)}
                      className={student.isActive ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}
                    >
                      {student.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ────────────────────────────────────────── */}
            <div className="p-4 bg-[#F8FAFC] border-t border-[#D9E2EC] flex items-center justify-between text-xs text-[#52606D]">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} students)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchStudentsList(pagination.page - 1)}
                  className="px-3 py-1.5 bg-white border border-[#D9E2EC] rounded-lg disabled:opacity-40 cursor-pointer font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchStudentsList(pagination.page + 1)}
                  className="px-3 py-1.5 bg-white border border-[#D9E2EC] rounded-lg disabled:opacity-40 cursor-pointer font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <h3 className="text-sm font-bold text-[#172B4D] mb-1">No students found</h3>
            <p className="text-xs text-[#52606D]">
              No student records matched your search query or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* ── Student Detail Modal ───────────────────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9E2EC] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E2EC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E8F1FF] text-[#2563EB] font-bold flex items-center justify-center text-sm">
                  {selectedStudent.firstName?.[0]?.toUpperCase() ?? "S"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172B4D]">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <span className="text-xs text-[#52606D]">{selectedStudent.email}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-[#52606D] block">College</span>
                <span className="text-[#172B4D] mt-0.5 block">{selectedStudent.college || "—"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#52606D] block">Branch</span>
                <span className="text-[#172B4D] mt-0.5 block">{selectedStudent.branch || "—"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#52606D] block">Graduation Year</span>
                <span className="text-[#172B4D] mt-0.5 block">{selectedStudent.graduationYear || "—"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#52606D] block">Account Status</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${selectedStudent.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {selectedStudent.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {selectedStudent.targetCompanies?.length > 0 && (
              <div className="text-xs">
                <span className="font-semibold text-[#52606D] block mb-1.5">Target Companies</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.targetCompanies.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 bg-[#F8FAFC] border border-[#D9E2EC] rounded text-[11px] font-semibold text-[#172B4D]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedStudent.preparationGoals?.length > 0 && (
              <div className="text-xs">
                <span className="font-semibold text-[#52606D] block mb-1.5">Preparation Goals</span>
                <ul className="list-disc list-inside space-y-1 text-[#52606D]">
                  {selectedStudent.preparationGoals.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t border-[#D9E2EC] flex items-center justify-between">
              <button
                disabled={actionLoading}
                onClick={() => handleToggleStatus(selectedStudent)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                  selectedStudent.isActive
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {selectedStudent.isActive ? "Deactivate Account" : "Activate Account"}
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg text-xs font-semibold text-[#172B4D] hover:bg-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStudentsPage;

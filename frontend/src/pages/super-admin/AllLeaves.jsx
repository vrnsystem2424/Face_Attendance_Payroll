// src/pages/super-admin/AllLeaves.jsx

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllLeavesSuperAdmin,
  superAdminApproveLeave,
  superAdminRejectLeave,
  superAdminDeleteLeave,
} from '../../redux/slices/leaveSlice';

const AllLeaves = () => {
  const dispatch = useDispatch();
  const { leaves, loading } = useSelector((s) => s.leaves);
  console.log('🔍 Leaves data:', leaves);
  console.log('🔍 First leave:', leaves[0]);
  
  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    search: '',
  });

  const [actionModal, setActionModal] = useState(null);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    dispatch(fetchAllLeavesSuperAdmin({}));
  }, [dispatch]);

  // Auto-refetch leaves when search/status changes (server-side)
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchAllLeavesSuperAdmin({
        status: filters.status,
        search: filters.search,
      }));
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.status, filters.search, dispatch]);

  const handleAction = async () => {
    if (!actionModal) return;

    const action = actionModal.type === 'approve' ? superAdminApproveLeave : superAdminRejectLeave;
    const result = await dispatch(action({ id: actionModal.leave._id, admin_remark: remark }));

    if (result.meta.requestStatus === 'fulfilled') {
      setActionModal(null);
      setRemark('');
      dispatch(fetchAllLeavesSuperAdmin({
        status: filters.status,
        search: filters.search,
      }));
    }
  };

  const handleDelete = async (leave) => {
    if (!window.confirm(`Delete leave of ${leave.name}? Permanent action!`)) return;
    const result = await dispatch(superAdminDeleteLeave(leave._id));
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(fetchAllLeavesSuperAdmin({
        status: filters.status,
        search: filters.search,
      }));
    }
  };

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  // 🆕 Client-side department filter (since backend may not have company_id)
  const filteredLeaves = leaves.filter((leave) => {
    if (filters.department === 'all') return true;
    const dept = leave.department || leave.emp_id?.department;
    return dept === filters.department;
  });

  // Stats (based on filtered data)
  const stats = {
    total: filteredLeaves.length,
    pending: filteredLeaves.filter(l => l.status === 'pending').length,
    approved: filteredLeaves.filter(l => l.status === 'approved').length,
    rejected: filteredLeaves.filter(l => l.status === 'rejected').length,
  };

  // 🆕 Unique departments from all leaves (for dropdown)
  const allDepartments = [...new Set(
    leaves
      .map(l => l.department || l.emp_id?.department)
      .filter(Boolean)
  )].sort();

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#1A1A2E]">All Leaves</h1>
                <span className="rounded-full bg-gradient-to-r from-[#E8590C] to-[#D14800] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  Global
                </span>
              </div>
              <p className="text-sm text-[#9CA3AF]">Manage leaves across all departments</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, color: '#1A1A2E', bg: '#f3f4f6' },
            { label: 'Pending', value: stats.pending, color: '#d97706', bg: '#fffbeb' },
            { label: 'Approved', value: stats.approved, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Rejected', value: stats.rejected, color: '#dc2626', bg: '#fef2f2' },
          ].map((s) => (
            <div key={s.label} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="h-1" style={{ background: s.color }} />
              <div className="p-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: s.bg, color: s.color }}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5" />
                  </svg>
                </div>
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {/* Search */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Search
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Name or emp code..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#E8590C]"
                  />
                </div>
              </div>

              {/* 🆕 Department Filter */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
                >
                  <option value="all">All Departments ({allDepartments.length})</option>
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Active filters indicator */}
            {(filters.search || filters.department !== 'all' || filters.status !== 'all') && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">Active filters:</span>
                {filters.search && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                    Search: "{filters.search}"
                    <button onClick={() => setFilters({ ...filters, search: '' })} className="hover:text-orange-900">×</button>
                  </span>
                )}
                {filters.department !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    Dept: {filters.department}
                    <button onClick={() => setFilters({ ...filters, department: 'all' })} className="hover:text-blue-900">×</button>
                  </span>
                )}
                {filters.status !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                    Status: {filters.status}
                    <button onClick={() => setFilters({ ...filters, status: 'all' })} className="hover:text-purple-900">×</button>
                  </span>
                )}
                <button
                  onClick={() => setFilters({ department: 'all', status: 'all', search: '' })}
                  className="ml-2 text-[11px] font-semibold text-red-600 hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-4 text-sm text-[#9CA3AF]">Loading...</p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3E8]">
                <svg className="h-8 w-8 text-[#E8590C]/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#9CA3AF]">No leaves found</p>
              {(filters.search || filters.department !== 'all' || filters.status !== 'all') && (
                <button
                  onClick={() => setFilters({ department: 'all', status: 'all', search: '' })}
                  className="mt-3 text-xs font-semibold text-[#E8590C] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Employee', 'Department', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLeaves.map((leave) => (
                    <tr key={leave._id} className="transition-colors hover:bg-[#faf8f5]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1A1A2E]">{leave.name}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{leave.emp_code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {leave.department || leave.emp_id?.department || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-[#4B5563]">{leave.leave_type}</span>
                        {leave.is_half_day && (
                          <span className="ml-1 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">HALF</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#4B5563]">{leave.from_date}</td>
                      <td className="px-4 py-3 text-[#4B5563]">{leave.to_date}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-[#1A1A2E]">
                          {leave.leave_days}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#4B5563] max-w-xs">
                        <p className="truncate" title={leave.reason}>{leave.reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusBadge(leave.status)}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {leave.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { setActionModal({ leave, type: 'approve' }); setRemark(''); }}
                                className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-600"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => { setActionModal({ leave, type: 'reject' }); setRemark(''); }}
                                className="rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-600"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(leave)}
                            className="rounded-lg border border-gray-200 bg-white p-1.5 text-[#9CA3AF] hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                            title="Delete"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className={`h-1.5 w-full ${actionModal.type === 'approve' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`} />
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${actionModal.type === 'approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    {actionModal.type === 'approve' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A1A2E] capitalize">
                    {actionModal.type} Leave
                  </h3>
                  <p className="text-xs text-[#9CA3AF]">{actionModal.leave.name} — {actionModal.leave.emp_code}</p>
                </div>
              </div>

              <div className="mb-5 rounded-xl bg-[#faf8f5] p-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[#9CA3AF]">Department</p>
                    <p className="font-semibold text-[#1A1A2E]">{actionModal.leave.department || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Type</p>
                    <p className="font-semibold text-[#1A1A2E] capitalize">{actionModal.leave.leave_type}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">From</p>
                    <p className="font-semibold text-[#1A1A2E]">{actionModal.leave.from_date}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">To</p>
                    <p className="font-semibold text-[#1A1A2E]">{actionModal.leave.to_date}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Days</p>
                    <p className="font-semibold text-[#1A1A2E]">{actionModal.leave.leave_days}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Half Day</p>
                    <p className="font-semibold text-[#1A1A2E]">{actionModal.leave.is_half_day ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <p className="text-[#9CA3AF] text-xs">Reason</p>
                  <p className="text-sm text-[#1A1A2E]">{actionModal.leave.reason}</p>
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Remark (optional)
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Add a remark..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] p-3 text-sm outline-none focus:border-[#E8590C]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAction}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-md ${actionModal.type === 'approve' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:-translate-y-0.5' : 'bg-gradient-to-r from-red-500 to-red-600 hover:-translate-y-0.5'} transition-all`}
                >
                  Confirm {actionModal.type === 'approve' ? 'Approval' : 'Rejection'}
                </button>
                <button
                  onClick={() => { setActionModal(null); setRemark(''); }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllLeaves;
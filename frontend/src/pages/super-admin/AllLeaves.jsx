import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllLeavesSuperAdmin,
  superAdminApproveLeave,
  superAdminRejectLeave,
  superAdminDeleteLeave,
} from '../../redux/slices/leaveSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const AllLeaves = () => {
  const dispatch = useDispatch();
  const { leaves, loading } = useSelector((s) => s.leaves);
  const { companies } = useSelector((s) => s.company);

  const [filters, setFilters] = useState({
    company_id: 'all',
    status: 'all',
    search: '',
  });

  // 🆕 Approve modal states
  const [approveModal, setApproveModal] = useState(null);
  const [approvedDays, setApprovedDays] = useState('');
  const [paidDays, setPaidDays] = useState('');
  const [unpaidDays, setUnpaidDays] = useState('');
  const [remark, setRemark] = useState('');

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectRemark, setRejectRemark] = useState('');

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => {
    dispatch(fetchCompanies());
    dispatch(fetchAllLeavesSuperAdmin(filters));
  }, [dispatch]);

  const handleFilter = () => {
    dispatch(fetchAllLeavesSuperAdmin(filters));
  };

  const openApproveModal = (leave) => {
    setApproveModal(leave);
    setApprovedDays(leave.applied_days.toString());
    setPaidDays(leave.applied_days.toString());
    setUnpaidDays('0');
    setRemark('');
  };

  // Auto-calc paid/unpaid
  useEffect(() => {
    if (approveModal && approvedDays) {
      const days = parseFloat(approvedDays) || 0;
      // Default: all paid
      setPaidDays(days.toString());
      setUnpaidDays('0');
    }
  }, [approvedDays, approveModal]);

  const handleApprove = async () => {
    const days = parseFloat(approvedDays);
    const paid = parseFloat(paidDays);
    const unpaid = parseFloat(unpaidDays);

    if (!days || days <= 0) {
      alert('Valid approved days required');
      return;
    }

    if (days > approveModal.applied_days) {
      alert(`Cannot approve more than applied (${approveModal.applied_days} days)`);
      return;
    }

    if (paid + unpaid !== days) {
      alert(`Paid (${paid}) + Unpaid (${unpaid}) must equal Approved (${days})`);
      return;
    }

    await dispatch(superAdminApproveLeave({
      id: approveModal._id,
      approved_days: days,
      paid_days: paid,
      unpaid_days: unpaid,
      admin_remark: remark || `Approved ${days} day(s) by Super Admin`,
    }));

    setApproveModal(null);
    setApprovedDays('');
    setPaidDays('');
    setUnpaidDays('');
    setRemark('');
    dispatch(fetchAllLeavesSuperAdmin(filters));
  };

  const handleReject = async () => {
    if (!rejectRemark) {
      alert('Rejection reason required');
      return;
    }
    await dispatch(superAdminRejectLeave({
      id: rejectModal._id,
      admin_remark: rejectRemark,
    }));
    setRejectModal(null);
    setRejectRemark('');
    dispatch(fetchAllLeavesSuperAdmin(filters));
  };

  const handleDelete = async () => {
    await dispatch(superAdminDeleteLeave(deleteModal._id));
    setDeleteModal(null);
    dispatch(fetchAllLeavesSuperAdmin(filters));
  };

  const statusStyle = (s) => {
    if (s === 'approved') return { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
    if (s === 'pending') return { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' };
    return { badge: 'bg-red-50 text-red-600', dot: 'bg-red-500' };
  };

  const leaveTypeColor = (type) => {
    const map = {
      casual: 'bg-blue-50 text-blue-700',
      sick: 'bg-red-50 text-red-600',
      emergency: 'bg-orange-50 text-orange-700',
      other: 'bg-gray-100 text-gray-600',
    };
    return map[type?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md">
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
              <p className="text-sm text-[#9CA3AF]">{leaves.length} leaves across all companies</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-[#9CA3AF] mb-2 block">Company</label>
              <select
                value={filters.company_id}
                onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}
                className="w-full rounded-xl border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
              >
                <option value="all">All Companies</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#9CA3AF] mb-2 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-xl border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#9CA3AF] mb-2 block">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                placeholder="Name or code..."
                className="w-full rounded-xl border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className="w-full rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-2.5 text-sm font-bold text-white hover:-translate-y-0.5 transition-all"
              >
                🔍 Search
              </button>
            </div>
          </div>
        </div>

        {/* Leaves List */}
        {loading ? (
          <div className="flex justify-center py-20 bg-white rounded-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <p className="text-sm text-[#9CA3AF]">No leaves found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaves.map((leave) => {
              const ss = statusStyle(leave.status);
              const isPartial = leave.status === 'approved' && leave.approved_days < leave.applied_days;
              
              return (
                <div key={leave._id} className="rounded-2xl bg-white shadow-sm hover:shadow-md transition-all p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF3E8] text-base font-bold text-[#E8590C]">
                        {leave.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="font-bold text-[#1A1A2E]">{leave.name}</p>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-[#4B5563]">
                            {leave.emp_code}
                          </span>
                          <span className="rounded-full bg-[#FFF3E8] px-2 py-0.5 text-[10px] font-bold text-[#E8590C]">
                            🏢 {leave.company_id?.name || 'Unknown'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF] mb-2">
                          <span>{leave.from_date} → {leave.to_date}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${leaveTypeColor(leave.leave_type)}`}>
                            {leave.leave_type}
                          </span>
                        </div>

                        {/* 🆕 DAYS BREAKDOWN */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                            Applied: {leave.applied_days} day(s)
                          </span>
                          {leave.status === 'approved' && (
                            <>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                ✅ Approved: {leave.approved_days} day(s)
                              </span>
                              {leave.paid_days > 0 && (
                                <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">
                                  💰 Paid: {leave.paid_days}
                                </span>
                              )}
                              {leave.unpaid_days > 0 && (
                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                                  ❌ Unpaid: {leave.unpaid_days}
                                </span>
                              )}
                              {isPartial && (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                  ⚠️ Partial
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        <p className="text-xs text-[#4B5563]">
                          <strong>Reason:</strong> {leave.reason}
                        </p>

                        {leave.admin_remark && (
                          <p className="text-xs text-blue-700 mt-1">
                            <strong>Admin:</strong> {leave.admin_remark}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase ${ss.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ss.dot}`} />
                        {leave.status}
                      </span>

                      <div className="flex gap-2">
                        {leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openApproveModal(leave)}
                              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal(leave)}
                              className="rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setDeleteModal(leave)}
                          className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 hover:bg-red-500 hover:text-white"
                          title="Delete"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🆕 APPROVE MODAL WITH DAYS INPUT */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A1A2E]">Approve Leave</h3>
                  <p className="text-xs text-[#9CA3AF]">{approveModal.name} — {approveModal.emp_code}</p>
                </div>
              </div>

              {/* Info */}
              <div className="mb-4 rounded-xl bg-[#faf8f5] p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[#9CA3AF]">Company</p>
                  <p className="font-bold text-[#E8590C]">{approveModal.company_id?.name}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF]">Type</p>
                  <p className="font-bold text-[#1A1A2E] uppercase">{approveModal.leave_type}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF]">Applied Days</p>
                  <p className="font-bold text-blue-700">{approveModal.applied_days} day(s)</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF]">Half Day</p>
                  <p className="font-bold text-[#1A1A2E]">{approveModal.is_half_day ? 'Yes' : 'No'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[#9CA3AF]">Dates</p>
                  <p className="font-bold text-[#1A1A2E]">{approveModal.from_date} → {approveModal.to_date}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[#9CA3AF]">Reason</p>
                  <p className="font-medium text-[#1A1A2E]">{approveModal.reason}</p>
                </div>
              </div>

              {/* 🆕 APPROVED DAYS */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Approve How Many Days? <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max={approveModal.applied_days}
                  value={approvedDays}
                  onChange={(e) => setApprovedDays(e.target.value)}
                  className="w-full rounded-xl border-2 border-emerald-200 py-3 px-4 text-lg font-bold text-emerald-700 outline-none focus:border-emerald-500"
                />
                <p className="mt-1.5 text-[11px] text-[#9CA3AF]">
                  Max: {approveModal.applied_days} days
                </p>
              </div>

              {/* 🆕 PAID/UNPAID SPLIT */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-emerald-700">
                    💰 Paid Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={paidDays}
                    onChange={(e) => setPaidDays(e.target.value)}
                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50/50 py-2.5 px-3 text-sm font-bold text-emerald-700 outline-none focus:border-emerald-500"
                  />
                  <p className="text-[9px] text-emerald-600 mt-1">Added to salary</p>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-red-700">
                    ❌ Unpaid Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={unpaidDays}
                    onChange={(e) => setUnpaidDays(e.target.value)}
                    className="w-full rounded-xl border border-red-200 bg-red-50/50 py-2.5 px-3 text-sm font-bold text-red-700 outline-none focus:border-red-500"
                  />
                  <p className="text-[9px] text-red-600 mt-1">Salary cut</p>
                </div>
              </div>

              {/* Preview */}
              {parseFloat(approvedDays) > 0 && (
                <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-3">
                  <p className="text-[10px] font-bold text-blue-700 uppercase mb-2">📊 Summary</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Applied:</span>
                      <span className="font-bold">{approveModal.applied_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Approving:</span>
                      <span className="font-bold text-emerald-700">{approvedDays} days</span>
                    </div>
                    {(approveModal.applied_days - parseFloat(approvedDays)) > 0 && (
                      <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                        <span className="text-red-600">Not Approved (Absent):</span>
                        <span className="font-bold text-red-700">
                          {approveModal.applied_days - parseFloat(approvedDays)} days
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                      <span className="text-blue-700">Salary Deduction:</span>
                      <span className="font-bold text-red-700">
                        {parseFloat(unpaidDays) + (approveModal.applied_days - parseFloat(approvedDays))} days
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Remark */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Remark
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={2}
                  placeholder="Reason for partial approval..."
                  className="w-full rounded-xl border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white hover:-translate-y-0.5 transition-all"
                >
                  ✅ Approve {approvedDays} Day(s)
                </button>
                <button
                  onClick={() => setApproveModal(null)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-red-500" />
            <div className="p-6">
              <h3 className="text-lg font-extrabold text-red-600 mb-4">Reject Leave - {rejectModal.name}</h3>
              
              <div className="mb-4 rounded-xl bg-[#faf8f5] p-3 text-xs space-y-1">
                <p><strong>Applied:</strong> {rejectModal.applied_days} days</p>
                <p><strong>Dates:</strong> {rejectModal.from_date} → {rejectModal.to_date}</p>
                <p><strong>Type:</strong> {rejectModal.leave_type}</p>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectRemark}
                  onChange={(e) => setRejectRemark(e.target.value)}
                  rows={3}
                  placeholder="Explain why rejected..."
                  className="w-full rounded-xl border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-red-500 resize-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600"
                >
                  ❌ Reject
                </button>
                <button
                  onClick={() => { setRejectModal(null); setRejectRemark(''); }}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-[#4B5563]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-red-500" />
            <div className="p-6">
              <h3 className="text-lg font-extrabold text-red-600 mb-2">⚠️ Delete Leave?</h3>
              <p className="text-sm text-[#9CA3AF] mb-4">This cannot be undone</p>

              <div className="mb-5 rounded-xl bg-[#faf8f5] p-3 text-xs">
                <p><strong>{deleteModal.name}</strong> - {deleteModal.emp_code}</p>
                <p>{deleteModal.from_date} → {deleteModal.to_date}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600"
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-[#4B5563]"
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
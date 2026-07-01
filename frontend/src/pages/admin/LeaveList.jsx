import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllLeaves, approveLeave, rejectLeave } from '../../redux/slices/leaveSlice';

const LeaveList = () => {
  const dispatch = useDispatch();
  const { allLeaves, loading } = useSelector((s) => s.leaves);
  const [filter, setFilter] = useState('pending');

  // Approve modal states - SIMPLIFIED
  const [approveModal, setApproveModal] = useState(null);
  const [approvedDays, setApprovedDays] = useState('');
  const [remark, setRemark] = useState('');

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectRemark, setRejectRemark] = useState('');

  useEffect(() => { dispatch(fetchAllLeaves(filter)); }, [dispatch, filter]);

  const openApproveModal = (leave) => {
    setApproveModal(leave);
    setApprovedDays(leave.applied_days.toString());
    setRemark('');
  };

  // 🆕 SIMPLIFIED - Only approved days needed
  const handleApprove = async () => {
    const days = parseFloat(approvedDays);

    if (!days || days <= 0) {
      alert('Valid approved days required');
      return;
    }

    if (days > approveModal.applied_days) {
      alert(`Cannot approve more than applied (${approveModal.applied_days} days)`);
      return;
    }

    // 🆕 Auto: All approved days are paid
    await dispatch(approveLeave({
      id: approveModal._id,
      approved_days: days,
      paid_days: days,       // All paid
      unpaid_days: 0,        // No unpaid
      remark: remark || `Approved ${days} day(s)`,
    }));

    setApproveModal(null);
    setApprovedDays('');
    setRemark('');
    dispatch(fetchAllLeaves(filter));
  };

  const handleReject = async () => {
    // 🆕 Remark not required
    await dispatch(rejectLeave({
      id: rejectModal._id,
      remark: rejectRemark || 'Rejected',
    }));

    setRejectModal(null);
    setRejectRemark('');
    dispatch(fetchAllLeaves(filter));
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
      earned: 'bg-purple-50 text-purple-700',
    };
    return map[type?.toLowerCase()] || 'bg-gray-100 text-[#4B5563]';
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
                <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#1A1A2E]">Leave Requests</h2>
                <p className="text-xs text-[#9CA3AF]">{allLeaves.length} records</p>
              </div>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
          </div>
        ) : allLeaves.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <p className="text-sm text-[#9CA3AF]">No leave requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allLeaves.map((leave) => {
              const ss = statusStyle(leave.status);
              const isPartial = leave.status === 'approved' && leave.approved_days < leave.applied_days;
              
              return (
                <div key={leave._id} className="overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF3E8] text-base font-bold text-[#E8590C]">
                        {leave.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-[#1A1A2E]">{leave.name}</p>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-[#4B5563]">
                            {leave.emp_code}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF]">
                          <span>{leave.from_date} → {leave.to_date}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${leaveTypeColor(leave.leave_type)}`}>
                            {leave.leave_type}
                          </span>
                        </div>

                        {/* DAYS BREAKDOWN */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                            Applied: {leave.applied_days} day(s)
                          </span>
                          {leave.status === 'approved' && (
                            <>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                ✅ Approved: {leave.approved_days} day(s)
                              </span>
                              {isPartial && (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                  ⚠️ Partial Approval
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        <p className="mt-2 text-xs text-[#4B5563] max-w-md">
                          <strong>Reason:</strong> {leave.reason}
                        </p>

                        {leave.manager_remark && (
                          <p className="mt-1 text-xs text-emerald-700">
                            <strong>Manager:</strong> {leave.manager_remark}
                          </p>
                        )}
                        {leave.admin_remark && (
                          <p className="mt-1 text-xs text-blue-700">
                            <strong>Admin:</strong> {leave.admin_remark}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${ss.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ss.dot}`} />
                        {leave.status}
                      </span>

                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
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
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════ */}
      {/* 🆕 SIMPLE APPROVE MODAL              */}
      {/* ══════════════════════════════════════ */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
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
                  <p className="text-xs text-[#9CA3AF]">{approveModal.name}</p>
                </div>
              </div>

              {/* Leave Details */}
              <div className="mb-4 rounded-xl bg-[#faf8f5] p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9CA3AF]">Applied Days:</span>
                  <span className="font-bold text-[#1A1A2E]">{approveModal.applied_days} day(s)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#9CA3AF]">Type:</span>
                  <span className="font-bold text-[#1A1A2E] uppercase">{approveModal.leave_type}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#9CA3AF]">Dates:</span>
                  <span className="font-bold text-[#1A1A2E]">{approveModal.from_date} → {approveModal.to_date}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#9CA3AF]">Reason:</span>
                  <span className="font-medium text-[#1A1A2E] text-right max-w-[60%]">{approveModal.reason}</span>
                </div>
              </div>

              {/* 🆕 SIMPLE - Only Approved Days Input */}
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
                  autoFocus
                />
                <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                  Max: {approveModal.applied_days} days (applied)
                </p>
              </div>

              {/* Preview */}
              {parseFloat(approvedDays) > 0 && (
                <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase mb-2">📊 Summary</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Approving:</span>
                      <span className="font-bold text-emerald-900">{approvedDays} of {approveModal.applied_days} days</span>
                    </div>
                    {(approveModal.applied_days - parseFloat(approvedDays)) > 0 && (
                      <div className="flex justify-between border-t border-emerald-200 pt-1 mt-1">
                        <span className="text-red-600">Not Approved (Absent):</span>
                        <span className="font-bold text-red-700">
                          {approveModal.applied_days - parseFloat(approvedDays)} day(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remark - OPTIONAL */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Remark <span className="text-[#9CA3AF] text-xs">(optional)</span>
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={2}
                  placeholder="Optional: Add a remark..."
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
                  onClick={() => {
                    setApproveModal(null);
                    setApprovedDays('');
                    setRemark('');
                  }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* REJECT MODAL - Optional Remark        */}
      {/* ══════════════════════════════════════ */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-red-500" />
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-red-600">Reject Leave</h3>
                  <p className="text-xs text-[#9CA3AF]">{rejectModal.name}</p>
                </div>
              </div>

              <div className="mb-4 rounded-xl bg-[#faf8f5] p-3 text-xs space-y-1">
                <p><strong>Days:</strong> {rejectModal.applied_days}</p>
                <p><strong>Dates:</strong> {rejectModal.from_date} → {rejectModal.to_date}</p>
                <p><strong>Type:</strong> {rejectModal.leave_type}</p>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Rejection Reason <span className="text-[#9CA3AF] text-xs">(optional)</span>
                </label>
                <textarea
                  value={rejectRemark}
                  onChange={(e) => setRejectRemark(e.target.value)}
                  rows={3}
                  placeholder="Optional: Explain why rejected..."
                  className="w-full rounded-xl border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-red-500 resize-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600"
                >
                  ❌ Reject Leave
                </button>
                <button
                  onClick={() => {
                    setRejectModal(null);
                    setRejectRemark('');
                  }}
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

export default LeaveList;
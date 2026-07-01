import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPendingLeaves,
  approveLeaveByManager,
  rejectLeaveByManager,
} from '../../redux/slices/managerSlice';
import { fetchEmployeeBalance } from '../../redux/slices/leaveBalanceSlice';

const PendingLeaves = () => {
  const dispatch = useDispatch();
  const { pendingLeaves, loading } = useSelector((s) => s.manager);
  const { employeeBalance } = useSelector((s) => s.leaveBalance);

  const [approveModal, setApproveModal] = useState(null);
  const [approvedDays, setApprovedDays] = useState('');
  const [paidDays, setPaidDays] = useState('');
  const [unpaidDays, setUnpaidDays] = useState('');
  const [remark, setRemark] = useState('');

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectRemark, setRejectRemark] = useState('');

  useEffect(() => {
    dispatch(fetchPendingLeaves());
  }, [dispatch]);

  useEffect(() => {
    if (approveModal) {
      dispatch(fetchEmployeeBalance(approveModal.emp_id?._id || approveModal.emp_id));
      setApprovedDays(approveModal.applied_days || 1);
    }
  }, [approveModal, dispatch]);

  // Auto-calculate paid/unpaid based on balance
  useEffect(() => {
    if (approveModal && approvedDays) {
      const days = parseFloat(approvedDays) || 0;
      const balance = employeeBalance?.current_balance || 0;
      
      const autoPaid = Math.min(days, balance);
      const autoUnpaid = Math.max(0, days - balance);
      
      setPaidDays(autoPaid.toString());
      setUnpaidDays(autoUnpaid.toString());
    }
  }, [approvedDays, employeeBalance, approveModal]);

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

    await dispatch(approveLeaveByManager({
      id: approveModal._id,
      approved_days: days,
      paid_days: paid,
      unpaid_days: unpaid,
      remark: remark || `Approved ${days} day(s)`,
    }));

    setApproveModal(null);
    setApprovedDays('');
    setPaidDays('');
    setUnpaidDays('');
    setRemark('');
    dispatch(fetchPendingLeaves());
  };

  const handleReject = async () => {
    // if (!rejectRemark) {
    //   alert('Rejection reason required');
    //   return;
    // }
    await dispatch(rejectLeaveByManager({ 
      id: rejectModal._id, 
      remark: rejectRemark 
    }));
    setRejectModal(null);
    setRejectRemark('');
    dispatch(fetchPendingLeaves());
  };

  const balance = employeeBalance?.current_balance || 0;
  const days = parseFloat(approvedDays) || 0;

  const leaveTypeColor = (type) => {
    const map = {
      casual: 'bg-blue-50 text-blue-700',
      sick: 'bg-red-50 text-red-600',
      emergency: 'bg-orange-50 text-orange-700',
      other: 'bg-gray-100 text-gray-600',
    };
    return map[type] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1A1A2E]">Pending Leave Requests</h1>
            <p className="text-xs text-[#9CA3AF]">{pendingLeaves.length} requests waiting</p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
          </div>
        ) : pendingLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-[#1A1A2E]">All Caught Up!</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">No pending leaves</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingLeaves.map((leave) => (
              <div key={leave._id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF3E8] text-base font-bold text-[#E8590C]">
                        {leave.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#1A1A2E]">{leave.name}</p>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-[#4B5563]">
                            {leave.emp_code}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${leaveTypeColor(leave.leave_type)}`}>
                            {leave.leave_type}
                          </span>
                          {leave.is_half_day && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              Half Day ({leave.half_day_period})
                            </span>
                          )}
                          <span className="text-[#9CA3AF]">
                            {leave.from_date} → {leave.to_date}
                          </span>
                          <span className="rounded-full bg-[#1A1A2E] px-2 py-0.5 text-[10px] font-bold text-white">
                            {leave.applied_days} day(s)
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-[#4B5563]">{leave.reason}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setApproveModal(leave)}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600">
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectModal(leave)}
                        className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* 🆕 APPROVE MODAL - WITH DAYS INPUT   */}
        {/* ══════════════════════════════════════ */}
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
                    <h3 className="text-base font-extrabold text-[#1A1A2E]">Approve Leave</h3>
                    <p className="text-xs text-[#9CA3AF]">{approveModal.name} — {approveModal.emp_code}</p>
                  </div>
                </div>

                {/* Leave Info */}
                <div className="mb-4 rounded-xl bg-[#faf8f5] p-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[#9CA3AF]">Type</p>
                    <p className="font-bold text-[#1A1A2E] uppercase">{approveModal.leave_type}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Applied</p>
                    <p className="font-bold text-blue-700">{approveModal.applied_days} day(s)</p>
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

                {/* Balance Info */}
                <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-700">💰 Available Leave Balance</p>
                    <p className="text-[10px] text-blue-600">Free leaves in account</p>
                  </div>
                  <p className="text-2xl font-extrabold text-blue-700">{balance}</p>
                </div>

                {/* 🆕 APPROVED DAYS INPUT */}
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
                    Max: {approveModal.applied_days} days (applied)
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
                    <p className="text-[9px] text-emerald-600 mt-1">
                      From balance
                    </p>
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
                    <p className="text-[9px] text-red-600 mt-1">
                      Salary cut
                    </p>
                  </div>
                </div>

                {/* Preview */}
                {days > 0 && (
                  <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase mb-2">📊 Preview</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Applied:</span>
                        <span className="font-bold">{approveModal.applied_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Approving:</span>
                        <span className="font-bold text-emerald-800">{approvedDays} days</span>
                      </div>
                      {approveModal.applied_days - days > 0 && (
                        <div className="flex justify-between text-red-600 border-t border-emerald-200 pt-1 mt-1">
                          <span>Not Approved (Absent):</span>
                          <span className="font-bold">{approveModal.applied_days - days} days</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-emerald-200 pt-1 mt-1">
                        <span className="text-emerald-700">Balance After:</span>
                        <span className="font-bold text-emerald-800">
                          {Math.max(0, balance - parseFloat(paidDays || 0))} days
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Remark */}
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Remark (Reason for partial approval)
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={2}
                    placeholder="e.g. Only 2 days available, work required on Thursday..."
                    className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] p-3 text-sm text-[#1A1A2E] outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white hover:-translate-y-0.5 shadow-md transition-all">
                    ✅ Approve {approvedDays} Day(s)
                  </button>
                  <button
                    onClick={() => {
                      setApproveModal(null);
                      setApprovedDays('');
                      setPaidDays('');
                      setUnpaidDays('');
                      setRemark('');
                    }}
                    className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* REJECT MODAL                          */}
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
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectRemark}
                    onChange={(e) => setRejectRemark(e.target.value)}
                    rows={3}
                    placeholder="Explain why this leave is rejected..."
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
    </div>
  );
};

export default PendingLeaves;
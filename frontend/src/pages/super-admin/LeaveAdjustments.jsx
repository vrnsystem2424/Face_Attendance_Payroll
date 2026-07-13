import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllEmployeesWithBalance,
  adjustLeaveBalance,
  fetchAdjustmentHistory,
  clearBalanceMessage,
  clearBalanceError,
} from '../../redux/slices/leaveBalanceSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const LeaveAdjustments = () => {
  const dispatch = useDispatch();
  const {
    allEmployeesWithBalance,
    adjustmentHistory,
    loading,
    message,
    error,
  } = useSelector((s) => s.leaveBalance);
  const { companies } = useSelector((s) => s.company);

  const [selectedCompany, setSelectedCompany] = useState('all');
  const [search, setSearch] = useState('');
  const [adjustModal, setAdjustModal] = useState(null);

  // Modal states
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    dispatch(fetchCompanies());
    dispatch(fetchAllEmployeesWithBalance({ company_id: selectedCompany, search }));
    dispatch(fetchAdjustmentHistory());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchAllEmployeesWithBalance({ company_id: selectedCompany, search }));
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedCompany, search, dispatch]);

  // Auto-hide messages
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        dispatch(clearBalanceMessage());
        dispatch(clearBalanceError());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error, dispatch]);

  const openAdjustModal = (emp) => {
    setAdjustModal(emp);
    setAdjustmentType('add');
    setDays('');
    setReason('');
  };

  const closeAdjustModal = () => {
    setAdjustModal(null);
    setAdjustmentType('add');
    setDays('');
    setReason('');
  };

  const handleAdjust = async () => {
    if (!days || parseFloat(days) <= 0) {
      alert('Valid days daalo');
      return;
    }
    if (!reason || reason.trim() === '') {
      alert('Reason daalo');
      return;
    }

    const result = await dispatch(
      adjustLeaveBalance({
        emp_id: adjustModal._id,
        days: parseFloat(days),
        reason: reason.trim(),
        adjustment_type: adjustmentType,
      })
    );

    if (result.meta.requestStatus === 'fulfilled') {
      closeAdjustModal();
      // Refresh data
      dispatch(fetchAllEmployeesWithBalance({ company_id: selectedCompany, search }));
      dispatch(fetchAdjustmentHistory());
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* HEADER */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF3E8]">
                <svg className="h-6 w-6 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-[#1A1A2E]">Leave Adjustments</h1>
                <p className="text-xs text-[#9CA3AF]">Add or deduct leaves manually (Super Admin only)</p>
              </div>
            </div>
          </div>
        </div>

        {/* SUCCESS/ERROR MESSAGES */}
        {message && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3 animate-slideDown">
            <svg className="h-5 w-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-emerald-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3 animate-slideDown">
            <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm shadow-gray-200/60">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm text-[#1A1A2E] outline-none focus:border-[#E8590C]"
              >
                <option value="all">All Companies</option>
                {companies?.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or emp code..."
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm text-[#1A1A2E] outline-none focus:border-[#E8590C]"
              />
            </div>
          </div>
        </div>

        {/* EMPLOYEES TABLE */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1A1A2E]">Employees</h3>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#E8590C]">
                {allEmployeesWithBalance.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-4 text-sm text-[#9CA3AF]">Loading...</p>
            </div>
          ) : allEmployeesWithBalance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-[#9CA3AF]">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Name', 'Code', 'Company', 'Dept', 'Balance', 'Credited', 'Used', 'Action'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allEmployeesWithBalance.map((emp) => (
                    <tr key={emp._id} className="transition-colors hover:bg-[#faf8f5]">
                      <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{emp.name}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.emp_code}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {emp.company?.name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.department || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-[13px] font-extrabold text-blue-700">
                          {emp.current_balance}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-emerald-700 font-semibold">+{emp.total_credited}</td>
                      <td className="px-5 py-3.5 text-red-700 font-semibold">-{emp.total_used}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => openAdjustModal(emp)}
                          className="rounded-lg bg-gradient-to-r from-[#E8590C] to-[#D14800] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ADJUSTMENT HISTORY */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A2E]">Adjustment History</h3>
                <p className="text-xs text-[#9CA3AF]">All manual leave adjustments</p>
              </div>
            </div>
          </div>

          {adjustmentHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-[#9CA3AF]">No adjustments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Employee', 'Company', 'Type', 'Days', 'Reason', 'By', 'Date'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {adjustmentHistory.map((adj, i) => (
                    <tr key={i} className="hover:bg-[#faf8f5]">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-[#1A1A2E]">{adj.employee_name}</p>
                        <p className="text-xs text-[#9CA3AF]">{adj.emp_code}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {adj.company?.name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {adj.adjustment_type === 'add' ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            + ADD
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                            − DEDUCT
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-bold text-[#1A1A2E]">{adj.days}</td>
                      <td className="px-5 py-3 text-xs text-[#4B5563] max-w-xs truncate" title={adj.reason}>
                        {adj.reason}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-purple-700">{adj.adjusted_by}</td>
                      <td className="px-5 py-3 text-xs text-[#9CA3AF]">
                        {new Date(adj.adjusted_on).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ADJUSTMENT MODAL */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-7">

              {/* Header */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <svg className="h-6 w-6 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A1A2E]">Adjust Leave Balance</h3>
                  <p className="text-xs text-[#9CA3AF]">{adjustModal.name} — {adjustModal.emp_code}</p>
                </div>
              </div>

              {/* Current Balance */}
              <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3 space-y-1">
                <p className="text-xs text-[#9CA3AF]">
                  Current Balance:{' '}
                  <span className="font-extrabold text-blue-600 text-lg">{adjustModal.current_balance}</span>
                  {' '}leaves
                </p>
                <p className="text-[10px] text-[#9CA3AF]">
                  Total Credited: {adjustModal.total_credited} • Total Used: {adjustModal.total_used}
                </p>
              </div>

              {/* Adjustment Type */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Adjustment Type <span className="text-[#E8590C]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAdjustmentType('add')}
                    className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                      adjustmentType === 'add'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-[#4B5563] hover:border-emerald-300'
                    }`}
                  >
                    ➕ Add Leaves
                  </button>
                  <button
                    onClick={() => setAdjustmentType('deduct')}
                    className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                      adjustmentType === 'deduct'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-[#4B5563] hover:border-red-300'
                    }`}
                  >
                    ➖ Deduct Leaves
                  </button>
                </div>
              </div>

              {/* Days */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Days <span className="text-[#E8590C]">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="e.g. 3, 0.5, 1.5"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                />
                {days && parseFloat(days) > 0 && (
                  <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2">
                    <p className="text-xs text-[#4B5563]">
                      New Balance:{' '}
                      <span className="font-extrabold text-blue-700">
                        {adjustmentType === 'add'
                          ? adjustModal.current_balance + parseFloat(days)
                          : Math.max(0, adjustModal.current_balance - parseFloat(days))}
                      </span>
                      {' '}leaves
                    </p>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Reason <span className="text-[#E8590C]">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows="3"
                  placeholder="e.g. Previous system leaves, Manual adjustment for missed credits..."
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)] resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAdjust}
                  disabled={loading || !days || !reason}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `${adjustmentType === 'add' ? 'Add' : 'Deduct'} Leaves`}
                </button>
                <button
                  onClick={closeAdjustModal}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:scale(.95) translateY(10px) }
          to   { opacity:1; transform:scale(1) translateY(0) }
        }
        .animate-modalIn { animation:modalIn .25s ease-out }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default LeaveAdjustments;
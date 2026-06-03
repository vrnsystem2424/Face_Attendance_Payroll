// src/pages/LeaveForm.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { applyLeave, fetchMyLeaves, clearLeaveError, clearLeaveMessage } from '../redux/slices/leaveSlice';

// ════════════════════════════════════════════
// DATE UTILITIES
// ════════════════════════════════════════════
const formatDateToDDMMYYYY = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDDMMYYYYToISO = (ddmmyyyy) => {
  if (!ddmmyyyy || !ddmmyyyy.includes('/')) return '';
  try {
    const [day, month, year] = ddmmyyyy.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch {
    return '';
  }
};

const calculateDays = (fromStr, toStr, isHalfDay) => {
  if (!fromStr || !toStr) return 0;
  if (isHalfDay) return 0.5;

  const fromISO = parseDDMMYYYYToISO(fromStr);
  const toISO = parseDDMMYYYYToISO(toStr);
  if (!fromISO || !toISO) return 0;

  const from = new Date(fromISO);
  const to = new Date(toISO);
  if (from > to) return 0;

  const diff = Math.abs(to - from);
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
};

const LeaveForm = () => {
  const dispatch = useDispatch();
  const { myLeaves, loading, error, message } = useSelector((s) => s.leaves);
  const { user } = useSelector((s) => s.auth);

  // ════════════════════════════════════════════
  // FORM STATE — Removed shift
  // ════════════════════════════════════════════
  const [formData, setFormData] = useState({
    from_date: '',           // DD/MM/YYYY
    to_date: '',             // DD/MM/YYYY
    leave_type: 'casual',
    time_slot: 'full',       // 'first' | 'second' | 'full'
    is_half_day: false,
    reason: '',
  });

  const [calculatedDays, setCalculatedDays] = useState(0);

  useEffect(() => {
    dispatch(fetchMyLeaves());
    dispatch(clearLeaveError());
    dispatch(clearLeaveMessage());
  }, [dispatch]);

  // Auto-calculate days
  useEffect(() => {
    const days = calculateDays(formData.from_date, formData.to_date, formData.is_half_day);
    setCalculatedDays(days);
  }, [formData.from_date, formData.to_date, formData.is_half_day]);

  // ════════════════════════════════════════════
  // INPUT HANDLERS
  // ════════════════════════════════════════════
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };

      // Auto half-day logic
      if (name === 'time_slot') {
        updated.is_half_day = value === 'first' || value === 'second';
        if (updated.is_half_day && updated.from_date) {
          updated.to_date = updated.from_date;
        }
      }

      return updated;
    });
  };

  const handleDateChange = (name, isoDate) => {
    if (!isoDate) {
      setFormData((prev) => ({ ...prev, [name]: '' }));
      return;
    }
    const ddmmyyyy = formatDateToDDMMYYYY(isoDate);
    setFormData((prev) => {
      const updated = { ...prev, [name]: ddmmyyyy };
      if (prev.is_half_day && name === 'from_date') {
        updated.to_date = ddmmyyyy;
      }
      return updated;
    });
  };

  // ════════════════════════════════════════════
  // SUBMIT
  // ════════════════════════════════════════════
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.from_date || !formData.to_date) {
      alert('Please select from and to dates');
      return;
    }
    if (!formData.reason.trim()) {
      alert('Please provide a reason');
      return;
    }

    // Build payload — no shift field
    const payload = {
      from_date: formData.from_date,
      to_date: formData.to_date,
      leave_type: formData.leave_type,
      reason: formData.reason,
      is_half_day: formData.is_half_day,
      half_day_period: formData.is_half_day ? formData.time_slot : '',
    };

    const result = await dispatch(applyLeave(payload));
    if (result.meta.requestStatus === 'fulfilled') {
      setFormData({
        from_date: '',
        to_date: '',
        leave_type: 'casual',
        time_slot: 'full',
        is_half_day: false,
        reason: '',
      });
      dispatch(fetchMyLeaves());
    }
  };

  // ════════════════════════════════════════════
  // STYLES
  // ════════════════════════════════════════════
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
    return map[type] || 'bg-gray-100 text-gray-600';
  };

  const inputCls = "w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]";

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* APPLY LEAVE CARD */}
        <div className="mb-6 overflow-hidden rounded-[28px] bg-white shadow-[0_20px_70px_-10px_rgba(26,26,46,0.10)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />

          <div className="p-6 sm:p-8">
            {/* Heading */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF3E8]">
                <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#1A1A2E]">Apply for Leave</h2>
                <p className="text-xs text-[#9CA3AF]">
                  Leave request kam se kam 3 din pehle daalna zaroori hai. Emergency leave hi same day approve hogi.
                </p>
              </div>
            </div>

            {/* Employee Info Card */}
            {user && (
              <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-gradient-to-br from-[#FFF8F3] to-[#FFF3E8] p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#E8590C]">Employee</p>
                  <p className="mt-1 text-sm font-bold text-[#1A1A2E]">{user.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#E8590C]">Code</p>
                  <p className="mt-1 text-sm font-bold text-[#1A1A2E]">{user.emp_code}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#E8590C]">Department</p>
                  <p className="mt-1 text-sm font-bold text-[#1A1A2E]">{user.department || '—'}</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/80 px-4 py-3.5">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-800">Submission Failed</p>
                  <p className="mt-0.5 text-xs text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-emerald-700">{message}</p>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Leave Type (full width — no shift) */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Leave Type <span className="text-[#E8590C]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="leave_type"
                    value={formData.leave_type}
                    onChange={handleChange}
                    className={`${inputCls} appearance-none pr-10`}
                    required
                  >
                    <option value="casual">Casual Leave </option>
                    <option value="sick">Sick Leave </option>
                    <option value="emergency">Emergency Leave </option>
                    <option value="other">Other / Unpaid Leave</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* TIME SLOT (Half Day / Full Day) */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Time Slot  <span className="text-[#E8590C]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'full', label: 'Full Day', sub: 'पूरा दिन' },
                    { value: 'first', label: 'Before Lunch', sub: 'पहला आधा' },
                    { value: 'second', label: 'After Lunch', sub: 'दूसरा आधा' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`relative cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${
                        formData.time_slot === opt.value
                          ? 'border-[#E8590C] bg-[#FFF3E8] shadow-sm'
                          : 'border-gray-200 bg-[#FAFAFA] hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="time_slot"
                        value={opt.value}
                        checked={formData.time_slot === opt.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <p className={`text-sm font-bold ${formData.time_slot === opt.value ? 'text-[#E8590C]' : 'text-[#1A1A2E]'}`}>
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#9CA3AF]">{opt.sub}</p>
                      {formData.time_slot === opt.value && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E8590C] text-white">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {formData.is_half_day && (
                  <p className="mt-2 text-[11px] text-amber-600">
                    ⚠ Half day selected — From/To date will be same
                  </p>
                )}
              </div>

              {/* DATE RANGE */}
              <div className="rounded-xl border border-[#E8590C]/20 bg-gradient-to-br from-[#FFF8F3] to-[#FFF3E8] p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1A1A2E]">
                  <svg className="h-4 w-4 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Leave Duration 
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* From Date */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#1A1A2E]">
                      From Date <span className="text-[#E8590C]">*</span>
                    </label>
                    <input
                      type="date"
                      value={parseDDMMYYYYToISO(formData.from_date)}
                      onChange={(e) => handleDateChange('from_date', e.target.value)}
                      min={todayISO}
                      className={inputCls}
                      required
                    />
                    {formData.from_date && (
                      <p className="mt-1 text-[10px] font-bold text-[#E8590C]">
                        {formData.from_date}
                      </p>
                    )}
                  </div>

                  {/* To Date */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#1A1A2E]">
                      To Date <span className="text-[#E8590C]">*</span>
                    </label>
                    <input
                      type="date"
                      value={parseDDMMYYYYToISO(formData.to_date)}
                      onChange={(e) => handleDateChange('to_date', e.target.value)}
                      min={parseDDMMYYYYToISO(formData.from_date) || todayISO}
                      disabled={formData.is_half_day}
                      className={`${inputCls} ${formData.is_half_day ? 'opacity-60 cursor-not-allowed' : ''}`}
                      required
                    />
                    {formData.to_date && (
                      <p className="mt-1 text-[10px] font-bold text-[#E8590C]">
                        {formData.to_date}
                      </p>
                    )}
                  </div>

                  {/* Days (auto-calculated) */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#1A1A2E]">
                      Total Days
                    </label>
                    <div className="flex h-[46px] items-center justify-center rounded-xl border-2 border-[#E8590C] bg-white">
                      <span className="text-2xl font-extrabold text-[#E8590C]">
                        {calculatedDays}
                      </span>
                      <span className="ml-1 text-xs font-semibold text-[#9CA3AF]">
                        day{calculatedDays !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Reason  <span className="text-[#E8590C]">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe the reason for your leave request…"
                  className={`${inputCls} resize-none`}
                />
                <p className="mt-1 text-[10px] text-[#9CA3AF]">
                  {formData.reason.length} characters
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading || calculatedDays === 0}
                  className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting…
                      </>
                    ) : (
                      <>
                        Submit Leave Request
                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({
                    from_date: '', to_date: '', leave_type: 'casual',
                    time_slot: 'full', is_half_day: false, reason: '',
                  })}
                  className="rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50"
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* MY LEAVE HISTORY */}
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_20px_70px_-10px_rgba(26,26,46,0.08)]">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E8]">
                <svg className="h-4 w-4 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">My Leave History</h3>
                <p className="text-xs text-[#9CA3AF]">{myLeaves.length} total requests</p>
              </div>
            </div>
          </div>

          {myLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF3E8]">
                <svg className="h-7 w-7 text-[#E8590C]/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-sm text-[#9CA3AF]">No leave requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 p-4">
              {myLeaves.map((leave) => {
                const ss = statusStyle(leave.status);
                return (
                  <div key={leave._id} className="group rounded-2xl px-4 py-4 transition-all hover:bg-[#faf8f5]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${leaveTypeColor(leave.leave_type)}`}>
                            {leave.leave_type}
                          </span>
                          {leave.is_half_day && (
                            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                              HALF DAY ({leave.half_day_period === 'first' ? '1st' : '2nd'})
                            </span>
                          )}
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            {leave.leave_days} day{leave.leave_days > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                          </svg>
                          {leave.from_date} → {leave.to_date}
                        </div>

                        <p className="mt-1.5 text-xs text-[#4B5563]">{leave.reason}</p>

                        {leave.manager_remark && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
                            <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#9CA3AF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227" />
                            </svg>
                            <p className="text-xs text-[#4B5563]">
                              <span className="font-semibold">Manager:</span> {leave.manager_remark}
                            </p>
                          </div>
                        )}

                        {leave.admin_remark && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg bg-orange-50 px-3 py-2">
                            <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227" />
                            </svg>
                            <p className="text-xs text-[#4B5563]">
                              <span className="font-semibold">Admin:</span> {leave.admin_remark}
                            </p>
                          </div>
                        )}
                      </div>

                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${ss.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ss.dot}`} />
                        {leave.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveForm;
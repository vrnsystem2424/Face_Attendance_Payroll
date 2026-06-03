// src/pages/super-admin/MonthlySettings.jsx

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMonthlySettings,
  saveMonthlySettings,
  addHoliday,
  removeHoliday,
  clearSettingsMessage,
  clearSettingsError,
} from '../../redux/slices/monthlySettingsSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const SuperAdminMonthlySettings = () => {
  const dispatch = useDispatch();
  const { current, loading, error, message } = useSelector((s) => s.monthlySettings);
  const { companies } = useSelector((s) => s.company);

  const today = new Date();
  const [filters, setFilters] = useState({
    company_id: '',
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const [formData, setFormData] = useState({
    required_hours: 240,
    daily_hours: 8,
    weekly_off: ['Sunday'],
  });

  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  const [saveLoading, setSaveLoading] = useState(false);   // 🆕 Local save state

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = [];
  for (let y = today.getFullYear() + 1; y >= today.getFullYear() - 3; y--) years.push(y);

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // ════════════════════════════════════════
  // Load companies on mount
  // ════════════════════════════════════════
  useEffect(() => {
    dispatch(fetchCompanies());
    dispatch(clearSettingsMessage());
    dispatch(clearSettingsError());
  }, [dispatch]);

  // Auto-select first company
  useEffect(() => {
    if (companies.length > 0 && !filters.company_id) {
      setFilters((prev) => ({ ...prev, company_id: companies[0]._id }));
    }
  }, [companies]);

  // ════════════════════════════════════════
  // 🆕 Fetch settings ONLY when filters change
  // ════════════════════════════════════════
  useEffect(() => {
    if (filters.company_id) {
      dispatch(fetchMonthlySettings(filters));
    }
  }, [filters.company_id, filters.month, filters.year, dispatch]);

  // ════════════════════════════════════════
  // 🆕 FIXED — Sync only when current changes (not loop)
  // ════════════════════════════════════════
  useEffect(() => {
    if (current && current.month === filters.month && current.year === filters.year) {
      const reqHrs = Number(current.required_hours);
      const dayHrs = Number(current.daily_hours);

      setFormData({
        required_hours: reqHrs > 0 ? reqHrs : 240,
        daily_hours: dayHrs > 0 ? dayHrs : 8,
        weekly_off: current.weekly_off || ['Sunday'],
      });

      console.log('📥 Loaded settings:', {
        required_hours: reqHrs,
        daily_hours: dayHrs,
        weekly_off: current.weekly_off,
        holidays: current.holidays?.length,
      });
    }
  }, [current, filters.month, filters.year]);

  // Auto-clear message
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => dispatch(clearSettingsMessage()), 3000);
      return () => clearTimeout(t);
    }
  }, [message, dispatch]);

  // ════════════════════════════════════════
  // 🆕 SMART HANDLERS WITH VALIDATION
  // ════════════════════════════════════════

  // Save Settings
  const handleSaveSettings = async () => {
    if (!filters.company_id) {
      alert('Please select a company');
      return;
    }

    // Validate
    const requiredHrs = Number(formData.required_hours);
    const dailyHrs = Number(formData.daily_hours);

    if (!requiredHrs || requiredHrs < 1) {
      alert('⚠️ Please enter valid Required Monthly Hours');
      return;
    }

    if (!dailyHrs || dailyHrs < 1) {
      alert('⚠️ Please enter valid Daily Hours');
      return;
    }

    const payload = {
      company_id: filters.company_id,
      month: Number(filters.month),
      year: Number(filters.year),
      required_hours: requiredHrs,
      daily_hours: dailyHrs,
      weekly_off: formData.weekly_off,
      holidays: current?.holidays || [],
    };

    console.log('💾 SAVING SETTINGS:', payload);

    setSaveLoading(true);

    try {
      const result = await dispatch(saveMonthlySettings(payload));

      if (result.meta.requestStatus === 'fulfilled') {
        console.log('✅ SAVED:', result.payload);

        // Re-fetch after small delay (ensures DB is updated)
        setTimeout(() => {
          dispatch(fetchMonthlySettings(filters));
        }, 300);
      } else {
        console.log('❌ SAVE FAILED:', result);
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Add Holiday
  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      alert('⚠️ Date and name required');
      return;
    }

    const [y, m, d] = newHoliday.date.split('-');
    const dateFormatted = `${parseInt(d)}/${parseInt(m)}/${y}`;

    await dispatch(addHoliday({
      company_id: filters.company_id,
      month: filters.month,
      year: filters.year,
      date: dateFormatted,
      name: newHoliday.name,
    }));

    setNewHoliday({ date: '', name: '' });

    setTimeout(() => {
      dispatch(fetchMonthlySettings(filters));
    }, 300);
  };

  // Remove Holiday
  const handleRemoveHoliday = async (date) => {
    if (!window.confirm(`Remove holiday on ${date}?`)) return;

    await dispatch(removeHoliday({
      company_id: filters.company_id,
      month: filters.month,
      year: filters.year,
      date,
    }));

    setTimeout(() => {
      dispatch(fetchMonthlySettings(filters));
    }, 300);
  };

  // Toggle Weekly Off
  const toggleWeeklyOff = (day) => {
    setFormData((prev) => ({
      ...prev,
      weekly_off: prev.weekly_off.includes(day)
        ? prev.weekly_off.filter((d) => d !== day)
        : [...prev.weekly_off, day],
    }));
  };

  // 🆕 Handle hours input — accept numbers only
  const handleHoursChange = (field, value) => {
    // Allow empty for editing
    if (value === '') {
      setFormData((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    const num = Number(value);
    if (!isNaN(num) && num >= 0) {
      setFormData((prev) => ({ ...prev, [field]: num }));
    }
  };

  // ════════════════════════════════════════
  // CALCULATIONS
  // ════════════════════════════════════════
  const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
  const totalDays = getDaysInMonth(filters.month, filters.year);

  const getWeeklyOffCount = () => {
    let count = 0;
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(filters.year, filters.month - 1, d);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      if (formData.weekly_off.includes(dayName)) count++;
    }
    return count;
  };

  const weeklyOffCount = getWeeklyOffCount();
  const holidayCount = current?.holidays?.length || 0;
  const workingDays = totalDays - weeklyOffCount - holidayCount;
  const calculatedHours = workingDays * Number(formData.daily_hours || 0);

  const selectedCompany = companies.find((c) => c._id === filters.company_id);

  // 🆕 Check if there are unsaved changes
  const hasUnsavedChanges = current && (
    Number(formData.required_hours) !== Number(current.required_hours) ||
    Number(formData.daily_hours) !== Number(current.daily_hours)
  );

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:py-8 sm:px-6">

        {/* HEADER */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1A2E]">Monthly Settings</h1>
                <span className="rounded-full bg-gradient-to-r from-[#E8590C] to-[#D14800] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  Global
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#9CA3AF]">Configure hours, holidays & weekly off</p>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 animate-fadeIn">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 animate-fadeIn">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {/* 🆕 UNSAVED CHANGES WARNING */}
        {hasUnsavedChanges && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            ⚠️ You have unsaved changes! Click "Save All Settings" below.
          </div>
        )}

        {/* FILTERS */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678" />
              </svg>
              <h2 className="text-sm sm:text-base font-bold text-[#1A1A2E]">Select Company & Period</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Company */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Company <span className="text-[#E8590C]">*</span>
                </label>
                <select
                  value={filters.company_id}
                  onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}
                  className="w-full appearance-none rounded-xl border-2 border-[#E8590C]/20 bg-[#FFF8F3] py-3 px-4 text-sm font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]"
                >
                  <option value="">— Select Company —</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Month
                </label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
                >
                  {monthNames.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Year
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCompany && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D44] p-4 text-white">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-300">Configuring for</p>
                  <p className="text-base sm:text-lg font-extrabold">{selectedCompany.name}</p>
                  <p className="text-xs text-gray-400">
                    {monthNames[filters.month - 1]} {filters.year} • {totalDays} days total
                  </p>
                  {/* 🆕 Show current saved value */}
                  {current && !current.is_default && (
                    <p className="mt-1 text-[10px] text-emerald-300">
                      💾 Current Saved: <strong>{current.required_hours}h</strong>
                    </p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] text-base font-bold shadow-lg">
                  {selectedCompany.code}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SETTINGS */}
        {filters.company_id ? (
          <>
            {/* ⏱️ HOURS SETTINGS */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E8]">
                    <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#1A1A2E]">Working Hours</h3>
                    <p className="text-xs text-[#9CA3AF]">Set required hours for salary calculation</p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {/* Inputs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Daily Hours */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Daily Hours <span className="text-[#E8590C]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={formData.daily_hours}
                        onChange={(e) => handleHoursChange('daily_hours', e.target.value)}
                        onBlur={(e) => {
                          // Ensure number when blur
                          const num = Number(e.target.value);
                          if (!num || num < 1) {
                            setFormData((prev) => ({ ...prev, daily_hours: 8 }));
                          }
                        }}
                        className="w-full rounded-xl border-2 border-gray-200 bg-[#FAFAFA] py-3 pl-4 pr-16 text-sm font-semibold outline-none transition-all focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-bold text-[#9CA3AF]">
                        hours
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-[#9CA3AF]">Standard hours per working day</p>
                  </div>

                  {/* Required Monthly Hours */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Required Monthly Hours <span className="text-[#E8590C]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={formData.required_hours}
                        onChange={(e) => handleHoursChange('required_hours', e.target.value)}
                        onBlur={(e) => {
                          const num = Number(e.target.value);
                          if (!num || num < 1) {
                            setFormData((prev) => ({ ...prev, required_hours: calculatedHours }));
                          }
                        }}
                        className={`w-full rounded-xl border-2 bg-[#FAFAFA] py-3 pl-4 pr-16 text-sm font-semibold outline-none transition-all focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)] ${
                          hasUnsavedChanges ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                        }`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-bold text-[#9CA3AF]">
                        hours
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-[#9CA3AF]">
                      Auto: <strong className="text-[#E8590C]">{calculatedHours}h</strong> ({workingDays} days × {formData.daily_hours}h)
                    </p>
                  </div>
                </div>

                {/* Auto-Calc Button */}
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, required_hours: calculatedHours }))}
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#E8590C]/30 bg-[#FFF3E8] px-4 py-2 text-xs font-bold text-[#E8590C] transition-all hover:bg-[#FFE5D0] hover:scale-[1.02]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Auto-Calculate ({calculatedHours}h)
                </button>

                {/* Stats Grid */}
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Total Days', value: totalDays, color: '#1A1A2E', bg: 'bg-gray-50' },
                    { label: 'Weekly Off', value: weeklyOffCount, color: '#7c3aed', bg: 'bg-purple-50' },
                    { label: 'Holidays', value: holidayCount, color: '#dc2626', bg: 'bg-red-50' },
                    { label: 'Working', value: workingDays, color: '#16a34a', bg: 'bg-emerald-50' },
                  ].map((s) => (
                    <div key={s.label} className={`flex items-center gap-3 rounded-xl ${s.bg} p-3 transition-all hover:scale-[1.02]`}>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${s.color}15`, color: s.color }}>
                        <span className="text-lg font-bold">{s.value}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-extrabold leading-tight sm:text-2xl" style={{ color: s.color }}>
                          {s.value}
                        </p>
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                          {s.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 📅 WEEKLY OFF */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#1A1A2E]">Weekly Off Days</h3>
                    <p className="text-xs text-[#9CA3AF]">Select days that are weekly holidays</p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {weekDays.map((day) => (
                    <label
                      key={day}
                      className={`relative cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${
                        formData.weekly_off.includes(day)
                          ? 'border-[#E8590C] bg-[#FFF3E8] shadow-sm scale-[1.02]'
                          : 'border-gray-200 bg-[#FAFAFA] hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.weekly_off.includes(day)}
                        onChange={() => toggleWeeklyOff(day)}
                        className="sr-only"
                      />
                      <p className={`text-xs font-bold ${formData.weekly_off.includes(day) ? 'text-[#E8590C]' : 'text-[#1A1A2E]'}`}>
                        {day.slice(0, 3)}
                      </p>
                      {formData.weekly_off.includes(day) && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E8590C] text-white shadow-md">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 💾 SAVE BUTTON */}
            <button
              onClick={handleSaveSettings}
              disabled={saveLoading || loading}
              className={`group relative mb-6 w-full overflow-hidden rounded-2xl py-3 sm:py-4 text-sm sm:text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-200/50 animate-pulse-slow'
                  : 'bg-gradient-to-r from-[#E8590C] to-[#D14800] shadow-orange-200/50'
              }`}
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center justify-center gap-2">
                {saveLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                    {hasUnsavedChanges ? '⚠️ Save Unsaved Changes' : 'Save All Settings'}
                  </>
                )}
              </span>
            </button>

            {/* 🎉 HOLIDAYS */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-[#1A1A2E] truncate">
                      Holidays — {monthNames[filters.month - 1]} {filters.year}
                    </h3>
                    <p className="text-xs text-[#9CA3AF]">Add public holidays</p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {/* Add Holiday Form */}
                <div className="mb-5 rounded-xl border border-[#E8590C]/20 bg-[#FFF8F3] p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#E8590C]">
                    ➕ Add New Holiday
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <input
                      type="date"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E8590C] sm:col-span-4"
                    />
                    <input
                      type="text"
                      placeholder="Holiday name (e.g. Diwali)"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E8590C] sm:col-span-5"
                    />
                    <button
                      onClick={handleAddHoliday}
                      type="button"
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all sm:col-span-3"
                    >
                      ➕ Add
                    </button>
                  </div>
                </div>

                {/* Holidays List */}
                {current?.holidays && current.holidays.length > 0 ? (
                  <div className="space-y-2">
                    {current.holidays.map((h, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-[#faf8f5] px-4 py-3 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#1A1A2E] truncate">{h.name}</p>
                            <p className="text-xs text-[#9CA3AF]">{h.date}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveHoliday(h.date)}
                          type="button"
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-gray-50 p-8 text-center">
                    <p className="text-sm text-[#9CA3AF]">No holidays added for this month</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* No Company Selected */
          <div className="rounded-2xl bg-white p-8 sm:p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3E8]">
              <svg className="h-8 w-8 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18" />
              </svg>
            </div>
            <p className="text-base font-bold text-[#1A1A2E]">Select a Company</p>
            <p className="mt-1 text-sm text-[#9CA3AF]">Choose a company from dropdown to configure settings</p>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }

        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-slow { animation: pulseSlow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default SuperAdminMonthlySettings;
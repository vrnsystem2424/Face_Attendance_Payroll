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

const MonthlySettings = () => {
  const dispatch = useDispatch();
  const { current, loading, message, error } = useSelector((s) => s.monthlySettings);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Form state
  const [requiredHours, setRequiredHours] = useState(240);
  const [dailyHours, setDailyHours] = useState(8);
  const [weeklyOff, setWeeklyOff] = useState(['Sunday']);

  // Holiday form
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch on mount/change
  useEffect(() => {
    dispatch(fetchMonthlySettings({ month, year }));
  }, [dispatch, month, year]);

  // Sync form with fetched data
  useEffect(() => {
    if (current) {
      setRequiredHours(current.required_hours || 240);
      setDailyHours(current.daily_hours || 8);
      setWeeklyOff(current.weekly_off || ['Sunday']);
    }
  }, [current]);

  // Auto-clear messages
  useEffect(() => {
    if (message || error) {
      const t = setTimeout(() => {
        dispatch(clearSettingsMessage());
        dispatch(clearSettingsError());
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [message, error, dispatch]);

  // Toggle weekly off
  const toggleWeekday = (day) => {
    setWeeklyOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Save settings
  const handleSave = async () => {
    await dispatch(saveMonthlySettings({
      month,
      year,
      required_hours: parseInt(requiredHours),
      daily_hours: parseInt(dailyHours),
      weekly_off: weeklyOff,
      holidays: current?.holidays || [],
    }));
    dispatch(fetchMonthlySettings({ month, year }));
  };

  // Add holiday
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayDate || !holidayName) return;

    // Convert YYYY-MM-DD to D/M/YYYY
    const [y, m, d] = holidayDate.split('-');
    const formattedDate = `${parseInt(d)}/${parseInt(m)}/${y}`;

    await dispatch(addHoliday({
      month, year,
      date: formattedDate,
      name: holidayName.trim(),
    }));

    setHolidayDate('');
    setHolidayName('');
    setShowHolidayForm(false);
  };

  // Remove holiday
  const handleRemoveHoliday = async (date) => {
    if (window.confirm(`Remove holiday on ${date}?`)) {
      await dispatch(removeHoliday({ month, year, date }));
    }
  };

  // Helpers
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalWeekendDays = (() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayName = weekdays[date.getDay()];
      if (weeklyOff.includes(dayName)) count++;
    }
    return count;
  })();
  const workingDays = daysInMonth - totalWeekendDays - (current?.holidays?.length || 0);
  const autoRequiredHours = workingDays * dailyHours;

  const inputCls = "w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-4 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]";

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* ════════ HEADER ════════ */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1A1A2E]">Monthly Settings</h1>
              <p className="text-xs text-[#9CA3AF]">Configure hours & holidays per month</p>
            </div>
          </div>

          {/* Month/Year picker */}
          <div className="flex gap-2">
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]">
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 animate-resultIn">
            ✓ {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 animate-resultIn">
            ❌ {error}
          </div>
        )}

        {/* ════════ INFO BANNER (default settings) ════════ */}
        {current?.is_default && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#E8590C]/20 bg-[#FFF8F3] px-4 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#E8590C]/10">
              <svg className="h-4 w-4 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#E8590C]">Default Settings</p>
              <p className="mt-0.5 text-xs text-[#4B5563]">
                No settings saved for {months[month - 1]} {year} yet. Customize below and click Save.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
          </div>
        )}

        {/* ════════ STATS OVERVIEW ════════ */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Days in Month', value: daysInMonth, color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Weekend Days', value: totalWeekendDays, color: '#0891b2', bg: '#ecfeff' },
            { label: 'Holidays', value: current?.holidays?.length || 0, color: '#d97706', bg: '#fffbeb' },
            { label: 'Working Days', value: workingDays, color: '#16a34a', bg: '#f0fdf4' },
          ].map((card) => (
            <div key={card.label} className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
              <div className="h-1 w-full" style={{ background: card.color }} />
              <div className="p-4">
                <p className="text-2xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
                <p className="mt-0.5 text-xs font-medium text-[#9CA3AF]">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ════════ MAIN GRID ════════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* ─── LEFT: HOURS SETTINGS ─── */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
            <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E8]">
                  <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1A2E]">Hours Configuration</h3>
                  <p className="text-xs text-[#9CA3AF]">Set monthly working hours</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Required Hours */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Required Hours This Month <span className="text-[#E8590C]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="744"
                      value={requiredHours}
                      onChange={(e) => setRequiredHours(e.target.value)}
                      className={`${inputCls} pr-16`}
                    />
                    <span className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-[#9CA3AF]">
                      hours
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-[#9CA3AF]">
                      Total target hours employees must complete
                    </p>
                    <button
                      type="button"
                      onClick={() => setRequiredHours(autoRequiredHours)}
                      className="rounded-lg bg-[#FFF3E8] px-2.5 py-1 text-[10px] font-bold text-[#E8590C] hover:bg-[#E8590C] hover:text-white transition-colors"
                    >
                      Auto: {autoRequiredHours}h
                    </button>
                  </div>
                </div>

                {/* Daily Hours */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Daily Standard Hours <span className="text-[#E8590C]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={dailyHours}
                      onChange={(e) => setDailyHours(e.target.value)}
                      className={`${inputCls} pr-16`}
                    />
                    <span className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-[#9CA3AF]">
                      hours
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#9CA3AF]">
                    Used for leave credit calculation
                  </p>
                </div>

                {/* Weekly Off */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Weekly Off Days
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {weekdays.map((day) => {
                      const isSelected = weeklyOff.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleWeekday(day)}
                          className={`rounded-lg px-2 py-2 text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#E8590C] to-[#D14800] text-white shadow-md shadow-orange-200/40'
                              : 'border border-gray-200 bg-white text-[#4B5563] hover:bg-gray-50'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-[#9CA3AF]">
                    Selected: <span className="font-semibold text-[#E8590C]">{weeklyOff.join(', ') || 'None'}</span>
                  </p>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-55"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Save Settings
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: HOLIDAYS ─── */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
            <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500" />
            <div className="p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1A1A2E]">Holidays</h3>
                    <p className="text-xs text-[#9CA3AF]">{current?.holidays?.length || 0} configured</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowHolidayForm(!showHolidayForm)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    showHolidayForm
                      ? 'border border-gray-200 bg-white text-[#4B5563]'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-200/40 hover:-translate-y-0.5'
                  }`}
                >
                  {showHolidayForm ? 'Cancel' : '+ Add Holiday'}
                </button>
              </div>

              {/* Add holiday form */}
              {showHolidayForm && (
                <form onSubmit={handleAddHoliday} className="mb-5 space-y-3 rounded-xl border border-purple-100 bg-purple-50/50 p-4 animate-formIn">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#1A1A2E]">
                      Holiday Date <span className="text-purple-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={holidayDate}
                      onChange={(e) => setHolidayDate(e.target.value)}
                      min={`${year}-${String(month).padStart(2, '0')}-01`}
                      max={`${year}-${String(month).padStart(2, '0')}-${daysInMonth}`}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#1A1A2E]">
                      Holiday Name <span className="text-purple-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      placeholder="e.g. Diwali, Republic Day"
                      required
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-200/40 hover:-translate-y-0.5 transition-all"
                  >
                    Add Holiday
                  </button>
                </form>
              )}

              {/* Holidays list */}
              {(!current?.holidays || current.holidays.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">
                    <svg className="h-6 w-6 text-purple-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#9CA3AF]">No holidays added yet</p>
                  <p className="mt-0.5 text-[11px] text-[#C0C0C0]">Click "Add Holiday" to start</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {current.holidays.map((h, i) => (
                    <div key={i} className="group flex items-center justify-between rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 transition-all hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                          {h.date.split('/')[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1A1A2E]">{h.name}</p>
                          <p className="text-[11px] text-[#9CA3AF]">{h.date}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveHoliday(h.date)}
                        className="rounded-lg border border-red-100 bg-white p-1.5 text-red-500 opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════ INFO BOX ════════ */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8590C]/15 bg-gradient-to-br from-[#FFF8F3] to-[#FFF3E8]">
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#E8590C]/10">
              <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#E8590C]">How Calculation Works</p>
              <div className="mt-2 space-y-1.5 text-xs text-[#4B5563]">
                <p>• <strong>Required Hours:</strong> Total hours employees must work this month</p>
                <p>• <strong>Daily Hours:</strong> Used for leave credit (full day = 8h, half day = 4h)</p>
                <p>• <strong>Weekly Off:</strong> Excluded from working days</p>
                <p>• <strong>Holidays:</strong> Paid days, employees get credit even without attendance</p>
                <p>• <strong>Auto-calculation:</strong> {workingDays} working days × {dailyHours}h = {autoRequiredHours}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes formIn {
          from { opacity:0; transform:translateY(-8px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .animate-formIn { animation:formIn .25s ease-out }
        @keyframes resultIn {
          from { opacity:0; transform:translateY(-10px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .animate-resultIn { animation:resultIn .3s ease-out }
      `}</style>
    </div>
  );
};

export default MonthlySettings;

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCompanyPayroll,
  fetchCompanyDepartments,
  downloadPayrollPDF,
  clearPayrollData,
} from '../../redux/slices/payrollSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const PayrollReports = () => {
  const dispatch = useDispatch();
  const { payrollData, departments, loading, downloading } = useSelector((s) => s.payroll);
  const { companies } = useSelector((s) => s.company);

  console.log('👤 PayrollReports:', { payrollData, departments, loading, downloading, companies });
  const today = new Date();
  const [filters, setFilters] = useState({
    company_id: '',
    department: 'all',
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  // 🆕 Calculation Method Toggle
  const [calcMethod, setCalcMethod] = useState('hours'); // 'hours' | 'days' | 'both'

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = [];
  for (let y = today.getFullYear(); y >= today.getFullYear() - 3; y--) years.push(y);

  useEffect(() => {
    dispatch(fetchCompanies());
    return () => dispatch(clearPayrollData());
  }, [dispatch]);

  useEffect(() => {
    if (filters.company_id) {
      dispatch(fetchCompanyDepartments(filters.company_id));
    }
  }, [filters.company_id, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === 'company_id') {
      setFilters((prev) => ({ ...prev, company_id: value, department: 'all' }));
    }
  };

  const handleGenerate = () => {
    if (!filters.company_id) {
      alert('Please select a company first');
      return;
    }
    dispatch(fetchCompanyPayroll(filters));
  };

  const handleDownloadPDF = () => {
    if (!payrollData) {
      alert('Please generate report first');
      return;
    }
    dispatch(downloadPayrollPDF({
      ...filters,
      company_name: payrollData.company?.code,
      month_name: payrollData.month_name,
      calc_method: calcMethod,
    }));
  };

  const formatINR = (num) => {
    if (!num && num !== 0) return '₹0';
    return '₹' + Number(num).toLocaleString('en-IN');
  };

  // ════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════
  const getWorkingDays = () => {
    if (!payrollData?.employees?.length) return 0;
    return payrollData.employees[0].total_working_days || 0;
  };

  const getRequiredHours = () => {
    if (!payrollData) return 0;
    return payrollData.employees?.[0]?.targeted_hours
      || payrollData.settings?.required_hours
      || 0;
  };

  const getTotalDaysInMonth = () => {
    if (!payrollData) return 0;
    return new Date(payrollData.year, payrollData.month, 0).getDate();
  };

  const getWeeklyOffCount = () => {
    if (!payrollData) return 0;
    const month = payrollData.month;
    const year = payrollData.year;
    const totalDays = new Date(year, month, 0).getDate();
    const weeklyOff = payrollData.settings?.weekly_off || ['Sunday'];
    let count = 0;
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month - 1, d);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      if (weeklyOff.includes(dayName)) count++;
    }
    return count;
  };

  // 🆕 Get totals based on selected method
  const getTotalEarned = () => {
    if (!payrollData) return 0;
    if (calcMethod === 'days') return payrollData.summary.total_earned_days || 0;
    return payrollData.summary.total_earned_hours || payrollData.summary.total_earned || 0;
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-[1300px] px-4 py-8 sm:px-6">

        {/* ════════════════════════════════════════ */}
        {/* HEADER                                   */}
        {/* ════════════════════════════════════════ */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A2E]">Payroll Reports</h1>
                <span className="rounded-full bg-gradient-to-r from-[#E8590C] to-[#D14800] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  Dual Mode
                </span>
              </div>
              <p className="text-sm text-[#9CA3AF]">Compare Hours-based vs Days-based salary</p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* FILTERS                                  */}
        {/* ════════════════════════════════════════ */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Company */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Company <span className="text-[#E8590C]">*</span>
                </label>
                <select
                  value={filters.company_id}
                  onChange={(e) => handleFilterChange('company_id', e.target.value)}
                  className="w-full appearance-none rounded-xl border-2 border-[#E8590C]/20 bg-[#FFF8F3] py-3 px-4 text-sm font-semibold outline-none focus:border-[#E8590C]"
                >
                  <option value="">— Select Company —</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  disabled={!filters.company_id}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C] disabled:opacity-50"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
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
                  onChange={(e) => handleFilterChange('month', Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
                >
                  {monthNames.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Year
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !filters.company_id}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>🔍 Generate Report</>
                )}
              </button>

              {payrollData && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {downloading ? 'Downloading...' : '📄 Download PDF'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && !payrollData && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E8590C]/20 border-t-[#E8590C]" />
            <p className="mt-4 text-sm font-medium text-[#9CA3AF]">Calculating payroll...</p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !payrollData && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
            <p className="text-base font-semibold text-[#1A1A2E]">Select filters & generate report</p>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* PAYROLL DATA                             */}
        {/* ════════════════════════════════════════ */}
        {payrollData && (
          <>
            {/* Company Info Card with 4 Stats */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D44] p-6 text-white shadow-md">
              {/* Top — Company Info + Required Hours */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] text-xl font-bold shadow-lg">
                    {payrollData.company?.code}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold">{payrollData.company?.name}</h2>
                    {payrollData.company?.address && (
                      <p className="mt-0.5 text-sm text-gray-300">{payrollData.company.address}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      Period: <span className="font-semibold text-white">{payrollData.month_name} {payrollData.year}</span>
                      {payrollData.department !== 'all' && (
                        <> • Dept: <span className="font-semibold text-white">{payrollData.department}</span></>
                      )}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] px-6 py-3 shadow-lg">
                  <p className="text-[10px] uppercase tracking-wider text-white/80">Required Hours</p>
                  <p className="text-3xl font-extrabold text-white">{getRequiredHours()}h</p>
                </div>
              </div>

              {/* BOTTOM — 4 Stats Cards */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {/* Total Days */}
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur transition-all hover:bg-white/15">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-500/30">
                      <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-300">Total Days</p>
                      <p className="text-2xl font-extrabold text-white">{getTotalDaysInMonth()}</p>
                    </div>
                  </div>
                </div>

                {/* Weekly Off */}
                <div className="rounded-xl bg-purple-500/15 p-3 backdrop-blur transition-all hover:bg-purple-500/20">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/30">
                      <svg className="h-5 w-5 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 6v6h4.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-purple-200">Weekly Off</p>
                      <p className="text-2xl font-extrabold text-purple-300">{getWeeklyOffCount()}</p>
                    </div>
                  </div>
                </div>

                {/* Holidays */}
                <div className="rounded-xl bg-red-500/15 p-3 backdrop-blur transition-all hover:bg-red-500/20">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/30">
                      <svg className="h-5 w-5 text-red-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-red-200">Holidays</p>
                      <p className="text-2xl font-extrabold text-red-300">
                        {payrollData.settings?.holidays_count || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Working Days */}
                <div className="rounded-xl bg-emerald-500/15 p-3 backdrop-blur transition-all hover:bg-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/30">
                      <svg className="h-5 w-5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-200">Working</p>
                      <p className="text-2xl font-extrabold text-emerald-300">{getWorkingDays()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🆕 CALCULATION METHOD TOGGLE */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A2E]">💡 Salary Calculation Method</h3>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      Choose how MD wants to pay — based on Hours worked or Days present
                    </p>
                  </div>
                  <div className="flex gap-2 bg-[#faf8f5] p-1 rounded-xl">
                    <button
                      onClick={() => setCalcMethod('hours')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        calcMethod === 'hours'
                          ? 'bg-gradient-to-r from-[#E8590C] to-[#D14800] text-white shadow-md'
                          : 'text-[#9CA3AF] hover:text-[#1A1A2E]'
                      }`}
                    >
                      ⏱️ Hours Based
                    </button>
                    <button
                      onClick={() => setCalcMethod('days')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        calcMethod === 'days'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                          : 'text-[#9CA3AF] hover:text-[#1A1A2E]'
                      }`}
                    >
                      📅 Days Based
                    </button>
                    <button
                      onClick={() => setCalcMethod('both')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        calcMethod === 'both'
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                          : 'text-[#9CA3AF] hover:text-[#1A1A2E]'
                      }`}
                    >
                      📊 Compare Both
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Total Employees', value: payrollData.summary.total_employees, color: '#7c3aed', bg: '#f5f3ff', isMoney: false },
                { label: 'Total Salary', value: payrollData.summary.total_monthly_salary, color: '#1A1A2E', bg: '#f3f4f6', isMoney: true },
                { label: `Total Earned (${calcMethod === 'days' ? 'Days' : 'Hours'})`, value: getTotalEarned(), color: '#16a34a', bg: '#f0fdf4', isMoney: true },
                { label: `Net Payable (${calcMethod === 'days' ? 'Days' : 'Hours'})`, value: getTotalEarned(), color: '#E8590C', bg: '#FFF3E8', isMoney: true, highlight: true },
              ].map((s) => (
                <div key={s.label} className={`overflow-hidden rounded-2xl bg-white shadow-sm hover:-translate-y-0.5 transition-all ${s.highlight ? 'ring-2 ring-[#E8590C]/20' : ''}`}>
                  <div className="h-1" style={{ background: s.color }} />
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">{s.label}</p>
                    <p className="mt-1 text-2xl font-extrabold" style={{ color: s.color }}>
                      {s.isMoney ? formatINR(s.value) : s.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Banner */}
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
              <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-[11px] text-blue-900">
                <strong>💡 How it works:</strong> First 2 leaves/month are FREE. Unused leaves <strong>carry forward</strong> to next month.
                &nbsp;<strong>⏱ Hours:</strong> (Worked + Paid Leave Hrs) / Required × Salary
                &nbsp;|&nbsp; <strong>📅 Days:</strong> (Present + Paid Leaves) / Working Days × Salary
              </p>
            </div>

            {/* ════════════════════════════════════════ */}
            {/* TABLE — With Carry Forward & Dual Method */}
            {/* ════════════════════════════════════════ */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-[#1A1A2E]">Employee Salary Details</h3>
                  <p className="text-xs text-[#9CA3AF]">{payrollData.employees.length} employees</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FFF3E8] text-[#E8590C]">
                  Method: {calcMethod === 'both' ? 'Compare' : calcMethod === 'hours' ? 'Hours' : 'Days'}
                </span>
              </div>

              {payrollData.employees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-sm text-[#9CA3AF]">No employees found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#faf8f5]">
                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Sr</th>
                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Employee</th>
                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-emerald-700">Present</th>
                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-red-700">Absent</th>
                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-blue-700">Leaves</th>
                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-purple-700">Carry→</th>
                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Worked</th>
                        <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Salary</th>

                        {/* HOURS COLUMNS */}
                        {(calcMethod === 'hours' || calcMethod === 'both') && (
                          <>
                            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-orange-700">⏱ %</th>
                            <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-red-700">⏱ Cut</th>
                            <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-[#E8590C]">⏱ Net</th>
                          </>
                        )}

                        {/* DAYS COLUMNS */}
                        {(calcMethod === 'days' || calcMethod === 'both') && (
                          <>
                            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700">📅 %</th>
                            <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-red-700">📅 Cut</th>
                            <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700">📅 Net</th>
                          </>
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-50">
                      {payrollData.employees.map((emp, idx) => (
                        <tr key={emp.emp_id} className="transition-colors hover:bg-[#faf8f5]">
                          <td className="px-3 py-4 text-[#9CA3AF] text-xs">{idx + 1}</td>

                          <td className="px-3 py-4">
                            <p className="font-semibold text-[#1A1A2E] text-sm">{emp.name}</p>
                            <p className="text-[11px] text-[#9CA3AF] font-mono">{emp.emp_code}</p>
                          </td>

                          {/* Present */}
                          <td className="px-3 py-4 text-center">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">
                              {emp.total_present || 0}
                            </span>
                          </td>

                          {/* Absent */}
                          <td className="px-3 py-4 text-center">
                            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                              emp.total_absent > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400'
                            }`}>
                              {emp.total_absent || 0}
                            </span>
                          </td>

                          {/* Leaves */}
                          <td className="px-3 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                                {emp.total_leave_approved || 0}
                              </span>
                              {emp.unpaid_leave_days > 0 && (
                                <span className="mt-0.5 text-[9px] font-bold text-red-600">
                                  {emp.unpaid_leave_days} unpaid
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Carry Forward */}
                          <td className="px-3 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-purple-50 px-2 text-sm font-bold text-purple-700">
                                {emp.leave_closing_balance || 0}
                              </span>
                              {emp.leave_opening_balance > 0 && (
                                <span className="mt-0.5 text-[9px] font-bold text-purple-500">
                                  +{emp.leave_opening_balance} prev
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Worked Hours */}
                          <td className="px-3 py-4">
                            <p className="font-semibold text-[#1A1A2E] text-sm">{emp.worked_hours}</p>
                            <p className="text-[10px] text-[#9CA3AF]">of {emp.targeted_hours}h</p>
                          </td>

                          {/* Salary */}
                          <td className="px-3 py-4 text-right text-[#1A1A2E] text-sm font-semibold">
                            {formatINR(emp.monthly_salary)}
                          </td>

                          {/* ═══ HOURS BASED ═══ */}
                          {(calcMethod === 'hours' || calcMethod === 'both') && (
                            <>
                              <td className="px-3 py-4 text-center bg-orange-50/30">
                                <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-bold ${
                                  emp.hours_based.progress_percent >= 100
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : emp.hours_based.progress_percent >= 80
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {emp.hours_based.progress_percent}%
                                </span>
                              </td>
                              <td className="px-3 py-4 text-right text-sm bg-orange-50/30">
                                {emp.hours_based.deduction > 0 ? (
                                  <span className="font-semibold text-red-600">{formatINR(emp.hours_based.deduction)}</span>
                                ) : (
                                  <span className="text-emerald-600 font-bold">—</span>
                                )}
                              </td>
                              <td className="px-3 py-4 text-right bg-orange-50/30">
                                <span className="rounded-lg bg-[#FFF3E8] px-3 py-1.5 text-sm font-extrabold text-[#E8590C]">
                                  {formatINR(emp.hours_based.net_payable)}
                                </span>
                              </td>
                            </>
                          )}

                          {/* ═══ DAYS BASED ═══ */}
                          {(calcMethod === 'days' || calcMethod === 'both') && (
                            <>
                              <td className="px-3 py-4 text-center bg-blue-50/30">
                                <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-bold ${
                                  emp.days_based.progress_percent >= 100
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : emp.days_based.progress_percent >= 80
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {emp.days_based.progress_percent}%
                                </span>
                              </td>
                              <td className="px-3 py-4 text-right text-sm bg-blue-50/30">
                                {emp.days_based.deduction > 0 ? (
                                  <span className="font-semibold text-red-600">{formatINR(emp.days_based.deduction)}</span>
                                ) : (
                                  <span className="text-emerald-600 font-bold">—</span>
                                )}
                              </td>
                              <td className="px-3 py-4 text-right bg-blue-50/30">
                                <span className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-extrabold text-blue-700">
                                  {formatINR(emp.days_based.net_payable)}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {/* GRAND TOTAL */}
                      <tr className="bg-gradient-to-r from-[#1A1A2E] to-[#2D2D44] text-white">
                        <td colSpan="2" className="px-3 py-4 font-bold uppercase tracking-wider text-xs">
                          GRAND TOTAL
                        </td>
                        <td className="px-3 py-4 text-center text-emerald-300 font-bold text-sm">
                          {payrollData.summary.total_present || 0}
                        </td>
                        <td className="px-3 py-4 text-center text-red-300 font-bold text-sm">
                          {payrollData.summary.total_absent || 0}
                        </td>
                        <td className="px-3 py-4 text-center text-blue-300 font-bold text-sm">
                          {payrollData.summary.total_leaves || 0}
                        </td>
                        <td className="px-3 py-4 text-center text-purple-300 font-bold text-sm">
                          {payrollData.summary.total_carry_forward || 0}
                        </td>
                        <td></td>
                        <td className="px-3 py-4 text-right font-bold text-sm">
                          {formatINR(payrollData.summary.total_monthly_salary)}
                        </td>

                        {(calcMethod === 'hours' || calcMethod === 'both') && (
                          <>
                            <td className="bg-orange-900/30"></td>
                            <td className="px-3 py-4 text-right font-bold text-red-300 text-sm bg-orange-900/30">
                              {formatINR(payrollData.summary.total_deduction_hours || 0)}
                            </td>
                            <td className="px-3 py-4 text-right bg-orange-900/30">
                              <span className="rounded-lg bg-[#E8590C] px-3 py-1.5 text-sm font-extrabold">
                                {formatINR(payrollData.summary.total_earned_hours || 0)}
                              </span>
                            </td>
                          </>
                        )}

                        {(calcMethod === 'days' || calcMethod === 'both') && (
                          <>
                            <td className="bg-blue-900/30"></td>
                            <td className="px-3 py-4 text-right font-bold text-red-300 text-sm bg-blue-900/30">
                              {formatINR(payrollData.summary.total_deduction_days || 0)}
                            </td>
                            <td className="px-3 py-4 text-right bg-blue-900/30">
                              <span className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-extrabold">
                                {formatINR(payrollData.summary.total_earned_days || 0)}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PayrollReports;
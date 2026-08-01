import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMySalary, clearPayrollData } from '../redux/slices/payrollSlice';

const MySalary = () => {
  const dispatch = useDispatch();
  const { mySalary, loading, error } = useSelector((s) => s.payroll);
  const { employee } = useSelector((s) => s.auth);

  const today = new Date();
  const [filters, setFilters] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = [];
  for (let y = today.getFullYear(); y >= today.getFullYear() - 2; y--) years.push(y);

  useEffect(() => {
    dispatch(fetchMySalary(filters));
    return () => dispatch(clearPayrollData());
  }, [dispatch, filters]);

  const fmt = (num) => {
    if (!num && num !== 0) return '₹0';
    return '₹' + Number(num).toLocaleString('en-IN');
  };

  const p = mySalary?.payroll || {};
  const c = mySalary?.company || {};

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 py-8 sm:px-6">

        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1A1A2E]">My Salary</h1>
            <p className="text-sm text-[#9CA3AF]">Your monthly salary breakdown</p>
          </div>
        </div>

        {/* MONTH/YEAR FILTER */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Month</label>
                <select value={filters.month} onChange={e => setFilters(prev => ({ ...prev, month: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none">
                  {monthNames.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Year</label>
                <select value={filters.year} onChange={e => setFilters(prev => ({ ...prev, year: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center rounded-2xl bg-white py-20 shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E8590C]/20 border-t-[#E8590C]" />
            <p className="mt-4 text-sm text-[#9CA3AF]">Loading your salary...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-700 font-semibold">❌ {error}</p>
          </div>
        )}

        {/* NO DATA */}
        {!loading && !error && !mySalary && (
          <div className="flex items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
            <p className="text-base font-semibold text-[#1A1A2E]">Select month & year</p>
          </div>
        )}

        {/* DATA */}
        {!loading && mySalary && (
          <>
            {/* EMPLOYEE + PERIOD INFO */}
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D44] p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] text-2xl font-bold shadow-lg">
                    {employee?.name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold">{employee?.name}</h2>
                    <p className="text-sm text-gray-300">{p.emp_code} • {employee?.designation}</p>
                    <p className="text-xs text-gray-400">{c.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-gray-400 tracking-wider">Period</p>
                  <p className="text-xl font-extrabold">{mySalary.month_name} {mySalary.year}</p>
                  {mySalary.is_finalized ? (
                    <span className="mt-1 inline-block text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold">
                      ✅ Finalized
                    </span>
                  ) : (
                    <span className="mt-1 inline-block text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-bold">
                      ⏳ Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* TOP METRICS */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="h-1 bg-[#1A1A2E]" />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase text-[#9CA3AF]">Base Salary</p>
                  <p className="mt-1 text-2xl font-extrabold text-[#1A1A2E]">{fmt(p.monthly_salary)}</p>
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">Per day: {fmt(p.per_day_rate)}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="h-1 bg-emerald-500" />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase text-[#9CA3AF]">Earned</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-600">{fmt(p.earned_salary)}</p>
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">{p.final_payable_days}/{p.total_days_in_month} days</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="h-1 bg-red-500" />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase text-[#9CA3AF]">Deduction</p>
                  <p className="mt-1 text-2xl font-extrabold text-red-600">
                    {(p.total_deduction || 0) > 0 ? fmt(p.total_deduction) : '—'}
                  </p>
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">Cut from salary</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md text-white">
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase opacity-80">Net Payable</p>
                  <p className="mt-1 text-2xl font-extrabold">{fmt(p.net_payable)}</p>
                  <p className="mt-1 text-[10px] opacity-80">{p.progress_percent}% of salary</p>
                </div>
              </div>
            </div>

            {/* ATTENDANCE BREAKDOWN */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Attendance Card */}
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h3 className="text-base font-bold text-[#1A1A2E]">📊 Attendance Summary</h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Total Days in Month</span>
                    <span className="text-lg font-bold text-[#1A1A2E]">{p.total_days_in_month}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Present Days</span>
                    <span className="text-lg font-bold text-emerald-600">{p.total_present}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Sunday Worked (Bonus)</span>
                    <span className="text-lg font-bold text-cyan-600">+{p.sunday_worked}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Weekly Off (Paid)</span>
                    <span className="text-lg font-bold text-purple-600">{p.weekly_off_paid}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Late Count</span>
                    <span className="text-lg font-bold text-amber-600">
                      {p.late_count} {p.late_leave_deduction > 0 && `(-${p.late_leave_deduction}d)`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Half Days</span>
                    <span className="text-lg font-bold text-orange-600">
                      {(p.half_day_count || 0) + (p.half_day_leave_count || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-[#6B7280]">Absent Days</span>
                    <span className="text-lg font-bold text-red-600">{p.total_absent}</span>
                  </div>
                </div>
              </div>

              {/* Leave Card */}
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h3 className="text-base font-bold text-[#1A1A2E]">💰 Leave Balance</h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Opening Balance</span>
                    <span className="text-lg font-bold text-[#1A1A2E]">{p.leave_opening_balance}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Credited This Month</span>
                    <span className="text-lg font-bold text-emerald-600">+{p.leave_credited}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Available Balance</span>
                    <span className="text-lg font-bold text-teal-600">{p.leave_available}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Leaves Taken (Full + Half)</span>
                    <span className="text-lg font-bold text-blue-600">{p.total_leave_approved}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-[#6B7280]">Paid Leaves</span>
                    <span className="text-lg font-bold text-cyan-600">{p.paid_leave_days}</span>
                  </div>
                  {(p.unpaid_leave_days || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-[#6B7280]">Unpaid Leaves</span>
                      <span className="text-lg font-bold text-red-600">{p.unpaid_leave_days}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 bg-indigo-50 -mx-6 px-6 rounded-lg mt-3">
                    <span className="text-sm font-semibold text-indigo-900">Carry Forward (Next Month)</span>
                    <span className="text-xl font-extrabold text-indigo-700">{p.leave_closing_balance}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SALARY CALCULATION */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-[#FFF8F3] to-white">
                <h3 className="text-base font-bold text-[#1A1A2E]">🎯 Salary Calculation</h3>
              </div>
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-[13px] text-blue-900 font-mono">
                    <strong>Formula:</strong><br/>
                    Final Days = Present ({p.total_present}) + Sunday Worked ({p.sunday_worked}) + Weekly Off ({p.weekly_off_paid}) + Paid Leave ({p.paid_leave_days}) - Late Deduction ({p.late_leave_deduction}) = <strong className="text-lg">{p.final_payable_days}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-xs uppercase text-emerald-700 font-bold">Payable Days</p>
                    <p className="text-3xl font-extrabold text-emerald-700 mt-1">{p.final_payable_days}</p>
                    <p className="text-xs text-emerald-600 mt-1">out of {p.total_days_in_month} days</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs uppercase text-amber-700 font-bold">Salary %</p>
                    <p className="text-3xl font-extrabold text-amber-700 mt-1">{p.progress_percent}%</p>
                    <p className="text-xs text-amber-600 mt-1">of base salary</p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-xs uppercase text-orange-700 font-bold">Net Payable</p>
                    <p className="text-3xl font-extrabold text-orange-700 mt-1">{fmt(p.net_payable)}</p>
                    <p className="text-xs text-orange-600 mt-1">after deductions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* STATUS NOTE */}
            <div className={`rounded-xl p-4 border ${mySalary.is_finalized 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-amber-50 border-amber-200'}`}>
              <p className="text-sm">
                {mySalary.is_finalized ? (
                  <>
                    <strong className="text-emerald-800">✅ Payroll Finalized:</strong>
                    <span className="text-emerald-700"> Ye salary confirmed hai. Leave balance already deduct ho chuka hai.</span>
                  </>
                ) : (
                  <>
                    <strong className="text-amber-800">⏳ Payroll Pending:</strong>
                    <span className="text-amber-700"> Ye estimate hai. Month end pe admin finalize karega, tab final salary hogi.</span>
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MySalary;
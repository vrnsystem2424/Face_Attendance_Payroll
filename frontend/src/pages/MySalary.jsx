

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
           

            {/* ATTENDANCE BREAKDOWN */}

             {/* <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2"> */}

          

            {/* SALARY CALCULATION */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-[#FFF8F3] to-white">
                <h3 className="text-base font-bold text-[#1A1A2E]">🎯 Salary Calculation</h3>
              </div>
              <div className="p-6">
                
                {/* ✅ UPDATED FORMULA TEXT (Added Holidays & Half Days) */}
                 {/* <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-[13px] text-blue-900 font-mono">
                    <strong>Formula:</strong><br/>
                    Final Days = Present ({p.total_present}) + Sunday Worked ({p.sunday_worked}) + Weekly Off ({p.weekly_off_paid}) + Holidays ({p.holiday_paid || p.holiday_count || 0}) + Paid Leave ({p.paid_leave_days}) + Half Days ({p.half_day_value || 0}) - Late Deduction ({p.late_leave_deduction}) = <strong className="text-lg">{p.final_payable_days}</strong>
                  </p>
                </div>  */}

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

                   {/* <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-xs uppercase text-orange-700 font-bold">Net Payable</p>
                    <p className="text-3xl font-extrabold text-orange-700 mt-1">{fmt(p.net_payable)}</p>
                    <p className="text-xs text-orange-600 mt-1">after deductions</p>
                  </div>  */}
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
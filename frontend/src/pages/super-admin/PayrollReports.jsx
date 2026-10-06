
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCompanyPayroll,
  fetchCompanyDepartments,
  downloadPayrollPDF,
  downloadPayrollCSV,
  finalizePayroll,
  clearPayrollData,
} from '../../redux/slices/payrollSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const PayrollReports = () => {
  const dispatch = useDispatch();
  const { payrollData, departments, loading, downloading, downloadingCSV, finalizing } = useSelector((s) => s.payroll);
  const { companies } = useSelector((s) => s.company);

  const today = new Date();
  const [filters, setFilters] = useState({
    company_id: '',
    department: 'all',
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = [];
  for (let y = today.getFullYear(); y >= today.getFullYear() - 3; y--) years.push(y);

  useEffect(() => { dispatch(fetchCompanies()); return () => dispatch(clearPayrollData()); }, [dispatch]);
  useEffect(() => { if (filters.company_id) dispatch(fetchCompanyDepartments(filters.company_id)); }, [filters.company_id, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'company_id') setFilters(prev => ({ ...prev, company_id: value, department: 'all' }));
  };

  const handleGenerate = () => {
    if (!filters.company_id) { alert('Please select a company'); return; }
    dispatch(fetchCompanyPayroll(filters));
  };

  const handleDownloadPDF = () => {
    if (!payrollData) { alert('Generate report first'); return; }
    dispatch(downloadPayrollPDF({ 
      ...filters, calc_method: 'days', company_name: payrollData.company?.name, month_name: payrollData.month_name,
    }));
  };

  const handleDownloadCSV = () => {
    if (!payrollData) { alert('Generate report first'); return; }
    dispatch(downloadPayrollCSV({ 
      ...filters, company_name: payrollData.company?.name, month_name: payrollData.month_name,
    }));
  };

  const handleFinalize = async () => {
    if (!payrollData) { alert('Generate report first'); return; }
    const confirmMsg = 
      `⚠️ Payroll Finalize\n\nYe karne se sab employees ke leave balance se HD/Late/Leaves cut ho jaayenge.\n\nMonth: ${payrollData.month_name} ${payrollData.year}\nCompany: ${payrollData.company?.name}\nEmployees: ${payrollData.employees.length}\n\nEk baar finalize karne ke baad dobara nahi hoga.\n\nAre you sure?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const result = await dispatch(finalizePayroll(filters)).unwrap();
      alert(`✅ ${result.message}`);
      dispatch(fetchCompanyPayroll(filters));
    } catch (err) {
      alert(`❌ Finalize failed: ${err}`);
    }
  };

  const fmt = (num) => {
    if (!num && num !== 0) return '₹0';
    return '₹' + Number(num).toLocaleString('en-IN');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 py-8 sm:px-6">

        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1A1A2E]">Payroll Reports</h1>
            <p className="text-sm text-[#9CA3AF]">Days-based salary calculation</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Company *</label>
                <select value={filters.company_id} onChange={e => handleFilterChange('company_id', e.target.value)}
                  className="w-full rounded-xl border-2 border-[#E8590C]/20 bg-[#FFF8F3] py-3 px-4 text-sm font-semibold outline-none focus:border-[#E8590C]">
                  <option value="">— Select —</option>
                  {companies.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Department</label>
                <select value={filters.department} onChange={e => handleFilterChange('department', e.target.value)}
                  disabled={!filters.company_id} className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none disabled:opacity-50">
                  <option value="all">All</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Month</label>
                <select value={filters.month} onChange={e => handleFilterChange('month', Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none">
                  {monthNames.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Year</label>
                <select value={filters.year} onChange={e => handleFilterChange('year', Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={handleGenerate} disabled={loading || !filters.company_id}
                className="rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
                {loading ? 'Generating...' : '🔍 Generate'}
              </button>

              {payrollData && (
                <>
                  <button onClick={handleDownloadPDF} disabled={downloading}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
                    {downloading ? '⏳ Downloading...' : '📄 PDF'}
                  </button>
                  <button onClick={handleDownloadCSV} disabled={downloadingCSV}
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
                    {downloadingCSV ? '⏳ Downloading...' : '📊 CSV / Excel'}
                  </button>
                  {!payrollData.is_finalized ? (
                    <button onClick={handleFinalize} disabled={finalizing}
                      className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
                      {finalizing ? '⏳ Finalizing...' : '🔒 Finalize Payroll'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-100 border-2 border-emerald-300 px-6 py-3">
                      <span className="text-lg">✅</span>
                      <span className="text-emerald-700 font-bold text-sm">Payroll Finalized</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {loading && !payrollData && (
          <div className="flex flex-col items-center rounded-2xl bg-white py-20 shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E8590C]/20 border-t-[#E8590C]" />
            <p className="mt-4 text-sm text-[#9CA3AF]">Calculating...</p>
          </div>
        )}

        {payrollData && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
            <div className="overflow-auto max-h-[calc(100vh-180px)]">
              <table className="w-full text-[11px] whitespace-nowrap">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="bg-[#faf8f5] border-b border-gray-200">
                    <th className="px-2 py-3 text-left font-extrabold uppercase text-[#9CA3AF]">Sr</th>
                    <th className="px-2 py-3 text-left font-extrabold uppercase text-[#1A1A2E] border-r border-gray-200">Name</th>
                    
                    <th className="px-2 py-3 text-center font-extrabold text-blue-700 bg-blue-50/30">Present</th>
                    <th className="px-2 py-3 text-center font-extrabold text-indigo-700 bg-blue-50/30">W/O</th>
                    <th className="px-2 py-3 text-center font-extrabold text-indigo-700 bg-blue-50/30">Hol</th>
                    <th className="px-2 py-3 text-center font-extrabold text-amber-700 bg-amber-50/30">Late</th>
                    <th className="px-2 py-3 text-center font-extrabold text-red-700 bg-amber-50/30">Late Ded.</th>
                    <th className="px-2 py-3 text-center font-extrabold text-orange-700 bg-orange-50/30">HD</th>
                    <th className="px-2 py-3 text-center font-extrabold text-red-700 bg-orange-50/30 border-r border-gray-200">HD Ded.</th>
                    
                    <th className="px-2 py-3 text-center font-extrabold text-blue-700 bg-purple-50/20">Leaves</th>
                    <th className="px-2 py-3 text-center font-extrabold text-cyan-700 bg-purple-50/20">Paid Lv</th>
                    <th className="px-2 py-3 text-center font-extrabold text-indigo-700 bg-purple-50/20">Prev Lv Carry</th>
                    <th className="px-2 py-3 text-center font-extrabold text-purple-700 bg-purple-50/20 border-r border-gray-200">Carry</th>
                    
                    <th className="px-2 py-3 text-center font-extrabold text-emerald-800 bg-emerald-50/20">Final Days</th>
                    <th className="px-2 py-3 text-center font-extrabold text-gray-700 bg-emerald-50/20">%</th>
                    <th className="px-2 py-3 text-right font-extrabold text-[#1A1A2E] bg-emerald-50/20">Salary</th>
                    <th className="px-2 py-3 text-right font-extrabold text-red-700 bg-emerald-50/20">Cut</th>
                    <th className="px-2 py-3 text-right font-extrabold text-[#E8590C] bg-emerald-50/20">Net</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {payrollData.employees.map((emp, idx) => {
                    const totalPunches = emp.total_checkins || 0;
                    const totalWO = emp.weekly_off_paid || 0; 
                    const totalHol = emp.holiday_paid || 0; 
                    const totalHD = (emp.half_day_count || 0) + (emp.half_day_leave_count || 0);
                    // 👈 FIXED HD DEDUCTION: showing 1 for 2 HDs
                    const hdDed = emp.half_day_deduction !== undefined ? emp.half_day_deduction : (totalHD * 0.5);
                    const fullLeavesOnly = emp.full_day_leaves || 0;
                    const prevLvBalance = (emp.leave_opening_balance || 0) + (emp.leave_credited || 0);

                    return (
                      <tr key={emp.emp_id || idx} className="hover:bg-orange-50/30 transition-colors">
                        <td className="px-2 py-2 text-[#9CA3AF] font-medium">{idx + 1}</td>
                        <td className="px-2 py-2 border-r border-gray-100">
                          <span className="font-bold text-[#1A1A2E]">{emp.name}</span>
                          {emp.is_fsr && <span className="ml-1 text-[8px] text-orange-600 font-bold bg-orange-100 px-1 rounded">FSR</span>}
                        </td>

                        <td className="px-2 py-2 text-center font-bold text-blue-700 bg-blue-50/10">{totalPunches}</td>
                        <td className="px-2 py-2 text-center font-bold text-indigo-700 bg-blue-50/10">{totalWO}</td>
                        <td className="px-2 py-2 text-center font-bold text-indigo-700 bg-blue-50/10">{totalHol}</td>
                        
                        <td className="px-2 py-2 text-center font-bold text-amber-700 bg-amber-50/10">{emp.late_count || 0}</td>
                        <td className="px-2 py-2 text-center font-bold text-red-600 bg-amber-50/10">{emp.late_leave_deduction || 0}</td>
                        
                        <td className="px-2 py-2 text-center font-bold text-orange-700 bg-orange-50/10">{totalHD}</td>
                        <td className="px-2 py-2 text-center font-bold text-red-600 bg-orange-50/10 border-r border-gray-100">{hdDed}</td>
                        
                        <td className="px-2 py-2 text-center font-bold text-blue-700 bg-purple-50/10">{fullLeavesOnly}</td>
                        <td className="px-2 py-2 text-center font-bold text-cyan-700 bg-purple-50/10">{emp.paid_leave_days || 0}</td>
                        <td className="px-2 py-2 text-center font-bold text-indigo-700 bg-purple-50/10">{prevLvBalance}</td>
                        <td className="px-2 py-2 text-center font-bold text-purple-700 bg-purple-50/10 border-r border-gray-100">{emp.leave_closing_balance || 0}</td>
                        
                        <td className="px-2 py-2 text-center font-bold text-emerald-800 bg-emerald-50/10">{emp.final_payable_days || 0}</td>
                        <td className="px-2 py-2 text-center font-bold text-gray-700 bg-emerald-50/10">{emp.progress_percent || 0}%</td>
                        <td className="px-2 py-2 text-right font-bold text-[#1A1A2E] bg-emerald-50/10">{fmt(emp.monthly_salary)}</td>
                        <td className="px-2 py-2 text-right font-bold text-red-600 bg-emerald-50/10">{emp.total_deduction > 0 ? fmt(emp.total_deduction) : '-'}</td>
                        <td className="px-2 py-2 text-right font-extrabold text-[#E8590C] bg-emerald-50/20">{fmt(emp.net_payable)}</td>
                      </tr>
                    );
                  })}

                  {/* GRAND TOTAL */}
                  <tr className="sticky bottom-0 z-10 bg-gradient-to-r from-[#1A1A2E] to-[#2D2D44] text-white text-[12px]">
                    <td colSpan="2" className="px-2 py-3 font-bold uppercase border-r border-gray-700">TOTAL</td>
                    <td className="px-2 py-3 text-center font-bold text-blue-300">{payrollData.summary?.total_checkins || 0}</td>
                    <td className="px-2 py-3 text-center font-bold text-indigo-300">{payrollData.summary?.total_wo || 0}</td>
                    <td className="px-2 py-3 text-center font-bold text-indigo-300">{payrollData.summary?.total_holiday || 0}</td>
                    <td className="px-2 py-3 text-center font-bold text-amber-300">{payrollData.summary?.total_late || 0}</td>
                    <td className="px-2 py-3 text-center font-bold text-red-300">{payrollData.summary?.total_late_deduction || 0}</td>
                    <td className="px-2 py-3 text-center font-bold text-orange-300">{payrollData.summary?.total_half_day || 0}</td>
                    <td className="px-2 py-3 text-center font-bold text-red-300 border-r border-gray-700">{payrollData.summary?.total_hd_deduction || 0}</td>
                    <td className="px-2 py-3 text-center font-bold text-blue-300">{payrollData.summary?.total_leaves || 0}</td>
                    <td className="px-2 py-3 text-center font-bold text-cyan-300">{payrollData.summary?.total_paid_leaves || 0}</td>
                    <td className="px-2 py-3 text-center font-bold text-indigo-300">-</td>
                    <td className="px-2 py-3 text-center font-bold text-purple-300 border-r border-gray-700">{payrollData.summary?.total_carry_forward || 0}</td>
                    <td className="px-2 py-3 text-center font-bold text-emerald-300">-</td>
                    <td className="px-2 py-3 text-center font-bold text-gray-300">-</td>
                    <td className="px-2 py-3 text-right font-bold">{fmt(payrollData.summary?.total_monthly_salary)}</td>
                    <td className="px-2 py-3 text-right font-bold text-red-400">{fmt(payrollData.summary?.total_deduction)}</td>
                    <td className="px-2 py-3 text-right font-extrabold text-white">{fmt(payrollData.summary?.total_earned)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollReports;
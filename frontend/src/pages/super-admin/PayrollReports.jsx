




// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   fetchCompanyPayroll,
//   fetchCompanyDepartments,
//   downloadPayrollPDF,
//   downloadPayrollCSV,
//   finalizePayroll,
//   clearPayrollData,
// } from '../../redux/slices/payrollSlice';
// import { fetchCompanies } from '../../redux/slices/companySlice';

// const PayrollReports = () => {
//   const dispatch = useDispatch();
//   const { payrollData, departments, loading, downloading, downloadingCSV, finalizing } = useSelector((s) => s.payroll);
//   const { companies } = useSelector((s) => s.company);

//   const today = new Date();
//   const [filters, setFilters] = useState({
//     company_id: '',
//     department: 'all',
//     month: today.getMonth() + 1,
//     year: today.getFullYear(),
//   });

//   const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
//   const years = [];
//   for (let y = today.getFullYear(); y >= today.getFullYear() - 3; y--) years.push(y);

//   useEffect(() => { dispatch(fetchCompanies()); return () => dispatch(clearPayrollData()); }, [dispatch]);
//   useEffect(() => { if (filters.company_id) dispatch(fetchCompanyDepartments(filters.company_id)); }, [filters.company_id, dispatch]);

//   const handleFilterChange = (key, value) => {
//     setFilters(prev => ({ ...prev, [key]: value }));
//     if (key === 'company_id') setFilters(prev => ({ ...prev, company_id: value, department: 'all' }));
//   };

//   const handleGenerate = () => {
//     if (!filters.company_id) { alert('Please select a company'); return; }
//     dispatch(fetchCompanyPayroll(filters));
//   };

//   const handleDownloadPDF = () => {
//     if (!payrollData) { alert('Generate report first'); return; }
//     dispatch(downloadPayrollPDF({ 
//       ...filters, 
//       calc_method: 'days',
//       company_name: payrollData.company?.name,
//       month_name: payrollData.month_name,
//     }));
//   };

//   // 🆕 CSV Download Handler
//   const handleDownloadCSV = () => {
//     if (!payrollData) { alert('Generate report first'); return; }
//     dispatch(downloadPayrollCSV({ 
//       ...filters, 
//       company_name: payrollData.company?.name,
//       month_name: payrollData.month_name,
//     }));
//   };

//   const handleFinalize = async () => {
//     if (!payrollData) { alert('Generate report first'); return; }
    
//     const confirmMsg = 
//       `⚠️ Payroll Finalize\n\n` +
//       `Ye karne se sab employees ke leave balance se HD/Late/Leaves cut ho jaayenge.\n\n` +
//       `Month: ${payrollData.month_name} ${payrollData.year}\n` +
//       `Company: ${payrollData.company?.name}\n` +
//       `Employees: ${payrollData.employees.length}\n\n` +
//       `Ek baar finalize karne ke baad dobara nahi hoga.\n\n` +
//       `Are you sure?`;
    
//     if (!window.confirm(confirmMsg)) return;
    
//     try {
//       const result = await dispatch(finalizePayroll(filters)).unwrap();
//       alert(`✅ ${result.message}`);
//       dispatch(fetchCompanyPayroll(filters));
//     } catch (err) {
//       alert(`❌ Finalize failed: ${err}`);
//     }
//   };

//   const fmt = (num) => {
//     if (!num && num !== 0) return '₹0';
//     return '₹' + Number(num).toLocaleString('en-IN');
//   };

//   const getWorkingDays = () => payrollData?.employees?.[0]?.total_working_days || 0;
//   const getTotalDays = () => !payrollData ? 0 : new Date(payrollData.year, payrollData.month, 0).getDate();
//   const getWeeklyOff = () => {
//     if (!payrollData) return 0;
//     const { month: m, year: y } = payrollData;
//     const total = new Date(y, m, 0).getDate();
//     const wo = payrollData.settings?.weekly_off || ['Sunday'];
//     let c = 0;
//     for (let d = 1; d <= total; d++) {
//       const dn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(y, m-1, d).getDay()];
//       if (wo.includes(dn)) c++;
//     }
//     return c;
//   };

//   return (
//     <div className="min-h-screen bg-[#faf8f5]">
//       <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
//       <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-8 sm:px-6">

//         {/* HEADER */}
//         <div className="mb-6 flex items-center gap-3">
//           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md">
//             <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75" />
//             </svg>
//           </div>
//           <div>
//             <h1 className="text-2xl font-extrabold text-[#1A1A2E]">Payroll Reports</h1>
//             <p className="text-sm text-[#9CA3AF]">Days-based salary calculation</p>
//           </div>
//         </div>

//         {/* FILTERS */}
//         <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
//           <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
//           <div className="p-6">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//               <div>
//                 <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Company *</label>
//                 <select value={filters.company_id} onChange={e => handleFilterChange('company_id', e.target.value)}
//                   className="w-full rounded-xl border-2 border-[#E8590C]/20 bg-[#FFF8F3] py-3 px-4 text-sm font-semibold outline-none focus:border-[#E8590C]">
//                   <option value="">— Select —</option>
//                   {companies.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Department</label>
//                 <select value={filters.department} onChange={e => handleFilterChange('department', e.target.value)}
//                   disabled={!filters.company_id} className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none disabled:opacity-50">
//                   <option value="all">All</option>
//                   {departments.map(d => <option key={d} value={d}>{d}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Month</label>
//                 <select value={filters.month} onChange={e => handleFilterChange('month', Number(e.target.value))}
//                   className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none">
//                   {monthNames.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Year</label>
//                 <select value={filters.year} onChange={e => handleFilterChange('year', Number(e.target.value))}
//                   className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none">
//                   {years.map(y => <option key={y} value={y}>{y}</option>)}
//                 </select>
//               </div>
//             </div>

//             {/* BUTTONS */}
//             <div className="mt-5 flex flex-wrap gap-3">
//               <button onClick={handleGenerate} disabled={loading || !filters.company_id}
//                 className="rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
//                 {loading ? 'Generating...' : '🔍 Generate'}
//               </button>

//               {payrollData && (
//                 <button onClick={handleDownloadPDF} disabled={downloading}
//                   className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
//                   {downloading ? '⏳ Downloading...' : '📄 PDF'}
//                 </button>
//               )}

//               {/* 🆕 CSV BUTTON */}
//               {payrollData && (
//                 <button onClick={handleDownloadCSV} disabled={downloadingCSV}
//                   className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
//                   {downloadingCSV ? '⏳ Downloading...' : '📊 CSV (Excel/Sheets)'}
//                 </button>
//               )}

//               {payrollData && !payrollData.is_finalized && (
//                 <button onClick={handleFinalize} disabled={finalizing}
//                   className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
//                   {finalizing ? '⏳ Finalizing...' : '🔒 Finalize Payroll'}
//                 </button>
//               )}

//               {payrollData && payrollData.is_finalized && (
//                 <div className="flex items-center gap-2 rounded-xl bg-emerald-100 border-2 border-emerald-300 px-6 py-3">
//                   <span className="text-lg">✅</span>
//                   <span className="text-emerald-700 font-bold text-sm">Payroll Finalized</span>
//                 </div>
//               )}
//             </div>

//             {/* 🆕 CSV INFO TIP */}
//             {payrollData && (
//               <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
//                 <p className="text-[11px] text-blue-800">
//                   💡 
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         {loading && !payrollData && (
//           <div className="flex flex-col items-center rounded-2xl bg-white py-20 shadow-sm">
//             <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E8590C]/20 border-t-[#E8590C]" />
//             <p className="mt-4 text-sm text-[#9CA3AF]">Calculating...</p>
//           </div>
//         )}
//         {!loading && !payrollData && (
//           <div className="flex items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
//             <p className="text-base font-semibold text-[#1A1A2E]">Select filters & generate</p>
//           </div>
//         )}

//         {payrollData && (
//           <>
//             {/* COMPANY INFO */}
//             <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D44] p-6 text-white">
//               <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
//                 <div className="flex items-center gap-4">
//                   <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] text-xl font-bold shadow-lg">
//                     {payrollData.company?.code}
//                   </div>
//                   <div>
//                     <h2 className="text-xl font-extrabold">{payrollData.company?.name}</h2>
//                     {payrollData.company?.address && <p className="text-sm text-gray-300">{payrollData.company.address}</p>}
//                     <p className="text-xs text-gray-400">Period: <span className="font-semibold text-white">{payrollData.month_name} {payrollData.year}</span></p>
//                   </div>
//                 </div>
//                 {payrollData.is_finalized && (
//                   <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/50 px-4 py-2">
//                     <p className="text-emerald-300 text-xs font-bold">✅ FINALIZED</p>
//                     <p className="text-emerald-200 text-[10px]">Balance updated</p>
//                   </div>
//                 )}
//               </div>
//               <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
//                 <div className="rounded-xl bg-white/10 p-3"><p className="text-[10px] uppercase text-gray-300">Total Days</p><p className="text-2xl font-extrabold">{getTotalDays()}</p></div>
//                 <div className="rounded-xl bg-purple-500/15 p-3"><p className="text-[10px] uppercase text-purple-200">Weekly Off</p><p className="text-2xl font-extrabold text-purple-300">{getWeeklyOff()}</p></div>
//                 <div className="rounded-xl bg-red-500/15 p-3"><p className="text-[10px] uppercase text-red-200">Holidays</p><p className="text-2xl font-extrabold text-red-300">{payrollData.settings?.holidays_count || 0}</p></div>
//                 <div className="rounded-xl bg-emerald-500/15 p-3"><p className="text-[10px] uppercase text-emerald-200">Working</p><p className="text-2xl font-extrabold text-emerald-300">{getWorkingDays()}</p></div>
//               </div>
//             </div>

//             {/* SUMMARY */}
//             <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
//               {[
//                 { label: 'Employees', value: payrollData.summary.total_employees, color: '#7c3aed', money: false },
//                 { label: 'Total Salary', value: payrollData.summary.total_monthly_salary, color: '#1A1A2E', money: true },
//                 { label: 'Total Earned', value: payrollData.summary.total_earned, color: '#16a34a', money: true },
//                 { label: 'Total Cut', value: payrollData.summary.total_deduction, color: '#dc2626', money: true },
//               ].map(s => (
//                 <div key={s.label} className="overflow-hidden rounded-2xl bg-white shadow-sm">
//                   <div className="h-1" style={{ background: s.color }} />
//                   <div className="p-5">
//                     <p className="text-xs font-semibold uppercase text-[#9CA3AF]">{s.label}</p>
//                     <p className="mt-1 text-2xl font-extrabold" style={{ color: s.color }}>{s.money ? fmt(s.value) : s.value}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* FORMULA */}
//             <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
//               <p className="text-[11px] text-blue-900">
//                 <strong>Formula:</strong> Final = Present + HD + Paid Lv - Late &nbsp;|&nbsp;
//                 <strong>HD</strong> = Attendance HD (att) + Half day leaves (lv) &nbsp;|&nbsp;
//                 <strong>Leaves</strong> = Full + Half day leaves total &nbsp;|&nbsp;
//                 <strong>Net</strong> = Salary × (Final ÷ {getWorkingDays()})
//               </p>
//             </div>

//             {/* TABLE */}
//             <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
//               <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
//                 <div>
//                   <h3 className="text-base font-bold text-[#1A1A2E]">Employee Salary Details</h3>
//                   <p className="text-xs text-[#9CA3AF]">{payrollData.employees.length} employees • Days Based</p>
//                 </div>
//                 {payrollData.is_finalized && (
//                   <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
//                     🔒 Balance Updated
//                   </span>
//                 )}
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="w-full text-sm">
//                   <thead>
//                     <tr className="bg-[#faf8f5]">
//                       <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Sr</th>
//                       <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#1A1A2E]">Name</th>
//                       <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-emerald-700">Present</th>
//                       <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-amber-700">Late</th>
//                       <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-orange-700">HD</th>
//                       <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-blue-700">Leaves</th>
//                       <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-cyan-700">Paid Lv</th>
//                       <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50">Carry</th>
//                       <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-purple-700 bg-purple-50">Final Days</th>
//                       <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">%</th>
//                       <th className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#1A1A2E]">Salary</th>
//                       <th className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-red-700">Cut</th>
//                       <th className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#E8590C]">Net</th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-gray-50">
//                     {payrollData.employees.map((emp, idx) => {
//                       const totalHD = (emp.half_day_count || 0) + (emp.half_day_leave_count || 0);
//                       const totalLeavesDays = emp.total_leave_approved || 0;

//                       return (
//                         <tr key={emp.emp_id || idx} className="hover:bg-[#faf8f5]">
//                           <td className="px-2 py-3 text-xs text-[#9CA3AF]">{idx + 1}</td>

//                           <td className="px-2 py-3">
//                             <p className="font-semibold text-[#1A1A2E] text-[13px]">{emp.name}</p>
//                             <p className="text-[10px] text-[#9CA3AF] font-mono">{emp.emp_code}</p>
//                           </td>

//                           <td className="px-2 py-3 text-center">
//                             <span className="inline-flex h-7 min-w-[32px] px-1 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
//                               {emp.total_present || 0}
//                             </span>
//                           </td>

//                           <td className="px-2 py-3 text-center">
//                             <div className="inline-flex flex-col items-center">
//                               <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
//                                 (emp.late_count || 0) > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'
//                               }`}>{emp.late_count || 0}</span>
//                               {emp.late_leave_deduction > 0 && (
//                                 <span className="mt-0.5 text-[9px] font-bold text-red-600">-{emp.late_leave_deduction}d</span>
//                               )}
//                             </div>
//                           </td>

//                           <td className="px-2 py-3 text-center">
//                             <div className="inline-flex flex-col items-center">
//                               <span className={`inline-flex h-7 min-w-[32px] px-1 items-center justify-center rounded-lg text-xs font-bold ${
//                                 totalHD > 0 ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-400'
//                               }`}>
//                                 {totalHD}
//                               </span>
//                               {totalHD > 0 && (
//                                 <span className="mt-0.5 text-[9px] font-bold text-orange-600">
//                                   {emp.half_day_count > 0 && `att:${emp.half_day_count}`}
//                                   {emp.half_day_count > 0 && emp.half_day_leave_count > 0 && ' • '}
//                                   {emp.half_day_leave_count > 0 && `lv:${emp.half_day_leave_count}`}
//                                 </span>
//                               )}
//                             </div>
//                           </td>

//                           <td className="px-2 py-3 text-center">
//                             <div className="inline-flex flex-col items-center">
//                               <span className={`inline-flex h-7 min-w-[32px] px-1 items-center justify-center rounded-lg text-xs font-bold ${
//                                 totalLeavesDays > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400'
//                               }`}>
//                                 {totalLeavesDays}
//                               </span>
//                               {(emp.full_day_leaves > 0 || emp.half_day_leave_count > 0) && (
//                                 <span className="mt-0.5 text-[9px] font-bold text-blue-600">
//                                   {emp.full_day_leaves > 0 && `${emp.full_day_leaves}F`}
//                                   {emp.full_day_leaves > 0 && emp.half_day_leave_count > 0 && '+'}
//                                   {emp.half_day_leave_count > 0 && `${emp.half_day_leave_count}HD`}
//                                 </span>
//                               )}
//                               {(emp.unpaid_leave_days || 0) > 0 && (
//                                 <span className="mt-0.5 text-[9px] font-bold text-red-600">{emp.unpaid_leave_days} unpaid</span>
//                               )}
//                             </div>
//                           </td>

//                           <td className="px-2 py-3 text-center">
//                             <div className="inline-flex flex-col items-center">
//                               <span className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg px-1 text-xs font-bold ${
//                                 (emp.paid_leave_days || 0) > 0 ? 'bg-cyan-50 text-cyan-700' : 'bg-gray-50 text-gray-400'
//                               }`}>{emp.paid_leave_days || 0}</span>
//                               {(emp.half_day_deduction || 0) > 0 && (
//                                 <span className="mt-0.5 text-[8px] font-bold text-cyan-600">hd:{emp.half_day_deduction}</span>
//                               )}
//                             </div>
//                           </td>

//                           <td className="px-2 py-3 text-center bg-indigo-50/30">
//                             <span className={`inline-flex h-7 min-w-[32px] items-center justify-center rounded-lg px-1 text-xs font-extrabold ${
//                               (emp.leave_closing_balance || 0) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-red-50 text-red-600'
//                             }`}>
//                               {emp.leave_closing_balance || 0}
//                             </span>
//                           </td>

//                           <td className="px-2 py-3 text-center bg-purple-50/30">
//                             <span className="inline-flex h-7 min-w-[40px] items-center justify-center rounded-lg bg-purple-100 px-2 text-xs font-extrabold text-purple-700">
//                               {emp.final_payable_days || 0}
//                             </span>
//                           </td>

//                           <td className="px-2 py-3 text-center">
//                             <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold ${
//                               (emp.progress_percent || 0) >= 100 ? 'bg-emerald-100 text-emerald-700' :
//                               (emp.progress_percent || 0) >= 80 ? 'bg-amber-100 text-amber-700' :
//                               (emp.progress_percent || 0) >= 50 ? 'bg-orange-100 text-orange-700' :
//                               'bg-red-100 text-red-700'
//                             }`}>{emp.progress_percent || 0}%</span>
//                           </td>

//                           <td className="px-2 py-3 text-right text-xs font-semibold text-[#1A1A2E]">{fmt(emp.monthly_salary)}</td>

//                           <td className="px-2 py-3 text-right">
//                             {(emp.total_deduction || 0) > 0 ? (
//                               <span className="text-xs font-semibold text-red-600">{fmt(emp.total_deduction)}</span>
//                             ) : <span className="text-xs font-bold text-emerald-600">—</span>}
//                           </td>

//                           <td className="px-2 py-3 text-right">
//                             <span className="rounded-lg bg-[#FFF3E8] px-2 py-1 text-xs font-extrabold text-[#E8590C]">
//                               {fmt(emp.net_payable)}
//                             </span>
//                           </td>
//                         </tr>
//                       );
//                     })}

//                     {/* GRAND TOTAL */}
//                     <tr className="bg-gradient-to-r from-[#1A1A2E] to-[#2D2D44] text-white">
//                       <td colSpan="2" className="px-2 py-3 font-bold uppercase text-xs">GRAND TOTAL</td>
//                       <td className="px-2 py-3 text-center text-emerald-300 font-bold text-xs">{payrollData.summary.total_present || 0}</td>
//                       <td className="px-2 py-3 text-center text-amber-300 font-bold text-xs">{payrollData.summary.total_late || 0}</td>
//                       <td className="px-2 py-3 text-center text-orange-300 font-bold text-xs">{payrollData.summary.total_half_day || 0}</td>
//                       <td className="px-2 py-3 text-center text-blue-300 font-bold text-xs">{payrollData.summary.total_leaves || 0}</td>
//                       <td className="px-2 py-3 text-center text-cyan-300 font-bold text-xs">{payrollData.summary.total_paid_leaves || 0}</td>
//                       <td className="px-2 py-3 text-center text-indigo-300 font-bold text-xs">{payrollData.summary.total_carry_forward || 0}</td>
//                       <td className="px-2 py-3 text-center text-purple-300 font-bold text-xs">—</td>
//                       <td></td>
//                       <td className="px-2 py-3 text-right text-xs font-bold">{fmt(payrollData.summary.total_monthly_salary)}</td>
//                       <td className="px-2 py-3 text-right text-red-300 text-xs font-bold">{fmt(payrollData.summary.total_deduction)}</td>
//                       <td className="px-2 py-3 text-right">
//                         <span className="rounded-lg bg-[#E8590C] px-2 py-1 text-xs font-extrabold">{fmt(payrollData.summary.total_earned)}</span>
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* FINALIZE INFO */}
//             {!payrollData.is_finalized && (
//               <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
//                 <p className="text-[12px] text-amber-900">
//                   <strong>⚠️ Note:</strong> Payroll finalize karne pe employees ke leave balance se HD/Late/Leaves cut ho jaayenge. 
//                   Next month ka carry forward properly hoga. Ek baar hi finalize ho sakta hai.
//                 </p>
//               </div>
//             )}

//             {/* COLUMN LEGEND */}
//             <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
//               <p className="text-[11px] text-gray-700 font-semibold mb-1">📋 Column Guide:</p>
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-[10px] text-gray-600">
//                 <span><strong className="text-emerald-700">Present</strong> = Full worked days</span>
//                 <span><strong className="text-amber-700">Late</strong> = After 9:45 AM (3L=0.5d)</span>
//                 <span><strong className="text-orange-700">HD</strong> = Half Day (att + leaves)</span>
//                 <span><strong className="text-blue-700">Leaves</strong> = Full + Half day leaves total</span>
//                 <span><strong className="text-cyan-700">Paid Lv</strong> = Balance se paid</span>
//                 <span><strong className="text-indigo-700">Carry</strong> = Balance for next month</span>
//                 <span><strong className="text-purple-700">Final</strong> = Total payable days</span>
//                 <span><strong className="text-[#E8590C]">Net</strong> = Final payable salary</span>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PayrollReports;






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
      ...filters, 
      calc_method: 'days',
      company_name: payrollData.company?.name,
      month_name: payrollData.month_name,
    }));
  };

  const handleDownloadCSV = () => {
    if (!payrollData) { alert('Generate report first'); return; }
    dispatch(downloadPayrollCSV({ 
      ...filters, 
      company_name: payrollData.company?.name,
      month_name: payrollData.month_name,
    }));
  };

  const handleFinalize = async () => {
    if (!payrollData) { alert('Generate report first'); return; }
    
    const confirmMsg = 
      `⚠️ Payroll Finalize\n\n` +
      `Ye karne se sab employees ke leave balance se HD/Late/Leaves cut ho jaayenge.\n\n` +
      `Month: ${payrollData.month_name} ${payrollData.year}\n` +
      `Company: ${payrollData.company?.name}\n` +
      `Employees: ${payrollData.employees.length}\n\n` +
      `Ek baar finalize karne ke baad dobara nahi hoga.\n\n` +
      `Are you sure?`;
    
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

  const getWorkingDays = () => payrollData?.employees?.[0]?.total_working_days || 0;
  const getTotalDays = () => !payrollData ? 0 : new Date(payrollData.year, payrollData.month, 0).getDate();
  const getWeeklyOff = () => {
    if (!payrollData) return 0;
    const { month: m, year: y } = payrollData;
    const total = new Date(y, m, 0).getDate();
    const wo = payrollData.settings?.weekly_off || ['Sunday'];
    let c = 0;
    for (let d = 1; d <= total; d++) {
      const dn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(y, m-1, d).getDay()];
      if (wo.includes(dn)) c++;
    }
    return c;
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-8 sm:px-6">

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
                <button onClick={handleDownloadPDF} disabled={downloading}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
                  {downloading ? '⏳ Downloading...' : '📄 PDF'}
                </button>
              )}

              {payrollData && (
                <button onClick={handleDownloadCSV} disabled={downloadingCSV}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
                  {downloadingCSV ? '⏳ Downloading...' : '📊 CSV (Excel/Sheets)'}
                </button>
              )}

              {payrollData && !payrollData.is_finalized && (
                <button onClick={handleFinalize} disabled={finalizing}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50">
                  {finalizing ? '⏳ Finalizing...' : '🔒 Finalize Payroll'}
                </button>
              )}

              {payrollData && payrollData.is_finalized && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-100 border-2 border-emerald-300 px-6 py-3">
                  <span className="text-lg">✅</span>
                  <span className="text-emerald-700 font-bold text-sm">Payroll Finalized</span>
                </div>
              )}
            </div>

            {payrollData && (
              <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                <p className="text-[11px] text-blue-800">
                  💡 
                </p>
              </div>
            )}
          </div>
        </div>

        {loading && !payrollData && (
          <div className="flex flex-col items-center rounded-2xl bg-white py-20 shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E8590C]/20 border-t-[#E8590C]" />
            <p className="mt-4 text-sm text-[#9CA3AF]">Calculating...</p>
          </div>
        )}
        {!loading && !payrollData && (
          <div className="flex items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
            <p className="text-base font-semibold text-[#1A1A2E]">Select filters & generate</p>
          </div>
        )}

        {payrollData && (
          <>
            {/* COMPANY INFO */}
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D44] p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] text-xl font-bold shadow-lg">
                    {payrollData.company?.code}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold">{payrollData.company?.name}</h2>
                    {payrollData.company?.address && <p className="text-sm text-gray-300">{payrollData.company.address}</p>}
                    <p className="text-xs text-gray-400">Period: <span className="font-semibold text-white">{payrollData.month_name} {payrollData.year}</span></p>
                  </div>
                </div>
                {payrollData.is_finalized && (
                  <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/50 px-4 py-2">
                    <p className="text-emerald-300 text-xs font-bold">✅ FINALIZED</p>
                    <p className="text-emerald-200 text-[10px]">Balance updated</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-white/10 p-3"><p className="text-[10px] uppercase text-gray-300">Total Days</p><p className="text-2xl font-extrabold">{getTotalDays()}</p></div>
                <div className="rounded-xl bg-purple-500/15 p-3"><p className="text-[10px] uppercase text-purple-200">Weekly Off</p><p className="text-2xl font-extrabold text-purple-300">{getWeeklyOff()}</p></div>
                <div className="rounded-xl bg-red-500/15 p-3"><p className="text-[10px] uppercase text-red-200">Holidays</p><p className="text-2xl font-extrabold text-red-300">{payrollData.settings?.holidays_count || 0}</p></div>
                <div className="rounded-xl bg-emerald-500/15 p-3"><p className="text-[10px] uppercase text-emerald-200">Working</p><p className="text-2xl font-extrabold text-emerald-300">{getWorkingDays()}</p></div>
              </div>
            </div>

            {/* SUMMARY */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Employees', value: payrollData.summary.total_employees, color: '#7c3aed', money: false },
                { label: 'Total Salary', value: payrollData.summary.total_monthly_salary, color: '#1A1A2E', money: true },
                { label: 'Total Earned', value: payrollData.summary.total_earned, color: '#16a34a', money: true },
                { label: 'Total Cut', value: payrollData.summary.total_deduction, color: '#dc2626', money: true },
              ].map(s => (
                <div key={s.label} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="h-1" style={{ background: s.color }} />
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase text-[#9CA3AF]">{s.label}</p>
                    <p className="mt-1 text-2xl font-extrabold" style={{ color: s.color }}>{s.money ? fmt(s.value) : s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FORMULA */}
            <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-[11px] text-blue-900">
                <strong>Formula:</strong> Final = Present + HD + Paid Lv - Late &nbsp;|&nbsp;
                <strong>HD</strong> = Attendance HD (att) + Half day leaves (lv) &nbsp;|&nbsp;
                <strong>Leaves</strong> = Full + Half day leaves total &nbsp;|&nbsp;
                <strong>Net</strong> = Salary × (Final ÷ {getWorkingDays()})
              </p>
            </div>

            {/* TABLE */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* 🔒 STICKY: Table Title Header */}
              <div className="sticky top-0 z-30 border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1A1A2E]">Employee Salary Details</h3>
                  <p className="text-xs text-[#9CA3AF]">{payrollData.employees.length} employees • Days Based</p>
                </div>
                {payrollData.is_finalized && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                    🔒 Balance Updated
                  </span>
                )}
              </div>

              {/* 🔒 Scrollable Table Wrapper with max height */}
              <div className="overflow-auto max-h-[calc(100vh-180px)]">
                <table className="w-full text-sm">
                  {/* 🔒 STICKY: Column Headers */}
                  <thead className="sticky top-0 z-20 bg-[#faf8f5] shadow-sm">
                    <tr>
                      <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] bg-[#faf8f5]">Sr</th>
                      <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#1A1A2E] bg-[#faf8f5]">Name</th>
                      <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-[#faf8f5]">Present</th>
                      <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-[#faf8f5]">Late</th>
                      <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-orange-700 bg-[#faf8f5]">HD</th>
                      <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-[#faf8f5]">Leaves</th>
                      <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-cyan-700 bg-[#faf8f5]">Paid Lv</th>
                      <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50">Carry</th>
                      <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-purple-700 bg-purple-50">Final Days</th>
                      <th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] bg-[#faf8f5]">%</th>
                      <th className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#1A1A2E] bg-[#faf8f5]">Salary</th>
                      <th className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-red-700 bg-[#faf8f5]">Cut</th>
                      <th className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#E8590C] bg-[#faf8f5]">Net</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50">
                    {payrollData.employees.map((emp, idx) => {
                      const totalHD = (emp.half_day_count || 0) + (emp.half_day_leave_count || 0);
                      const totalLeavesDays = emp.total_leave_approved || 0;

                      return (
                        <tr key={emp.emp_id || idx} className="hover:bg-[#faf8f5]">
                          <td className="px-2 py-3 text-xs text-[#9CA3AF]">{idx + 1}</td>

                          <td className="px-2 py-3">
                            <p className="font-semibold text-[#1A1A2E] text-[13px]">{emp.name}</p>
                            <p className="text-[10px] text-[#9CA3AF] font-mono">{emp.emp_code}</p>
                          </td>

                          <td className="px-2 py-3 text-center">
                            <span className="inline-flex h-7 min-w-[32px] px-1 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                              {emp.total_present || 0}
                            </span>
                          </td>

                          <td className="px-2 py-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                (emp.late_count || 0) > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'
                              }`}>{emp.late_count || 0}</span>
                              {emp.late_leave_deduction > 0 && (
                                <span className="mt-0.5 text-[9px] font-bold text-red-600">-{emp.late_leave_deduction}d</span>
                              )}
                            </div>
                          </td>

                          <td className="px-2 py-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`inline-flex h-7 min-w-[32px] px-1 items-center justify-center rounded-lg text-xs font-bold ${
                                totalHD > 0 ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-400'
                              }`}>
                                {totalHD}
                              </span>
                              {totalHD > 0 && (
                                <span className="mt-0.5 text-[9px] font-bold text-orange-600">
                                  {emp.half_day_count > 0 && `att:${emp.half_day_count}`}
                                  {emp.half_day_count > 0 && emp.half_day_leave_count > 0 && ' • '}
                                  {emp.half_day_leave_count > 0 && `lv:${emp.half_day_leave_count}`}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-2 py-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`inline-flex h-7 min-w-[32px] px-1 items-center justify-center rounded-lg text-xs font-bold ${
                                totalLeavesDays > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400'
                              }`}>
                                {totalLeavesDays}
                              </span>
                              {(emp.full_day_leaves > 0 || emp.half_day_leave_count > 0) && (
                                <span className="mt-0.5 text-[9px] font-bold text-blue-600">
                                  {emp.full_day_leaves > 0 && `${emp.full_day_leaves}F`}
                                  {emp.full_day_leaves > 0 && emp.half_day_leave_count > 0 && '+'}
                                  {emp.half_day_leave_count > 0 && `${emp.half_day_leave_count}HD`}
                                </span>
                              )}
                              {(emp.unpaid_leave_days || 0) > 0 && (
                                <span className="mt-0.5 text-[9px] font-bold text-red-600">{emp.unpaid_leave_days} unpaid</span>
                              )}
                            </div>
                          </td>

                          <td className="px-2 py-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg px-1 text-xs font-bold ${
                                (emp.paid_leave_days || 0) > 0 ? 'bg-cyan-50 text-cyan-700' : 'bg-gray-50 text-gray-400'
                              }`}>{emp.paid_leave_days || 0}</span>
                              {(emp.half_day_deduction || 0) > 0 && (
                                <span className="mt-0.5 text-[8px] font-bold text-cyan-600">hd:{emp.half_day_deduction}</span>
                              )}
                            </div>
                          </td>

                          <td className="px-2 py-3 text-center bg-indigo-50/30">
                            <span className={`inline-flex h-7 min-w-[32px] items-center justify-center rounded-lg px-1 text-xs font-extrabold ${
                              (emp.leave_closing_balance || 0) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {emp.leave_closing_balance || 0}
                            </span>
                          </td>

                          <td className="px-2 py-3 text-center bg-purple-50/30">
                            <span className="inline-flex h-7 min-w-[40px] items-center justify-center rounded-lg bg-purple-100 px-2 text-xs font-extrabold text-purple-700">
                              {emp.final_payable_days || 0}
                            </span>
                          </td>

                          <td className="px-2 py-3 text-center">
                            <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold ${
                              (emp.progress_percent || 0) >= 100 ? 'bg-emerald-100 text-emerald-700' :
                              (emp.progress_percent || 0) >= 80 ? 'bg-amber-100 text-amber-700' :
                              (emp.progress_percent || 0) >= 50 ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>{emp.progress_percent || 0}%</span>
                          </td>

                          <td className="px-2 py-3 text-right text-xs font-semibold text-[#1A1A2E]">{fmt(emp.monthly_salary)}</td>

                          <td className="px-2 py-3 text-right">
                            {(emp.total_deduction || 0) > 0 ? (
                              <span className="text-xs font-semibold text-red-600">{fmt(emp.total_deduction)}</span>
                            ) : <span className="text-xs font-bold text-emerald-600">—</span>}
                          </td>

                          <td className="px-2 py-3 text-right">
                            <span className="rounded-lg bg-[#FFF3E8] px-2 py-1 text-xs font-extrabold text-[#E8590C]">
                              {fmt(emp.net_payable)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {/* GRAND TOTAL */}
                    <tr className="sticky bottom-0 z-10 bg-gradient-to-r from-[#1A1A2E] to-[#2D2D44] text-white">
                      <td colSpan="2" className="px-2 py-3 font-bold uppercase text-xs">GRAND TOTAL</td>
                      <td className="px-2 py-3 text-center text-emerald-300 font-bold text-xs">{payrollData.summary.total_present || 0}</td>
                      <td className="px-2 py-3 text-center text-amber-300 font-bold text-xs">{payrollData.summary.total_late || 0}</td>
                      <td className="px-2 py-3 text-center text-orange-300 font-bold text-xs">{payrollData.summary.total_half_day || 0}</td>
                      <td className="px-2 py-3 text-center text-blue-300 font-bold text-xs">{payrollData.summary.total_leaves || 0}</td>
                      <td className="px-2 py-3 text-center text-cyan-300 font-bold text-xs">{payrollData.summary.total_paid_leaves || 0}</td>
                      <td className="px-2 py-3 text-center text-indigo-300 font-bold text-xs">{payrollData.summary.total_carry_forward || 0}</td>
                      <td className="px-2 py-3 text-center text-purple-300 font-bold text-xs">—</td>
                      <td></td>
                      <td className="px-2 py-3 text-right text-xs font-bold">{fmt(payrollData.summary.total_monthly_salary)}</td>
                      <td className="px-2 py-3 text-right text-red-300 text-xs font-bold">{fmt(payrollData.summary.total_deduction)}</td>
                      <td className="px-2 py-3 text-right">
                        <span className="rounded-lg bg-[#E8590C] px-2 py-1 text-xs font-extrabold">{fmt(payrollData.summary.total_earned)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* FINALIZE INFO */}
            {!payrollData.is_finalized && (
              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-[12px] text-amber-900">
                  <strong>⚠️ Note:</strong> Payroll finalize karne pe employees ke leave balance se HD/Late/Leaves cut ho jaayenge. 
                  Next month ka carry forward properly hoga. Ek baar hi finalize ho sakta hai.
                </p>
              </div>
            )}

            {/* COLUMN LEGEND */}
            <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
              <p className="text-[11px] text-gray-700 font-semibold mb-1">📋 Column Guide:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-[10px] text-gray-600">
                <span><strong className="text-emerald-700">Present</strong> = Full worked days</span>
                <span><strong className="text-amber-700">Late</strong> = After 9:45 AM (3L=0.5d)</span>
                <span><strong className="text-orange-700">HD</strong> = Half Day (att + leaves)</span>
                <span><strong className="text-blue-700">Leaves</strong> = Full + Half day leaves total</span>
                <span><strong className="text-cyan-700">Paid Lv</strong> = Balance se paid</span>
                <span><strong className="text-indigo-700">Carry</strong> = Balance for next month</span>
                <span><strong className="text-purple-700">Final</strong> = Total payable days</span>
                <span><strong className="text-[#E8590C]">Net</strong> = Final payable salary</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PayrollReports;
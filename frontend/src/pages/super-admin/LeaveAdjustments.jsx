

// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   fetchAllEmployeesWithBalance,
//   adjustLeaveBalance,
//   fetchAdjustmentHistory,
//   clearBalanceMessage,
//   clearBalanceError,
// } from '../../redux/slices/leaveBalanceSlice';
// import { fetchCompanies } from '../../redux/slices/companySlice';

// const MONTHS = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December',
// ];

// const LeaveAdjustments = () => {
//   const dispatch = useDispatch();
//   const {
//     allEmployeesWithBalance,
//     adjustmentHistory,
//     loading,
//     historyLoading,
//     message,
//     error,
//   } = useSelector((s) => s.leaveBalance);
//   const { companies } = useSelector((s) => s.company);

//   const now = new Date();
//   const [selectedCompany, setSelectedCompany] = useState('all');
//   const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
//   const [selectedYear, setSelectedYear] = useState(now.getFullYear());
//   const [search, setSearch] = useState('');

//   const [adjustModal, setAdjustModal] = useState(null);
//   const [historyDrawer, setHistoryDrawer] = useState(null);

//   const [adjustmentType, setAdjustmentType] = useState('add');
//   const [days, setDays] = useState('');
//   const [reason, setReason] = useState('');

//   const yearsList = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

//   const refreshAll = () => {
//     dispatch(
//       fetchAllEmployeesWithBalance({
//         company_id: selectedCompany,
//         month: selectedMonth,
//         year: selectedYear,
//         search,
//       })
//     );
//     dispatch(
//       fetchAdjustmentHistory({
//         company_id: selectedCompany,
//         search,
//       })
//     );
//   };

//   useEffect(() => {
//     dispatch(fetchCompanies());
//     refreshAll();
//   }, [dispatch]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       refreshAll();
//     }, 400);
//     return () => clearTimeout(timer);
//   }, [selectedCompany, selectedMonth, selectedYear, search]);

//   useEffect(() => {
//     if (message || error) {
//       const timer = setTimeout(() => {
//         dispatch(clearBalanceMessage());
//         dispatch(clearBalanceError());
//       }, 4000);
//       return () => clearTimeout(timer);
//     }
//   }, [message, error, dispatch]);

//   const openAdjustModal = (emp) => {
//     setAdjustModal(emp);
//     setAdjustmentType('add');
//     setDays('');
//     setReason('');
//   };

//   const closeAdjustModal = () => {
//     setAdjustModal(null);
//     setAdjustmentType('add');
//     setDays('');
//     setReason('');
//   };

//   const handleAdjust = async () => {
//     if (!days || parseFloat(days) <= 0) {
//       alert('Valid days daalo');
//       return;
//     }
//     if (!reason || reason.trim() === '') {
//       alert('Reason daalo');
//       return;
//     }

//     const result = await dispatch(
//       adjustLeaveBalance({
//         emp_id: adjustModal._id,
//         days: parseFloat(days),
//         reason: reason.trim(),
//         adjustment_type: adjustmentType,
//       })
//     );

//     if (result.meta.requestStatus === 'fulfilled') {
//       closeAdjustModal();
//       refreshAll();
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#faf8f5]">
//       <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

//         {/* HEADER */}
//         <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
//           <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
//           <div className="p-6">
//             <h1 className="text-lg font-extrabold text-[#1A1A2E]">
//               Leave Balances & Deep Audit History
//             </h1>
//             <p className="text-xs text-[#9CA3AF] mt-1">
//               Current balance, approved leaves, late cuts, and manual adjustments — 100% itemized transparency.
//             </p>
//           </div>
//         </div>

//         {/* MESSAGES */}
//         {message && (
//           <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800">
//             {message}
//           </div>
//         )}
//         {error && (
//           <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-800">
//             {error}
//           </div>
//         )}

//         {/* FILTERS */}
//         <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
//             <div>
//               <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Company</label>
//               <select
//                 value={selectedCompany}
//                 onChange={(e) => setSelectedCompany(e.target.value)}
//                 className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
//               >
//                 <option value="all">All Companies</option>
//                 {companies?.map((c) => (
//                   <option key={c._id} value={c._id}>{c.name}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Month Snapshot</label>
//               <select
//                 value={selectedMonth}
//                 onChange={(e) => setSelectedMonth(Number(e.target.value))}
//                 className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
//               >
//                 {MONTHS.map((m, idx) => (
//                   <option key={m} value={idx + 1}>{m}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Year</label>
//               <select
//                 value={selectedYear}
//                 onChange={(e) => setSelectedYear(Number(e.target.value))}
//                 className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
//               >
//                 {yearsList.map((y) => (
//                   <option key={y} value={y}>{y}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Search</label>
//               <input
//                 type="text"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Name, code, dept..."
//                 className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
//               />
//             </div>
//           </div>
//         </div>

//         {/* EMPLOYEES TABLE */}
//         <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
//           <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <h3 className="text-sm font-bold text-[#1A1A2E]">Employees Leave Balances</h3>
//               <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#E8590C]">
//                 {allEmployeesWithBalance?.length || 0}
//               </span>
//             </div>
//             <p className="text-xs text-[#9CA3AF]">
//               Snapshot: <b className="text-[#E8590C]">{MONTHS[selectedMonth - 1]} {selectedYear}</b>
//             </p>
//           </div>

//           {loading ? (
//             <div className="flex flex-col items-center justify-center py-16">
//               <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
//               <p className="mt-4 text-sm text-[#9CA3AF]">Loading balances...</p>
//             </div>
//           ) : !allEmployeesWithBalance?.length ? (
//             <div className="py-16 text-center text-sm text-[#9CA3AF]">No employees found</div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="bg-[#faf8f5]">
//                     <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-[#9CA3AF]">Employee</th>
//                     <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-[#9CA3AF]">Type</th>
//                     <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-blue-600">Current</th>
//                     <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-[#9CA3AF]">Open</th>
//                     <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-emerald-600">Credit</th>
//                     <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-rose-600">Used</th>
//                     <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-[#9CA3AF]">Close</th>
//                     <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-[#9CA3AF]">Manual Adj</th>
//                     <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-[#9CA3AF]">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-50">
//                   {allEmployeesWithBalance.map((emp) => {
//                     const monthSnap = emp.selected_month_data;
//                     const adjCount = emp.adjustments?.length || 0;
//                     return (
//                       <tr key={emp._id} className="hover:bg-[#faf8f5]">
//                         <td className="px-4 py-3">
//                           <p className="font-semibold text-[#1A1A2E]">{emp.name}</p>
//                           <p className="text-xs text-[#9CA3AF]">
//                             {emp.emp_code} • {emp.company?.code || '—'} • {emp.department || '—'}
//                           </p>
//                         </td>
//                         <td className="px-4 py-3">
//                           <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
//                             emp.worker_type === 'site'
//                               ? 'bg-amber-100 text-amber-800'
//                               : 'bg-gray-100 text-gray-700'
//                           }`}>
//                             {(emp.worker_type || 'office').toUpperCase()}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3 text-center">
//                           <span className="rounded-md bg-blue-100 px-3 py-1 text-sm font-extrabold text-blue-800">
//                             {emp.current_balance}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3 text-center text-[#4B5563]">
//                           {monthSnap ? monthSnap.opening_balance : '—'}
//                         </td>
//                         <td className="px-4 py-3 text-center font-semibold text-emerald-700">
//                           {monthSnap ? `+${monthSnap.credited}` : '—'}
//                         </td>
//                         <td className="px-4 py-3 text-center font-semibold text-rose-700">
//                           {monthSnap ? `-${monthSnap.used}` : '—'}
//                         </td>
//                         <td className="px-4 py-3 text-center font-bold text-[#1A1A2E]">
//                           {monthSnap ? monthSnap.closing_balance : '—'}
//                         </td>
//                         <td className="px-4 py-3 text-center">
//                           {adjCount > 0 ? (
//                             <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
//                               {adjCount} adj
//                             </span>
//                           ) : (
//                             <span className="text-xs text-gray-300">—</span>
//                           )}
//                         </td>
//                         <td className="px-4 py-3">
//                           <div className="flex items-center justify-center gap-2">
//                             <button
//                               onClick={() => setHistoryDrawer(emp)}
//                               className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-200"
//                             >
//                               📜 History
//                             </button>
//                             <button
//                               onClick={() => openAdjustModal(emp)}
//                               className="rounded-lg bg-[#E8590C] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#D14800]"
//                             >
//                               ⚙️ Adjust
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         {/* MANUAL ADJUSTMENTS TABLE */}
//         <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
//           <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
//             <div>
//               <h3 className="text-sm font-bold text-[#1A1A2E]">Manual Leave Credits / Adjustments</h3>
//               <p className="text-xs text-[#9CA3AF] mt-0.5">
//                 Super Admin se manually add/deduct hui leaves
//               </p>
//             </div>
//             <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-700">
//               {adjustmentHistory?.length || 0} records
//             </span>
//           </div>

//           {historyLoading ? (
//             <div className="py-10 text-center text-sm text-[#9CA3AF]">Loading adjustments...</div>
//           ) : !adjustmentHistory?.length ? (
//             <div className="py-12 text-center text-sm text-[#9CA3AF]">No manual adjustments yet</div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="bg-[#faf8f5]">
//                     {['Employee', 'Company', 'Month', 'Type', 'Days', 'Reason', 'By', 'Date'].map((h) => (
//                       <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-50">
//                   {adjustmentHistory.map((adj, i) => (
//                     <tr key={adj._id || i} className="hover:bg-[#faf8f5]">
//                       <td className="px-4 py-3">
//                         <p className="font-semibold text-[#1A1A2E]">{adj.employee_name}</p>
//                         <p className="text-xs text-[#9CA3AF]">{adj.emp_code}</p>
//                       </td>
//                       <td className="px-4 py-3">
//                         <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
//                           {adj.company_code || adj.company?.code || adj.company?.name || '—'}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3 text-xs font-medium text-gray-600">
//                         {adj.month_label || `${adj.month}/${adj.year}`}
//                       </td>
//                       <td className="px-4 py-3">
//                         {adj.adjustment_type === 'add' ? (
//                           <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">+ ADD</span>
//                         ) : (
//                           <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">− DEDUCT</span>
//                         )}
//                       </td>
//                       <td className="px-4 py-3 font-bold text-[#1A1A2E]">{adj.days}</td>
//                       <td className="px-4 py-3 text-xs text-[#4B5563] max-w-[220px]">
//                         <span className="line-clamp-2" title={adj.reason}>{adj.reason}</span>
//                       </td>
//                       <td className="px-4 py-3 text-xs font-semibold text-purple-700">{adj.adjusted_by}</td>
//                       <td className="px-4 py-3 text-xs text-[#9CA3AF]">
//                         {adj.adjusted_on
//                           ? new Date(adj.adjusted_on).toLocaleDateString('en-IN', {
//                               day: 'numeric', month: 'short', year: 'numeric',
//                             })
//                           : '—'}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* 📜 DEEP AUDIT HISTORY DRAWER */}
//       {historyDrawer && (
//         <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
//           <div className="w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto p-6">
//             <div className="flex items-center justify-between pb-4 border-b">
//               <div>
//                 <h3 className="text-lg font-extrabold text-[#1A1A2E]">{historyDrawer.name}</h3>
//                 <p className="text-xs text-[#9CA3AF]">
//                   {historyDrawer.emp_code} • Itemized Leave Audit History
//                 </p>
//               </div>
//               <button
//                 onClick={() => setHistoryDrawer(null)}
//                 className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 font-bold hover:bg-gray-200"
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="my-4 rounded-xl bg-blue-50 p-4 border border-blue-100">
//               <p className="text-xs text-blue-700 font-semibold">Current Live Balance</p>
//               <p className="text-2xl font-black text-blue-900">
//                 {historyDrawer.current_balance} Leaves
//               </p>
//               <p className="text-[11px] text-blue-600 mt-1">
//                 Total Credited: {historyDrawer.total_credited} | Total Used:{' '}
//                 {historyDrawer.total_used}
//               </p>
//             </div>

//             <h4 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-3">
//               Month-by-Month Deep Audit
//             </h4>

//             {!historyDrawer.history?.length ? (
//               <p className="text-xs text-[#9CA3AF] py-6 text-center">No monthly history records</p>
//             ) : (
//               <div className="space-y-4">
//                 {historyDrawer.history.map((h, idx) => (
//                   <div key={idx} className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 text-xs shadow-sm">
//                     <div className="flex justify-between font-bold text-[#1A1A2E] mb-2.5">
//                       <span className="text-sm font-black">{MONTHS[(h.month || 1) - 1]} {h.year}</span>
//                       <span className="text-blue-700 text-sm font-black">Closing: {h.closing_balance}</span>
//                     </div>

//                     <div className="grid grid-cols-3 gap-2 text-center text-[11px] mb-3">
//                       <div className="bg-white p-2 rounded-lg border border-gray-100">
//                         <span className="block text-[#9CA3AF] text-[9px] font-bold">OPENING</span>
//                         <span className="font-bold text-gray-800">{h.opening_balance}</span>
//                       </div>
//                       <div className="bg-white p-2 rounded-lg border border-gray-100">
//                         <span className="block text-[#9CA3AF] text-[9px] font-bold">CREDITED</span>
//                         <span className="font-bold text-emerald-700">+{h.credited}</span>
//                       </div>
//                       <div className="bg-white p-2 rounded-lg border border-gray-100">
//                         <span className="block text-[#9CA3AF] text-[9px] font-bold">USED</span>
//                         <span className="font-bold text-rose-700">-{h.used}</span>
//                       </div>
//                     </div>

//                     {/* ITEMIZED ACTIVITY CARDS */}
//                     <div className="border-t border-gray-200 pt-2.5 space-y-2">
//                       <p className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider">
//                         Itemized Breakdown for {MONTHS[(h.month || 1) - 1]}:
//                       </p>

//                       {!h.itemized_logs || h.itemized_logs.length === 0 ? (
//                         <p className="text-[11px] text-gray-400 italic">No leave usage or manual adjustment in this month.</p>
//                       ) : (
//                         h.itemized_logs.map((log, lIdx) => {
//                           const isAdd = log.log_type === 'system_credit' || log.log_type === 'manual_add';
//                           const isLate = log.log_type === 'late_cut';
//                           return (
//                             <div
//                               key={lIdx}
//                               className={`rounded-lg p-2.5 border text-[11px] ${
//                                 isAdd
//                                   ? 'bg-emerald-50/80 border-emerald-200'
//                                   : isLate
//                                   ? 'bg-amber-50/90 border-amber-200'
//                                   : 'bg-rose-50/80 border-rose-200'
//                               }`}
//                             >
//                               <div className="flex justify-between items-center font-bold">
//                                 <span className={
//                                   isAdd
//                                     ? 'text-emerald-800'
//                                     : isLate
//                                     ? 'text-amber-900 font-extrabold'
//                                     : 'text-rose-800'
//                                 }>
//                                   {log.log_type === 'system_credit' && '🎁 '}
//                                   {log.log_type === 'manual_add' && '⚙️ '}
//                                   {log.log_type === 'approved_leave' && '📋 '}
//                                   {log.log_type === 'late_cut' && '⏰ '}
//                                   {log.log_type === 'manual_deduct' && '⚙️ '}
//                                   {log.log_type === 'payroll_deduction' && '💼 '}
//                                   {log.title}
//                                 </span>
//                                 <span className={`text-xs ${isAdd ? 'text-emerald-700' : isLate ? 'text-amber-800 font-extrabold' : 'text-rose-700'}`}>
//                                   {isAdd ? '+' : '-'}{log.days} Day(s)
//                                 </span>
//                               </div>

//                               {log.from_date && log.to_date && (
//                                 <p className="text-[10px] font-semibold text-gray-600 mt-1">
//                                   📅 Leave Dates: {log.from_date} to {log.to_date}
//                                 </p>
//                               )}

//                               {log.reason && (
//                                 <p className="text-[10px] text-gray-700 mt-0.5 italic">
//                                   💬 Reason: "{log.reason}"
//                                 </p>
//                               )}

//                               {log.details && (
//                                 <p className="text-[10px] text-gray-700 mt-0.5 font-medium">
//                                   ℹ️ {log.details}
//                                 </p>
//                               )}

//                               {log.by && (
//                                 <p className="text-[9px] text-purple-700 font-bold mt-1">
//                                   By: {log.by}
//                                 </p>
//                               )}
//                             </div>
//                           );
//                         })
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* ADJUST MODAL */}
//       {adjustModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
//           <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl p-6">
//             <h3 className="text-lg font-extrabold text-[#1A1A2E]">Adjust Leaves</h3>
//             <p className="text-xs text-[#9CA3AF] mb-4">
//               {adjustModal.name} — Current:{' '}
//               <b className="text-blue-600">{adjustModal.current_balance}</b>
//             </p>

//             <div className="grid grid-cols-2 gap-3 mb-4">
//               <button
//                 onClick={() => setAdjustmentType('add')}
//                 className={`py-2.5 rounded-xl font-bold text-xs ${
//                   adjustmentType === 'add'
//                     ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500'
//                     : 'bg-gray-100 text-gray-600'
//                 }`}
//               >
//                 + Add Leaves
//               </button>
//               <button
//                 onClick={() => setAdjustmentType('deduct')}
//                 className={`py-2.5 rounded-xl font-bold text-xs ${
//                   adjustmentType === 'deduct'
//                     ? 'bg-rose-100 text-rose-800 border-2 border-rose-500'
//                     : 'bg-gray-100 text-gray-600'
//                 }`}
//               >
//                 − Deduct Leaves
//               </button>
//             </div>

//             <div className="mb-4">
//               <label className="block text-xs font-semibold mb-1 text-[#4B5563]">Days</label>
//               <input
//                 type="number"
//                 step="0.5"
//                 min="0.5"
//                 value={days}
//                 onChange={(e) => setDays(e.target.value)}
//                 placeholder="e.g. 1, 2, 0.5"
//                 className="w-full rounded-xl border border-gray-200 p-2.5 text-sm font-semibold outline-none focus:border-[#E8590C]"
//               />
//             </div>

//             <div className="mb-5">
//               <label className="block text-xs font-semibold mb-1 text-[#4B5563]">Reason</label>
//               <textarea
//                 value={reason}
//                 onChange={(e) => setReason(e.target.value)}
//                 placeholder="Why are you adjusting?"
//                 rows="2"
//                 className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:border-[#E8590C]"
//               />
//             </div>

//             <div className="flex gap-2">
//               <button
//                 onClick={handleAdjust}
//                 disabled={loading || !days || !reason}
//                 className="flex-1 rounded-xl bg-[#E8590C] py-2.5 text-xs font-bold text-white hover:bg-[#D14800] disabled:opacity-50"
//               >
//                 {loading ? 'Saving...' : 'Confirm Adjustment'}
//               </button>
//               <button
//                 onClick={closeAdjustModal}
//                 className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LeaveAdjustments;






import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllEmployeesWithBalance,
  adjustLeaveBalance,
  fetchAdjustmentHistory,
  deleteAdjustment, // 🆕 Import kiya gaya hai
  clearBalanceMessage,
  clearBalanceError,
} from '../../redux/slices/leaveBalanceSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const LeaveAdjustments = () => {
  const dispatch = useDispatch();
  const {
    allEmployeesWithBalance,
    adjustmentHistory,
    loading,
    historyLoading,
    message,
    error,
  } = useSelector((s) => s.leaveBalance);
  const { companies } = useSelector((s) => s.company);

  const now = new Date();
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');

  const [adjustModal, setAdjustModal] = useState(null);
  const [historyDrawer, setHistoryDrawer] = useState(null);

  const [adjustmentType, setAdjustmentType] = useState('add');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  
  // Target Month & Year selection for Adjustment Modal
  const [adjustMonth, setAdjustMonth] = useState(now.getMonth() + 1);
  const [adjustYear, setAdjustYear] = useState(now.getFullYear());

  const yearsList = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  const refreshAll = () => {
    dispatch(
      fetchAllEmployeesWithBalance({
        company_id: selectedCompany,
        month: selectedMonth,
        year: selectedYear,
        search,
      })
    );
    dispatch(
      fetchAdjustmentHistory({
        company_id: selectedCompany,
        search,
      })
    );
  };

  useEffect(() => {
    dispatch(fetchCompanies());
    refreshAll();
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshAll();
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedCompany, selectedMonth, selectedYear, search]);

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
    // Default modal target month to currently selected filter month
    setAdjustMonth(selectedMonth);
    setAdjustYear(selectedYear);
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
        month: Number(adjustMonth),
        year: Number(adjustYear),
      })
    );

    if (result.meta.requestStatus === 'fulfilled') {
      closeAdjustModal();
      refreshAll();
    }
  };

  // 🆕 Delete and Revert Adjustment Handler
  const handleDeleteAdjustment = async (id) => {
    if (window.confirm('Are you sure you want to delete this adjustment? Balance will automatically revert.')) {
      const result = await dispatch(deleteAdjustment(id));
      if (result.meta.requestStatus === 'fulfilled') {
        refreshAll(); // Automatically reload history and balances after delete
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* HEADER */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            <h1 className="text-lg font-extrabold text-[#1A1A2E]">
              Leave Balances & Deep Audit History
            </h1>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Current balance, approved leaves, late cuts, and manual adjustments — 100% itemized transparency.
            </p>
          </div>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
              >
                <option value="all">All Companies</option>
                {companies?.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Month Snapshot</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, code, dept..."
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
              />
            </div>
          </div>
        </div>

        {/* EMPLOYEES TABLE */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1A1A2E]">Employees Leave Balances</h3>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#E8590C]">
                {allEmployeesWithBalance?.length || 0}
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Snapshot: <b className="text-[#E8590C]">{MONTHS[selectedMonth - 1]} {selectedYear}</b>
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-4 text-sm text-[#9CA3AF]">Loading balances...</p>
            </div>
          ) : !allEmployeesWithBalance?.length ? (
            <div className="py-16 text-center text-sm text-[#9CA3AF]">No employees found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-[#9CA3AF]">Employee</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-[#9CA3AF]">Type</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-blue-600">Current</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-[#9CA3AF]">Open</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-emerald-600">Credit</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-rose-600">Used</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-[#9CA3AF]">Close</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-[#9CA3AF]">Manual Adj</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-[#9CA3AF]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allEmployeesWithBalance.map((emp) => {
                    const monthSnap = emp.selected_month_data;
                    const adjCount = emp.adjustments?.length || 0;
                    return (
                      <tr key={emp._id} className="hover:bg-[#faf8f5]">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#1A1A2E]">{emp.name}</p>
                          <p className="text-xs text-[#9CA3AF]">
                            {emp.emp_code} • {emp.company?.code || '—'} • {emp.department || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                            emp.worker_type === 'site'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {(emp.worker_type || 'office').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-md bg-blue-100 px-3 py-1 text-sm font-extrabold text-blue-800">
                            {emp.current_balance}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-[#4B5563]">
                          {monthSnap ? monthSnap.opening_balance : '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-emerald-700">
                          {monthSnap ? `+${monthSnap.credited}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-rose-700">
                          {monthSnap ? `-${monthSnap.used}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-[#1A1A2E]">
                          {monthSnap ? monthSnap.closing_balance : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {adjCount > 0 ? (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                              {adjCount} adj
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setHistoryDrawer(emp)}
                              className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-200"
                            >
                              📜 History
                            </button>
                            <button
                              onClick={() => openAdjustModal(emp)}
                              className="rounded-lg bg-[#E8590C] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#D14800]"
                            >
                              ⚙️ Adjust
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MANUAL ADJUSTMENTS TABLE */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1A1A2E]">Manual Leave Credits / Adjustments</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Super Admin se manually add/deduct hui leaves
              </p>
            </div>
            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-700">
              {adjustmentHistory?.length || 0} records
            </span>
          </div>

          {historyLoading ? (
            <div className="py-10 text-center text-sm text-[#9CA3AF]">Loading adjustments...</div>
          ) : !adjustmentHistory?.length ? (
            <div className="py-12 text-center text-sm text-[#9CA3AF]">No manual adjustments yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {/* 🆕 Actions header add kiya */}
                    {['Employee', 'Company', 'Month', 'Type', 'Days', 'Reason', 'By', 'Date', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {adjustmentHistory.map((adj, i) => (
                    <tr key={adj._id || i} className="hover:bg-[#faf8f5]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1A1A2E]">{adj.employee_name}</p>
                        <p className="text-xs text-[#9CA3AF]">{adj.emp_code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {adj.company_code || adj.company?.code || adj.company?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-600">
                        {adj.month_label || `${adj.month}/${adj.year}`}
                      </td>
                      <td className="px-4 py-3">
                        {adj.adjustment_type === 'add' ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">+ ADD</span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">− DEDUCT</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#1A1A2E]">{adj.days}</td>
                      <td className="px-4 py-3 text-xs text-[#4B5563] max-w-[220px]">
                        <span className="line-clamp-2" title={adj.reason}>{adj.reason}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-purple-700">{adj.adjusted_by}</td>
                      <td className="px-4 py-3 text-xs text-[#9CA3AF]">
                        {adj.adjusted_on
                          ? new Date(adj.adjusted_on).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      {/* 🆕 Delete / Revert Button */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteAdjustment(adj._id)}
                          className="rounded-lg bg-red-50 border border-red-100 px-3 py-1.5 text-[10px] font-extrabold text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          🗑️ Revert
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 📜 DEEP AUDIT HISTORY DRAWER */}
      {historyDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="text-lg font-extrabold text-[#1A1A2E]">{historyDrawer.name}</h3>
                <p className="text-xs text-[#9CA3AF]">
                  {historyDrawer.emp_code} • Itemized Leave Audit History
                </p>
              </div>
              <button
                onClick={() => setHistoryDrawer(null)}
                className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 font-bold hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="my-4 rounded-xl bg-blue-50 p-4 border border-blue-100">
              <p className="text-xs text-blue-700 font-semibold">Current Live Balance</p>
              <p className="text-2xl font-black text-blue-900">
                {historyDrawer.current_balance} Leaves
              </p>
              <p className="text-[11px] text-blue-600 mt-1">
                Total Credited: {historyDrawer.total_credited} | Total Used:{' '}
                {historyDrawer.total_used}
              </p>
            </div>

            <h4 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-3">
              Month-by-Month Deep Audit
            </h4>

            {!historyDrawer.history?.length ? (
              <p className="text-xs text-[#9CA3AF] py-6 text-center">No monthly history records</p>
            ) : (
              <div className="space-y-4">
                {historyDrawer.history.map((h, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 text-xs shadow-sm">
                    <div className="flex justify-between font-bold text-[#1A1A2E] mb-2.5">
                      <span className="text-sm font-black">{MONTHS[(h.month || 1) - 1]} {h.year}</span>
                      <span className="text-blue-700 text-sm font-black">Closing: {h.closing_balance}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] mb-3">
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="block text-[#9CA3AF] text-[9px] font-bold">OPENING</span>
                        <span className="font-bold text-gray-800">{h.opening_balance}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="block text-[#9CA3AF] text-[9px] font-bold">CREDITED</span>
                        <span className="font-bold text-emerald-700">+{h.credited}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="block text-[#9CA3AF] text-[9px] font-bold">USED</span>
                        <span className="font-bold text-rose-700">-{h.used}</span>
                      </div>
                    </div>

                    {/* ITEMIZED ACTIVITY CARDS */}
                    <div className="border-t border-gray-200 pt-2.5 space-y-2">
                      <p className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider">
                        Itemized Breakdown for {MONTHS[(h.month || 1) - 1]}:
                      </p>

                      {!h.itemized_logs || h.itemized_logs.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">No leave usage or manual adjustment in this month.</p>
                      ) : (
                        h.itemized_logs.map((log, lIdx) => {
                          const isAdd = log.log_type === 'system_credit' || log.log_type === 'manual_add';
                          const isLate = log.log_type === 'late_cut';
                          return (
                            <div
                              key={lIdx}
                              className={`rounded-lg p-2.5 border text-[11px] ${
                                isAdd
                                  ? 'bg-emerald-50/80 border-emerald-200'
                                  : isLate
                                  ? 'bg-amber-50/90 border-amber-200'
                                  : 'bg-rose-50/80 border-rose-200'
                              }`}
                            >
                              <div className="flex justify-between items-center font-bold">
                                <span className={
                                  isAdd
                                    ? 'text-emerald-800'
                                    : isLate
                                    ? 'text-amber-900 font-extrabold'
                                    : 'text-rose-800'
                                }>
                                  {log.log_type === 'system_credit' && '🎁 '}
                                  {log.log_type === 'manual_add' && '⚙️ '}
                                  {log.log_type === 'approved_leave' && '📋 '}
                                  {log.log_type === 'late_cut' && '⏰ '}
                                  {log.log_type === 'manual_deduct' && '⚙️ '}
                                  {log.log_type === 'payroll_deduction' && '💼 '}
                                  {log.title}
                                </span>
                                <span className={`text-xs ${isAdd ? 'text-emerald-700' : isLate ? 'text-amber-800 font-extrabold' : 'text-rose-700'}`}>
                                  {isAdd ? '+' : '-'}{log.days} Day(s)
                                </span>
                              </div>

                              {log.from_date && log.to_date && (
                                <p className="text-[10px] font-semibold text-gray-600 mt-1">
                                  📅 Leave Dates: {log.from_date} to {log.to_date}
                                </p>
                              )}

                              {log.reason && (
                                <p className="text-[10px] text-gray-700 mt-0.5 italic">
                                  💬 Reason: "{log.reason}"
                                </p>
                              )}

                              {log.details && (
                                <p className="text-[10px] text-gray-700 mt-0.5 font-medium">
                                  ℹ️ {log.details}
                                </p>
                              )}

                              {log.by && (
                                <p className="text-[9px] text-purple-700 font-bold mt-1">
                                  By: {log.by}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADJUST MODAL */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl p-6">
            <h3 className="text-lg font-extrabold text-[#1A1A2E]">Adjust Leaves</h3>
            <p className="text-xs text-[#9CA3AF] mb-4">
              {adjustModal.name} — Current Live Balance:{' '}
              <b className="text-blue-600">{adjustModal.current_balance}</b>
            </p>

            {/* Target Month & Year Selector */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#4B5563]">Target Month</label>
                <select
                  value={adjustMonth}
                  onChange={(e) => setAdjustMonth(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-bold outline-none focus:border-[#E8590C]"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[#4B5563]">Target Year</label>
                <select
                  value={adjustYear}
                  onChange={(e) => setAdjustYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-bold outline-none focus:border-[#E8590C]"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setAdjustmentType('add')}
                className={`py-2.5 rounded-xl font-bold text-xs ${
                  adjustmentType === 'add'
                    ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                + Add Leaves
              </button>
              <button
                onClick={() => setAdjustmentType('deduct')}
                className={`py-2.5 rounded-xl font-bold text-xs ${
                  adjustmentType === 'deduct'
                    ? 'bg-rose-100 text-rose-800 border-2 border-rose-500'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                − Deduct Leaves
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1 text-[#4B5563]">Days</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="e.g. 1, 2, 0.5"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm font-semibold outline-none focus:border-[#E8590C]"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold mb-1 text-[#4B5563]">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you adjusting?"
                rows="2"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:border-[#E8590C]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAdjust}
                disabled={loading || !days || !reason}
                className="flex-1 rounded-xl bg-[#E8590C] py-2.5 text-xs font-bold text-white hover:bg-[#D14800] disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Confirm Adjustment'}
              </button>
              <button
                onClick={closeAdjustModal}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveAdjustments;
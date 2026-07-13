// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   fetchMissingCheckouts,
//   fixMissingCheckout,
//   clearFixMessage,
// } from '../../redux/slices/attendanceSlice';
// import { fetchCompanies } from '../../redux/slices/companySlice';

// const FixAttendance = () => {
//   const dispatch = useDispatch();
//   const { missingCheckouts, fixMessage, fixError, loading } = useSelector((s) => s.attendance);
//   const { companies } = useSelector((s) => s.company);

//   const [selectedCompany, setSelectedCompany] = useState('all');
//   const [fromDate, setFromDate] = useState('');
//   const [toDate, setToDate] = useState('');
//   const [empCode, setEmpCode] = useState('');

//   // Modal states
//   const [fixModal, setFixModal] = useState(null);
//   const [outTime, setOutTime] = useState('');
//   const [outAddress, setOutAddress] = useState('');
//   const [reason, setReason] = useState('');

//   useEffect(() => {
//     dispatch(fetchCompanies());
//     loadData();
//   }, [dispatch]);

//   // 🆕 Auto search on filter change (with debounce)
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       loadData();
//     }, 500);
//     return () => clearTimeout(timer);
//   }, [selectedCompany, fromDate, toDate, empCode]);

//   useEffect(() => {
//     if (fixMessage || fixError) {
//       const timer = setTimeout(() => dispatch(clearFixMessage()), 4000);
//       return () => clearTimeout(timer);
//     }
//   }, [fixMessage, fixError, dispatch]);

//   const loadData = () => {
//     const filters = {};
//     if (selectedCompany && selectedCompany !== 'all') filters.company_id = selectedCompany;
//     if (fromDate) filters.from_date = convertDateFormat(fromDate);
//     if (toDate) filters.to_date = convertDateFormat(toDate);
//     if (empCode) filters.emp_code = empCode;

//     dispatch(fetchMissingCheckouts(filters));
//   };

//   const convertDateFormat = (dateStr) => {
//     if (!dateStr) return '';
//     const [y, m, d] = dateStr.split('-').map(Number);
//     return `${d}/${m}/${y}`;
//   };

//   const openFixModal = (record) => {
//     setFixModal(record);
//     setOutTime('');
//     setOutAddress('');
//     setReason('');
//   };

//   const closeFixModal = () => {
//     setFixModal(null);
//     setOutTime('');
//     setOutAddress('');
//     setReason('');
//   };

//   const handleFix = async () => {
//     if (!outTime) { alert('OUT time daalo'); return; }
//     if (!reason || reason.trim() === '') { alert('Reason daalo'); return; }

//     const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
//     if (!timeRegex.test(outTime.trim())) {
//       alert('Time format galat! Example: 06:30 PM');
//       return;
//     }

//     const result = await dispatch(
//       fixMissingCheckout({
//         attendance_id: fixModal._id,
//         out_time: outTime.trim(),
//         out_address: outAddress.trim() || 'Manually added by Super Admin',
//         reason: reason.trim(),
//       })
//     );

//     if (result.meta.requestStatus === 'fulfilled') {
//       closeFixModal();
//       loadData();
//     }
//   };

//   const calculateHours = (inTime, outTime) => {
//     if (!inTime || !outTime) return '—';
//     const parseTime = (t) => {
//       const [time, period] = t.split(' ');
//       let [h, m] = time.split(':').map(Number);
//       if (period === 'PM' && h !== 12) h += 12;
//       if (period === 'AM' && h === 12) h = 0;
//       return h * 60 + m;
//     };
//     const diff = parseTime(outTime) - parseTime(inTime);
//     if (diff <= 0) return '—';
//     return `${Math.floor(diff / 60)}h ${diff % 60}m`;
//   };

//   return (
//     <div className="min-h-screen bg-[#faf8f5]">
//       <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
//       <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

//       <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

//         {/* HEADER */}
//         <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
//           <div className="h-1 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
//           <div className="p-6">
//             <div className="flex items-center gap-3">
//               <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
//                 <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-lg font-extrabold text-[#1A1A2E]">Fix Missing Checkouts</h1>
//                 <p className="text-xs text-[#9CA3AF]">Employees jinhone check-out karna bhool gaye</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* MESSAGES */}
//         {fixMessage && (
//           <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3 animate-slideDown">
//             <svg className="h-5 w-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             <p className="text-sm font-medium text-emerald-800">{fixMessage}</p>
//           </div>
//         )}

//         {fixError && (
//           <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3 animate-slideDown">
//             <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//             <p className="text-sm font-medium text-red-800">{fixError}</p>
//           </div>
//         )}

//         {/* FILTERS */}
//         <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm shadow-gray-200/60">
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

//             {/* 🆕 Search by Name/Code */}
//             <div>
//               <label className="mb-1 block text-xs font-semibold text-[#4B5563]">
//                 Search Employee
//               </label>
//               <div className="relative">
//                 <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
//                   <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
//                   </svg>
//                 </span>
//                 <input
//                   type="text"
//                   value={empCode}
//                   onChange={(e) => setEmpCode(e.target.value)}
//                   placeholder="Name ya code..."
//                   className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#E8590C]"
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="mb-1 block text-xs font-semibold text-[#4B5563]">From Date</label>
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
//               />
//             </div>

//             <div>
//               <label className="mb-1 block text-xs font-semibold text-[#4B5563]">To Date</label>
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
//               />
//             </div>

//             <div className="flex items-end gap-2">
//               <button
//                 onClick={loadData}
//                 className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-2.5 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all"
//               >
//                 🔍 Search
//               </button>
//               {(empCode || fromDate || toDate || selectedCompany !== 'all') && (
//                 <button
//                   onClick={() => {
//                     setEmpCode('');
//                     setFromDate('');
//                     setToDate('');
//                     setSelectedCompany('all');
//                   }}
//                   className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-[#4B5563] hover:bg-gray-50 transition-all"
//                   title="Clear filters"
//                 >
//                   ✕
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* TABLE */}
//         <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
//           <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
//             <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
//               <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//             <div className="flex-1">
//               <h3 className="text-sm font-bold text-[#1A1A2E]">Missing Checkouts</h3>
//               <p className="text-xs text-[#9CA3AF]">Total: {missingCheckouts.length} records</p>
//             </div>
//           </div>

//           {loading ? (
//             <div className="flex flex-col items-center justify-center py-16">
//               <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
//               <p className="mt-4 text-sm text-[#9CA3AF]">Loading...</p>
//             </div>
//           ) : missingCheckouts.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-16">
//               <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
//                 <svg className="h-7 w-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <p className="text-sm font-semibold text-[#1A1A2E]">Sab set hai! 🎉</p>
//               <p className="mt-1 text-xs text-[#9CA3AF]">Koi missing checkout nahi hai</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="bg-[#faf8f5]">
//                     {['Date', 'Employee', 'Code', 'Company', 'IN Time', 'IN Location', 'OUT', 'Action'].map((h) => (
//                       <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-50">
//                   {missingCheckouts.map((rec) => (
//                     <tr key={rec._id} className="transition-colors hover:bg-red-50/30">
//                       <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{rec.date}</td>
//                       <td className="px-5 py-3.5">
//                         <p className="font-semibold text-[#1A1A2E]">{rec.name}</p>
//                       </td>
//                       <td className="px-5 py-3.5 text-[#4B5563] font-mono text-xs">{rec.emp_code}</td>
//                       <td className="px-5 py-3.5">
//                         <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
//                           {rec.company_id?.name || '—'}
//                         </span>
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
//                           {rec.in_time}
//                         </span>
//                       </td>
//                       <td className="px-5 py-3.5 text-xs text-[#4B5563] max-w-xs truncate" title={rec.in_address}>
//                         📍 {rec.in_address || rec.in_site || '—'}
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700 animate-pulse">
//                           ⚠️ MISSING
//                         </span>
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <button
//                           onClick={() => openFixModal(rec)}
//                           className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:-translate-y-0.5 transition-all"
//                         >
//                           ✏️ Add OUT
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* FIX MODAL */}
//       {fixModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
//           <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
//             <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
//             <div className="p-7">

//               <div className="mb-5 flex items-center gap-3">
//                 <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
//                   <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-extrabold text-[#1A1A2E]">Add Missing Checkout</h3>
//                   <p className="text-xs text-[#9CA3AF]">{fixModal.name} — {fixModal.emp_code}</p>
//                 </div>
//               </div>

//               <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3 space-y-1">
//                 <p className="text-xs">
//                   <span className="text-[#9CA3AF]">Date:</span>{' '}
//                   <span className="font-bold text-[#1A1A2E]">{fixModal.date}</span>
//                 </p>
//                 <p className="text-xs">
//                   <span className="text-[#9CA3AF]">IN Time:</span>{' '}
//                   <span className="font-bold text-emerald-700">{fixModal.in_time}</span>
//                 </p>
//                 <p className="text-xs">
//                   <span className="text-[#9CA3AF]">IN Location:</span>{' '}
//                   <span className="font-semibold text-[#4B5563]">{fixModal.in_address || fixModal.in_site || '—'}</span>
//                 </p>
//               </div>

//               <div className="mb-4">
//                 <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
//                   Check-out Time <span className="text-[#E8590C]">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={outTime}
//                   onChange={(e) => setOutTime(e.target.value)}
//                   placeholder="e.g. 06:30 PM"
//                   autoFocus
//                   className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm font-mono font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
//                 />
//                 <p className="mt-1 text-[10px] text-[#9CA3AF]">Format: 06:30 PM ya 09:00 AM (12-hour with AM/PM)</p>

//                 {outTime && fixModal.in_time && (
//                   <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2">
//                     <p className="text-xs text-[#4B5563]">
//                       Working Hours:{' '}
//                       <span className="font-extrabold text-emerald-700">
//                         {calculateHours(fixModal.in_time, outTime)}
//                       </span>
//                     </p>
//                   </div>
//                 )}
//               </div>

//               <div className="mb-4">
//                 <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
//                   Location / Address <span className="text-[#9CA3AF] text-xs">(Optional)</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={outAddress}
//                   onChange={(e) => setOutAddress(e.target.value)}
//                   placeholder="e.g. Office - Bhopal"
//                   className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none focus:border-[#E8590C]"
//                 />
//               </div>

//               <div className="mb-6">
//                 <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
//                   Reason <span className="text-[#E8590C]">*</span>
//                 </label>
//                 <textarea
//                   value={reason}
//                   onChange={(e) => setReason(e.target.value)}
//                   rows="3"
//                   placeholder="e.g. Employee forgot to checkout, System issue, etc."
//                   className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none focus:border-[#E8590C] resize-none"
//                 />
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={handleFix}
//                   disabled={!outTime || !reason}
//                   className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   ✓ Add Checkout
//                 </button>
//                 <button
//                   onClick={closeFixModal}
//                   className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50 transition-all"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <style>{`
//         @keyframes modalIn {
//           from { opacity:0; transform:scale(.95) translateY(10px) }
//           to   { opacity:1; transform:scale(1) translateY(0) }
//         }
//         .animate-modalIn { animation:modalIn .25s ease-out }
//         @keyframes slideDown {
//           from { opacity: 0; transform: translateY(-10px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-slideDown { animation: slideDown 0.3s ease-out; }
//       `}</style>
//     </div>
//   );
// };

// export default FixAttendance;








import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMissingCheckouts,
  fetchAllAttendanceForFix,
  fixMissingCheckout,
  editAttendance,
  clearFixMessage,
} from '../../redux/slices/attendanceSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const FixAttendance = () => {
  const dispatch = useDispatch();
  const { 
    missingCheckouts, 
    allRecordsForFix,
    fixMessage, 
    fixError, 
    loading,
    fixLoading,
  } = useSelector((s) => s.attendance);
  const { companies } = useSelector((s) => s.company);

  const [viewMode, setViewMode] = useState('missing'); // 'missing' | 'all'
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [empCode, setEmpCode] = useState('');

  // 🆕 Combined Edit Modal
  const [editModal, setEditModal] = useState(null);
  const [inTime, setInTime] = useState('');
  const [outTime, setOutTime] = useState('');
  const [inAddress, setInAddress] = useState('');
  const [outAddress, setOutAddress] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    dispatch(fetchCompanies());
    loadData();
  }, [dispatch, viewMode]);

  // Auto search on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedCompany, fromDate, toDate, empCode]);

  useEffect(() => {
    if (fixMessage || fixError) {
      const timer = setTimeout(() => dispatch(clearFixMessage()), 4000);
      return () => clearTimeout(timer);
    }
  }, [fixMessage, fixError, dispatch]);

  const loadData = () => {
    const filters = {};
    if (selectedCompany && selectedCompany !== 'all') filters.company_id = selectedCompany;
    if (fromDate) filters.from_date = convertDateFormat(fromDate);
    if (toDate) filters.to_date = convertDateFormat(toDate);
    if (empCode) filters.emp_code = empCode;

    if (viewMode === 'missing') {
      dispatch(fetchMissingCheckouts(filters));
    } else {
      dispatch(fetchAllAttendanceForFix(filters));
    }
  };

  const convertDateFormat = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d}/${m}/${y}`;
  };

  // 🆕 Open Edit Modal (auto-fill current values)
  const openEditModal = (record) => {
    setEditModal(record);
    setInTime(record.in_time || '');
    setOutTime(record.out_time || '');
    setInAddress(record.in_address || record.in_site || '');
    setOutAddress(record.out_address || record.out_site || '');
    setReason('');
  };

  const closeEditModal = () => {
    setEditModal(null);
    setInTime('');
    setOutTime('');
    setInAddress('');
    setOutAddress('');
    setReason('');
  };

  const handleSave = async () => {
    if (!reason || reason.trim() === '') {
      alert('Reason daalo');
      return;
    }

    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/;

    if (inTime && !timeRegex.test(inTime.trim())) {
      alert('IN time format galat! Example: 09:30 AM');
      return;
    }

    if (outTime && !timeRegex.test(outTime.trim())) {
      alert('OUT time format galat! Example: 06:30 PM');
      return;
    }

    // Check if anything changed
    const inChanged = inTime && inTime !== editModal.in_time;
    const outChanged = outTime && outTime !== editModal.out_time;

    if (!inChanged && !outChanged) {
      alert('Kuch bhi change nahi kiya!');
      return;
    }

    let result;

    // 🆕 Use editAttendance for both IN and OUT changes
    result = await dispatch(
      editAttendance({
        attendance_id: editModal._id,
        in_time: inChanged ? inTime.trim() : undefined,
        out_time: outChanged ? outTime.trim() : undefined,
        in_address: inChanged && inAddress ? inAddress.trim() : undefined,
        out_address: outChanged && outAddress ? outAddress.trim() : undefined,
        reason: reason.trim(),
      })
    );

    if (result.meta.requestStatus === 'fulfilled') {
      closeEditModal();
      loadData();
    }
  };

  const calculateHours = (inTime, outTime) => {
    if (!inTime || !outTime) return '—';
    const parseTime = (t) => {
      const [time, period] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    const diff = parseTime(outTime) - parseTime(inTime);
    if (diff <= 0) return '—';
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const displayRecords = viewMode === 'missing' ? missingCheckouts : allRecordsForFix;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* HEADER */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="h-1 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
          <div className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-[#1A1A2E]">Fix Attendance</h1>
                  <p className="text-xs text-[#9CA3AF]">Edit IN/OUT times aur missing checkouts fix karo</p>
                </div>
              </div>

              {/* 🆕 Mode Toggle */}
              <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('missing')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                    viewMode === 'missing'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-[#4B5563] hover:bg-white'
                  }`}
                >
                  ⚠️ Missing OUT
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                    viewMode === 'all'
                      ? 'bg-[#E8590C] text-white shadow-md'
                      : 'text-[#4B5563] hover:bg-white'
                  }`}
                >
                  📋 All Records
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        {fixMessage && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3 animate-slideDown">
            <svg className="h-5 w-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-emerald-800">{fixMessage}</p>
          </div>
        )}

        {fixError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3 animate-slideDown">
            <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm font-medium text-red-800">{fixError}</p>
          </div>
        )}

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm shadow-gray-200/60">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              <label className="mb-1 block text-xs font-semibold text-[#4B5563]">Search Employee</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value)}
                  placeholder="Name ya code..."
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#E8590C]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#4B5563]">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#4B5563]">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-3 text-sm outline-none focus:border-[#E8590C]"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={loadData}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-2.5 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all"
              >
                🔍 Search
              </button>
              {(empCode || fromDate || toDate || selectedCompany !== 'all') && (
                <button
                  onClick={() => {
                    setEmpCode('');
                    setFromDate('');
                    setToDate('');
                    setSelectedCompany('all');
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-[#4B5563] hover:bg-gray-50"
                  title="Clear filters"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              viewMode === 'missing' ? 'bg-red-50' : 'bg-orange-50'
            }`}>
              <svg className={`h-5 w-5 ${viewMode === 'missing' ? 'text-red-600' : 'text-[#E8590C]'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#1A1A2E]">
                {viewMode === 'missing' ? 'Missing Checkouts' : 'All Records'}
              </h3>
              <p className="text-xs text-[#9CA3AF]">Total: {displayRecords.length} records</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-4 text-sm text-[#9CA3AF]">Loading...</p>
            </div>
          ) : displayRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <svg className="h-7 w-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#1A1A2E]">
                {viewMode === 'missing' ? 'Sab set hai! 🎉' : 'Koi records nahi'}
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {viewMode === 'missing' ? 'Koi missing checkout nahi hai' : 'Filter change karke try karo'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Date', 'Employee', 'Code', 'Company', 'IN Time', 'OUT Time', 'Hours', 'Status', 'Action'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayRecords.map((rec) => {
                    const hasOut = rec.out_time && rec.out_time !== '';
                    const workingHours = hasOut ? calculateHours(rec.in_time, rec.out_time) : '—';

                    return (
                      <tr key={rec._id} className={`transition-colors hover:bg-red-50/30 ${!hasOut ? 'bg-red-50/20' : ''}`}>
                        <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{rec.date}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-[#1A1A2E]">{rec.name}</p>
                        </td>
                        <td className="px-5 py-3.5 text-[#4B5563] font-mono text-xs">{rec.emp_code}</td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            {rec.company_id?.name || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                            {rec.in_time}
                          </span>
                          {rec.is_late && (
                            <span className="ml-1 text-[9px] font-bold text-amber-600">⏰</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {hasOut ? (
                            <span className="rounded-md bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700">
                              {rec.out_time}
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700 animate-pulse">
                              ⚠️ MISSING
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">
                          {workingHours}
                        </td>
                        <td className="px-5 py-3.5">
                          {rec.is_half_day ? (
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                              ⚠️ Half Day
                            </span>
                          ) : rec.is_late ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              ⏰ Late
                            </span>
                          ) : hasOut ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              ✅ Present
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              ⚠️ Incomplete
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => openEditModal(rec)}
                            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:-translate-y-0.5 transition-all ${
                              !hasOut
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                : 'bg-gradient-to-r from-[#E8590C] to-[#D14800]'
                            }`}
                          >
                            {!hasOut ? '✏️ Add OUT' : '✏️ Edit'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 🆕 EDIT MODAL - IN + OUT BOTH */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn max-h-[95vh] overflow-y-auto">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#D14800]" />
            <div className="p-7">

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <svg className="h-6 w-6 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A1A2E]">Edit Attendance</h3>
                  <p className="text-xs text-[#9CA3AF]">{editModal.name} — {editModal.emp_code}</p>
                </div>
              </div>

              {/* Info Box */}
              <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3 space-y-1">
                <p className="text-xs">
                  <span className="text-[#9CA3AF]">Date:</span>{' '}
                  <span className="font-bold text-[#1A1A2E]">{editModal.date}</span>
                </p>
                <p className="text-xs">
                  <span className="text-[#9CA3AF]">Current IN:</span>{' '}
                  <span className="font-bold text-emerald-700">{editModal.in_time || '—'}</span>
                </p>
                <p className="text-xs">
                  <span className="text-[#9CA3AF]">Current OUT:</span>{' '}
                  <span className="font-bold text-red-700">{editModal.out_time || '⚠️ MISSING'}</span>
                </p>
              </div>

              {/* 🆕 IN TIME */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Check-IN Time
                </label>
                <input
                  type="text"
                  value={inTime}
                  onChange={(e) => setInTime(e.target.value)}
                  placeholder="e.g. 09:30 AM"
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm font-mono font-semibold text-[#1A1A2E] outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.07)]"
                />
                <p className="mt-1 text-[10px] text-[#9CA3AF]">Format: 09:30 AM (12-hour with AM/PM)</p>
                
                {/* IN Location */}
                <input
                  type="text"
                  value={inAddress}
                  onChange={(e) => setInAddress(e.target.value)}
                  placeholder="IN Location (optional)"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-xs text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none focus:border-emerald-500"
                />
              </div>

              {/* 🆕 OUT TIME */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Check-OUT Time
                </label>
                <input
                  type="text"
                  value={outTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  placeholder="e.g. 06:30 PM"
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm font-mono font-semibold text-[#1A1A2E] outline-none focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.07)]"
                />
                <p className="mt-1 text-[10px] text-[#9CA3AF]">Format: 06:30 PM (12-hour with AM/PM)</p>

                {/* OUT Location */}
                <input
                  type="text"
                  value={outAddress}
                  onChange={(e) => setOutAddress(e.target.value)}
                  placeholder="OUT Location (optional)"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-xs text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none focus:border-red-500"
                />
              </div>

              {/* Working Hours Preview */}
              {inTime && outTime && (
                <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 border border-blue-200">
                  <p className="text-xs text-[#4B5563]">
                    Working Hours:{' '}
                    <span className="font-extrabold text-blue-700 text-base">
                      {calculateHours(inTime, outTime)}
                    </span>
                  </p>
                </div>
              )}

              {/* Reason */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Reason <span className="text-[#E8590C]">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows="3"
                  placeholder="e.g. Employee came early, wrong time recorded, System issue..."
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none focus:border-[#E8590C] resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={fixLoading || !reason}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {fixLoading ? 'Saving...' : '✓ Save Changes'}
                </button>
                <button
                  onClick={closeEditModal}
                  disabled={fixLoading}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50"
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

export default FixAttendance;
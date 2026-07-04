// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchAllAttendance } from '../../redux/slices/attendanceSlice';

// const AttendanceList = () => {
//   const dispatch = useDispatch();
//   const { allAttendance, loading, error } = useSelector((s) => s.attendance);

//   const getTodayDateForInput = () => new Date().toISOString().split('T')[0];

//   const formatDateForBackend = (inputDate) => {
//     if (!inputDate) return undefined;
//     if (inputDate.includes('/')) return inputDate;
//     const parts = inputDate.split('-');
//     if (parts.length !== 3) return inputDate;
//     const [year, month, day] = parts;
//     if (!year || !month || !day) return inputDate;
//     return `${Number(day)}/${Number(month)}/${year}`;
//   };

//   const [date, setDate] = useState(getTodayDateForInput());
//   const [empCode, setEmpCode] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [selectedPhoto, setSelectedPhoto] = useState(null);

//   useEffect(() => {
//     dispatch(fetchAllAttendance({ date: formatDateForBackend(getTodayDateForInput()) }));
//   }, [dispatch]);

//   const handleSearch = () => {
//     dispatch(fetchAllAttendance({
//       date: date ? formatDateForBackend(date) : undefined,
//       emp_code: empCode || undefined,
//     }));
//   };

//   const handleClearDate = () => {
//     setDate('');
//     dispatch(fetchAllAttendance({ emp_code: empCode || undefined }));
//   };

//   const handleReset = () => {
//     const today = getTodayDateForInput();
//     setDate(today);
//     setEmpCode('');
//     setStatusFilter('all');
//     dispatch(fetchAllAttendance({ date: formatDateForBackend(today) }));
//   };

//   const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

//   const filteredAttendance = (allAttendance || []).filter((r) => {
//     if (statusFilter === 'all') return true;
//     if (statusFilter === 'flagged') return r.flagged === true;
//     if (statusFilter === 'on-site') return r.in_location_status === 'on-site';
//     if (statusFilter === 'out-of-range') return r.in_location_status === 'out-of-range';
//     if (statusFilter === 'no-gps') return !r.in_location_status || r.in_location_status === 'no-gps';
//     return true;
//   });

//   const totalPresent = (allAttendance || []).length;
//   const onSiteCount = (allAttendance || []).filter((r) => r.in_location_status === 'on-site').length;
//   const outOfRangeCount = (allAttendance || []).filter((r) => r.in_location_status === 'out-of-range').length;
//   const flaggedCount = (allAttendance || []).filter((r) => r.flagged === true).length;

//   const locationBadge = (status, distance) => {
//     if (!status || status === 'no-gps') {
//       return (
//         <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
//           No GPS
//         </span>
//       );
//     }
//     if (status === 'on-site') {
//       return (
//         <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
//           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
//           On Site {distance ? `(${distance}m)` : ''}
//         </span>
//       );
//     }
//     return (
//       <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
//         <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
//         Out of Range {distance ? `(${distance}m)` : ''}
//       </span>
//     );
//   };

//   const statCards = [
//     { label: 'Total Present', value: totalPresent, color: '#E8590C', bg: '#FFF3E8', border: '#E8590C', filter: 'all' },
//     { label: 'On Site', value: onSiteCount, color: '#16a34a', bg: '#f0fdf4', border: '#16a34a', filter: 'on-site' },
//     { label: 'Out of Range', value: outOfRangeCount, color: '#dc2626', bg: '#fef2f2', border: '#dc2626', filter: 'out-of-range' },
//     { label: '🚩 Flagged', value: flaggedCount, color: '#d97706', bg: '#fffbeb', border: '#d97706', filter: 'flagged' },
//   ];

//   return (
//     <div className="min-h-screen bg-[#faf8f5]">
//       <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
//       <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

//       <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

//         {/* Header card */}
//         <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
//           <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
//           <div className="p-6">
//             <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
//                   <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h2 className="text-lg font-extrabold text-[#1A1A2E]">Attendance Records</h2>
//                   <p className="text-xs text-[#9CA3AF]">{filteredAttendance.length} records found</p>
//                 </div>
//               </div>
//               <button
//                 onClick={handleReset}
//                 className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#4B5563] transition-all hover:border-[#E8590C]/30 hover:bg-[#FFF8F3] hover:text-[#E8590C]"
//               >
//                 Reset
//               </button>
//             </div>

//             <div className="flex flex-wrap items-center gap-3">
//               <input
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 className="rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm text-[#1A1A2E] outline-none focus:border-[#E8590C]"
//               />

//               {date && (
//                 <button
//                   onClick={handleClearDate}
//                   className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#9CA3AF] hover:border-red-200 hover:bg-red-50 hover:text-red-500"
//                 >
//                   Clear Date
//                 </button>
//               )}

//               <input
//                 type="text"
//                 placeholder="Employee Code"
//                 value={empCode}
//                 onChange={(e) => setEmpCode(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 className="w-44 rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm text-[#1A1A2E] outline-none focus:border-[#E8590C]"
//               />

//               <button
//                 onClick={handleSearch}
//                 disabled={loading}
//                 className="rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-60"
//               >
//                 {loading ? 'Searching…' : 'Search'}
//               </button>
//             </div>

//             {error && (
//               <div className="mt-4 rounded-xl border border-red-100 bg-red-50/80 px-4 py-3">
//                 <p className="text-sm text-red-600">{error}</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Stat Cards */}
//         <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
//           {statCards.map((card) => (
//             <div
//               key={card.label}
//               onClick={() => setStatusFilter(card.filter === statusFilter ? 'all' : card.filter)}
//               className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
//               style={{ border: `2px solid ${statusFilter === card.filter ? card.border : 'transparent'}` }}
//             >
//               <div className="h-1 w-full" style={{ background: card.color, opacity: statusFilter === card.filter ? 1 : 0.3 }} />
//               <div className="p-5">
//                 <p className="text-3xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
//                 <p className="mt-1 text-xs font-medium text-[#9CA3AF]">{card.label}</p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Table */}
//         <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
//           {loading ? (
//             <div className="flex flex-col items-center justify-center py-20">
//               <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
//               <p className="mt-4 text-sm text-[#9CA3AF]">Loading records…</p>
//             </div>
//           ) : filteredAttendance.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-20">
//               <p className="text-sm font-medium text-[#9CA3AF]">No attendance records found</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="bg-[#faf8f5]">
//                     {['Photo', 'Name', 'Code', 'Date', 'IN', 'IN Location', 'OUT', 'OUT Location', 'Status'].map((h) => (
//                       <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-50">
//                   {filteredAttendance.map((record) => (
//                     <tr key={record._id} className={`hover:bg-[#faf8f5] transition-colors ${record.flagged ? 'bg-amber-50/30' : ''}`}>
//                       <td className="px-5 py-3.5">
//                         {record.in_selfie_url ? (
//                           <button
//                             onClick={() => setSelectedPhoto({ record, type: 'IN' })}
//                             className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-[#E8590C] transition-all"
//                           >
//                             <img src={record.in_selfie_url} alt="IN" className="h-12 w-12 object-cover" loading="lazy" />
//                             {record.flagged && (
//                               <span className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] px-1 rounded-bl">🚩</span>
//                             )}
//                           </button>
//                         ) : (
//                           <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
//                             <span className="text-[10px] text-gray-400">No Photo</span>
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{record.name}</td>
//                       <td className="px-5 py-3.5 text-[#4B5563]">{record.emp_code}</td>
//                       <td className="px-5 py-3.5 text-[#4B5563]">{record.date}</td>
//                       <td className="px-5 py-3.5 font-semibold text-emerald-600">{record.in_time || '-'}</td>
//                       <td className="px-5 py-3.5">
//                         <div className="flex flex-col gap-1">
//                           {locationBadge(record.in_location_status, record.in_distance)}
//                           {record.in_site && (
//                             <span className="text-[11px] text-[#9CA3AF]">📍 {record.in_site}</span>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-5 py-3.5 font-semibold text-red-500">{record.out_time || '-'}</td>
//                       <td className="px-5 py-3.5">
//                         {record.out_time ? (
//                           <div className="flex items-center gap-2">
//                             {record.out_selfie_url && (
//                               <button
//                                 onClick={() => setSelectedPhoto({ record, type: 'OUT' })}
//                                 className="overflow-hidden rounded border border-gray-200 hover:border-[#E8590C]"
//                               >
//                                 <img src={record.out_selfie_url} alt="OUT" className="h-8 w-8 object-cover" />
//                               </button>
//                             )}
//                             <div className="flex flex-col gap-1">
//                               {locationBadge(record.out_location_status, record.out_distance)}
//                               {record.out_site && (
//                                 <span className="text-[11px] text-[#9CA3AF]">📍 {record.out_site}</span>
//                               )}
//                             </div>
//                           </div>
//                         ) : (
//                           <span className="text-[#D1D5DB]">—</span>
//                         )}
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
//                           record.flagged ? 'bg-amber-50 text-amber-700' :
//                           record.status === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
//                         }`}>
//                           {record.flagged ? '🚩 Flagged' : record.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {selectedPhoto && (
//         <PhotoModal
//           data={selectedPhoto}
//           onClose={() => setSelectedPhoto(null)}
//         />
//       )}
//     </div>
//   );
// };

// // PHOTO MODAL WITH ADDRESS
// const PhotoModal = ({ data, onClose }) => {
//   const { record, type } = data;
//   const photoUrl = type === 'IN' ? record.in_selfie_url : record.out_selfie_url;
//   const time = type === 'IN' ? record.in_time : record.out_time;
//   const location = type === 'IN' ? record.in_location_status : record.out_location_status;
//   const distance = type === 'IN' ? record.in_distance : record.out_distance;
//   const site = type === 'IN' ? record.in_site : record.out_site;
//   const latitude = type === 'IN' ? record.in_latitude : record.out_latitude;
//   const longitude = type === 'IN' ? record.in_longitude : record.out_longitude;
//   const address = type === 'IN' ? record.in_address : record.out_address;  // 🆕

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className={`px-5 py-3 flex items-center justify-between sticky top-0 z-10 ${
//           type === 'IN' ? 'bg-emerald-600' : 'bg-[#E8590C]'
//         }`}>
//           <h3 className="text-white font-bold">
//             {type === 'IN' ? '✅ Check In' : '🏁 Check Out'} - {record.name}
//           </h3>
//           <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
//             <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         <div className="bg-gray-100 p-4">
//           <img src={photoUrl} alt="Selfie" className="w-full rounded-xl shadow-md" />
//         </div>

//         <div className="p-5 space-y-3">
//           <div className="grid grid-cols-2 gap-3 text-sm">
//             <div>
//               <p className="text-xs text-gray-500 font-semibold uppercase">Emp Code</p>
//               <p className="font-bold text-gray-800">{record.emp_code}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
//               <p className="font-bold text-gray-800">{record.date}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 font-semibold uppercase">Time</p>
//               <p className="font-bold text-gray-800">{time}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 font-semibold uppercase">Confidence</p>
//               <p className="font-bold text-emerald-600">🔒 {record.confidence}%</p>
//             </div>
//           </div>

//           <div className={`rounded-xl p-3 border ${
//             location === 'on-site' ? 'bg-emerald-50 border-emerald-200' :
//             location === 'out-of-range' ? 'bg-red-50 border-red-200' :
//             'bg-gray-50 border-gray-200'
//           }`}>
//             <p className="text-xs font-bold uppercase mb-1">
//               {location === 'on-site' ? '✅ On Site' :
//                location === 'out-of-range' ? '⚠️ Out of Range' :
//                '❌ No GPS'}
//             </p>
//             {site && <p className="text-sm font-semibold">{site}</p>}
//             {distance > 0 && <p className="text-xs">Distance: {distance}m</p>}
            
//             {/* 🆕 Full Address Display */}
//             {address && (
//               <div className="mt-3 pt-3 border-t border-gray-300">
//                 <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">
//                   📌 Full Address:
//                 </p>
//                 <p className="text-xs text-gray-800 font-medium leading-relaxed">
//                   {address}
//                 </p>
//               </div>
//             )}
            
//             {latitude && longitude && (
//               <div className="mt-3 pt-3 border-t border-gray-300">
//                 <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">
//                   📊 Coordinates:
//                 </p>
//                 <p className="font-mono text-[11px] text-gray-700">
//                   {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
//                 </p>
//                 <a
//                   href={`https://www.google.com/maps?q=${latitude},${longitude}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 hover:underline"
//                 >
//                   📍 View on Google Maps →
//                 </a>
//               </div>
//             )}
//           </div>

//           {record.flagged && record.flag_reasons?.length > 0 && (
//             <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
//               <p className="text-xs font-bold text-amber-700 uppercase mb-2">🚩 Flags</p>
//               <ul className="space-y-1">
//                 {record.flag_reasons.map((reason, i) => (
//                   <li key={i} className="text-xs text-amber-700">• {reason.replace(/_/g, ' ')}</li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </div>
//       </div>

//       <style>{`
//         @keyframes slideUp {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-slideUp { animation: slideUp 0.3s ease-out; }
//       `}</style>
//     </div>
//   );
// };

// export default AttendanceList;




/////////////////////////////////////////////////////////////////////////////////


import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAllAttendance,
  searchEmployees,
  fetchEmployeeHistory,
} from '../../redux/slices/attendanceSlice';

const AttendanceList = () => {
  const dispatch = useDispatch();
  const { allAttendance, loading, error, searchResults, employeeHistory } = useSelector((s) => s.attendance);

  const getTodayDateForInput = () => new Date().toISOString().split('T')[0];

  const formatDateForBackend = (inputDate) => {
    if (!inputDate) return undefined;
    if (inputDate.includes('/')) return inputDate;
    const parts = inputDate.split('-');
    if (parts.length !== 3) return inputDate;
    const [year, month, day] = parts;
    if (!year || !month || !day) return inputDate;
    return `${Number(day)}/${Number(month)}/${year}`;
  };

  // Regular filters
  const [date, setDate] = useState(getTodayDateForInput());
  const [empCode, setEmpCode] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // 🆕 Employee Search Filters
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!searchMode) {
      dispatch(fetchAllAttendance({ date: formatDateForBackend(getTodayDateForInput()) }));
    }
  }, [dispatch, searchMode]);

  // 🆕 Debounced search
  const debounceSearch = useCallback(
    debounce((query) => {
      if (query.length >= 2) {
        dispatch(searchEmployees(query));
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    }, 300),
    [dispatch]
  );

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debounceSearch(query);
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setSearchQuery(emp.name);
    setShowDropdown(false);
  };

  const handleFetchHistory = () => {
    if (!selectedEmployee) {
      alert('Please select an employee first');
      return;
    }
    dispatch(fetchEmployeeHistory({
      emp_id: selectedEmployee._id,
      from_date: fromDate ? formatDateForBackend(fromDate) : undefined,
      to_date: toDate ? formatDateForBackend(toDate) : undefined,
    }));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedEmployee(null);
    setFromDate('');
    setToDate('');
    setShowDropdown(false);
  };

  const handleToggleMode = () => {
    setSearchMode(!searchMode);
    handleClearSearch();
  };

  // Regular filter handlers
  const handleSearch = () => {
    dispatch(fetchAllAttendance({
      date: date ? formatDateForBackend(date) : undefined,
      emp_code: empCode || undefined,
    }));
  };

  const handleClearDate = () => {
    setDate('');
    dispatch(fetchAllAttendance({ emp_code: empCode || undefined }));
  };

  const handleReset = () => {
    const today = getTodayDateForInput();
    setDate(today);
    setEmpCode('');
    setStatusFilter('all');
    dispatch(fetchAllAttendance({ date: formatDateForBackend(today) }));
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  // Display records - Either from search or regular
  const displayRecords = searchMode && employeeHistory 
    ? employeeHistory.records 
    : (allAttendance || []).filter((r) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'flagged') return r.flagged === true;
        if (statusFilter === 'on-site') return r.in_location_status === 'on-site';
        if (statusFilter === 'out-of-range') return r.in_location_status === 'out-of-range';
        if (statusFilter === 'no-gps') return !r.in_location_status || r.in_location_status === 'no-gps';
        return true;
      });

  const totalPresent = (allAttendance || []).length;
  const onSiteCount = (allAttendance || []).filter((r) => r.in_location_status === 'on-site').length;
  const outOfRangeCount = (allAttendance || []).filter((r) => r.in_location_status === 'out-of-range').length;
  const flaggedCount = (allAttendance || []).filter((r) => r.flagged === true).length;

  const locationBadge = (status, distance) => {
    if (!status || status === 'no-gps') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
          No GPS
        </span>
      );
    }
    if (status === 'on-site') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          On Site {distance ? `(${distance}m)` : ''}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Out of Range {distance ? `(${distance}m)` : ''}
      </span>
    );
  };

  const statCards = [
    { label: 'Total Present', value: totalPresent, color: '#E8590C', bg: '#FFF3E8', border: '#E8590C', filter: 'all' },
    { label: 'On Site', value: onSiteCount, color: '#16a34a', bg: '#f0fdf4', border: '#16a34a', filter: 'on-site' },
    { label: 'Out of Range', value: outOfRangeCount, color: '#dc2626', bg: '#fef2f2', border: '#dc2626', filter: 'out-of-range' },
    { label: '🚩 Flagged', value: flaggedCount, color: '#d97706', bg: '#fffbeb', border: '#d97706', filter: 'flagged' },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
                  <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#1A1A2E]">Attendance Records</h2>
                  <p className="text-xs text-[#9CA3AF]">{displayRecords.length} records found</p>
                </div>
              </div>

              {/* 🆕 Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={handleToggleMode}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    searchMode 
                      ? 'bg-[#E8590C] text-white shadow-md' 
                      : 'bg-white text-[#4B5563] border border-gray-200 hover:bg-[#FFF3E8]'
                  }`}
                >
                  {searchMode ? '🔍 Employee Search Mode' : '📅 Date Mode'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#4B5563] hover:border-[#E8590C]/30 hover:bg-[#FFF8F3] hover:text-[#E8590C]"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* 🆕 EMPLOYEE SEARCH MODE */}
            {searchMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Employee Search with Dropdown */}
                  <div className="relative md:col-span-2">
                    <label className="text-xs font-bold uppercase text-[#9CA3AF] mb-2 block">
                      Search Employee
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Type name or code..."
                      className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm outline-none focus:border-[#E8590C]"
                    />
                    
                    {/* Dropdown */}
                    {showDropdown && searchResults?.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-20 max-h-60 overflow-y-auto">
                        {searchResults.map((emp) => (
                          <button
                            key={emp._id}
                            onClick={() => handleSelectEmployee(emp)}
                            className="w-full text-left px-4 py-3 hover:bg-[#FFF3E8] border-b border-gray-100 last:border-0"
                          >
                            <p className="font-bold text-[#1A1A2E]">{emp.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-[#E8590C] bg-[#FFF3E8] px-2 py-0.5 rounded">
                                {emp.emp_code}
                              </span>
                              {emp.department && (
                                <span className="text-[10px] text-[#9CA3AF]">{emp.department}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* From Date */}
                  <div>
                    <label className="text-xs font-bold uppercase text-[#9CA3AF] mb-2 block">From Date</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm outline-none focus:border-[#E8590C]"
                    />
                  </div>

                  {/* To Date */}
                  <div>
                    <label className="text-xs font-bold uppercase text-[#9CA3AF] mb-2 block">To Date</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm outline-none focus:border-[#E8590C]"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex gap-3">
                  <button
                    onClick={handleFetchHistory}
                    disabled={!selectedEmployee || loading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : '🔍 View Attendance History'}
                  </button>
                  <button
                    onClick={handleClearSearch}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#4B5563] hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>

                {/* Selected Employee Info */}
                {selectedEmployee && (
                  <div className="rounded-xl bg-[#FFF3E8] border border-[#E8590C]/20 p-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8590C] text-white font-bold">
                      {selectedEmployee.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1A1A2E]">{selectedEmployee.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold text-[#E8590C]">{selectedEmployee.emp_code}</span>
                        {selectedEmployee.department && (
                          <span className="text-[11px] text-[#9CA3AF]">• {selectedEmployee.department}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Employee History Summary */}
                {employeeHistory?.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white border border-gray-100 p-3 text-center">
                      <p className="text-2xl font-extrabold text-[#E8590C]">{employeeHistory.summary.total_records}</p>
                      <p className="text-[10px] text-[#9CA3AF] uppercase font-bold">Total Days</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                      <p className="text-2xl font-extrabold text-emerald-600">{employeeHistory.summary.total_present}</p>
                      <p className="text-[10px] text-emerald-700 uppercase font-bold">Present</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                      <p className="text-2xl font-extrabold text-amber-600">{employeeHistory.summary.total_late}</p>
                      <p className="text-[10px] text-amber-700 uppercase font-bold">Late</p>
                    </div>
                    <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
                      <p className="text-2xl font-extrabold text-orange-600">{employeeHistory.summary.total_worked_hours}</p>
                      <p className="text-[10px] text-orange-700 uppercase font-bold">Total Hours</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Regular Date Mode */
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm text-[#1A1A2E] outline-none focus:border-[#E8590C]"
                />

                {date && (
                  <button
                    onClick={handleClearDate}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#9CA3AF] hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  >
                    Clear Date
                  </button>
                )}

                <input
                  type="text"
                  placeholder="Employee Code"
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-44 rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm text-[#1A1A2E] outline-none focus:border-[#E8590C]"
                />

                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading ? 'Searching…' : 'Search'}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50/80 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stat Cards - Only show in Date Mode */}
        {!searchMode && (
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                onClick={() => setStatusFilter(card.filter === statusFilter ? 'all' : card.filter)}
                className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
                style={{ border: `2px solid ${statusFilter === card.filter ? card.border : 'transparent'}` }}
              >
                <div className="h-1 w-full" style={{ background: card.color, opacity: statusFilter === card.filter ? 1 : 0.3 }} />
                <div className="p-5">
                  <p className="text-3xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
                  <p className="mt-1 text-xs font-medium text-[#9CA3AF]">{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-4 text-sm text-[#9CA3AF]">Loading records…</p>
            </div>
          ) : displayRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm font-medium text-[#9CA3AF]">
                {searchMode 
                  ? selectedEmployee 
                    ? 'No records found for selected employee' 
                    : 'Please search and select an employee'
                  : 'No attendance records found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Photo', 'Name', 'Code', 'Date', 'IN', 'IN Location', 'OUT', 'OUT Location', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayRecords.map((record) => (
                    <tr key={record._id} className={`hover:bg-[#faf8f5] transition-colors ${record.flagged ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        {record.in_selfie_url ? (
                          <button
                            onClick={() => setSelectedPhoto({ record, type: 'IN' })}
                            className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-[#E8590C]"
                          >
                            <img src={record.in_selfie_url} alt="IN" className="h-12 w-12 object-cover" loading="lazy" />
                            {record.flagged && (
                              <span className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] px-1 rounded-bl">🚩</span>
                            )}
                          </button>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-[10px] text-gray-400">No Photo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{record.name}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{record.emp_code}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{record.date}</td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-600">
                        {record.in_time || '-'}
                        {record.is_late && (
                          <span className="ml-1 text-[9px] font-bold text-amber-600">⏰</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          {locationBadge(record.in_location_status, record.in_distance)}
                          {record.in_site && (
                            <span className="text-[11px] text-[#9CA3AF]">📍 {record.in_site}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-red-500">{record.out_time || '-'}</td>
                      <td className="px-5 py-3.5">
                        {record.out_time ? (
                          <div className="flex items-center gap-2">
                            {record.out_selfie_url && (
                              <button
                                onClick={() => setSelectedPhoto({ record, type: 'OUT' })}
                                className="overflow-hidden rounded border border-gray-200 hover:border-[#E8590C]"
                              >
                                <img src={record.out_selfie_url} alt="OUT" className="h-8 w-8 object-cover" />
                              </button>
                            )}
                            <div className="flex flex-col gap-1">
                              {locationBadge(record.out_location_status, record.out_distance)}
                              {record.out_site && (
                                <span className="text-[11px] text-[#9CA3AF]">📍 {record.out_site}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#D1D5DB]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold w-fit ${
                            record.flagged ? 'bg-amber-50 text-amber-700' :
                            record.is_half_day ? 'bg-orange-50 text-orange-700' :
                            record.is_late ? 'bg-amber-50 text-amber-700' :
                            record.status === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {record.flagged ? '🚩 Flagged' : 
                             record.is_half_day ? '⚠️ Half Day' :
                             record.is_late ? '⏰ Late' :
                             record.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedPhoto && (
        <PhotoModal data={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
};

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// PHOTO MODAL WITH ADDRESS
const PhotoModal = ({ data, onClose }) => {
  const { record, type } = data;
  const photoUrl = type === 'IN' ? record.in_selfie_url : record.out_selfie_url;
  const time = type === 'IN' ? record.in_time : record.out_time;
  const location = type === 'IN' ? record.in_location_status : record.out_location_status;
  const distance = type === 'IN' ? record.in_distance : record.out_distance;
  const site = type === 'IN' ? record.in_site : record.out_site;
  const latitude = type === 'IN' ? record.in_latitude : record.out_latitude;
  const longitude = type === 'IN' ? record.in_longitude : record.out_longitude;
  const address = type === 'IN' ? record.in_address : record.out_address;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-5 py-3 flex items-center justify-between sticky top-0 z-10 ${
          type === 'IN' ? 'bg-emerald-600' : 'bg-[#E8590C]'
        }`}>
          <h3 className="text-white font-bold">
            {type === 'IN' ? '✅ Check In' : '🏁 Check Out'} - {record.name}
          </h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-gray-100 p-4">
          <img src={photoUrl} alt="Selfie" className="w-full rounded-xl shadow-md" />
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Emp Code</p>
              <p className="font-bold text-gray-800">{record.emp_code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
              <p className="font-bold text-gray-800">{record.date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Time</p>
              <p className="font-bold text-gray-800">{time}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Confidence</p>
              <p className="font-bold text-emerald-600">🔒 {record.confidence}%</p>
            </div>
          </div>

          <div className={`rounded-xl p-3 border ${
            location === 'on-site' ? 'bg-emerald-50 border-emerald-200' :
            location === 'out-of-range' ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <p className="text-xs font-bold uppercase mb-1">
              {location === 'on-site' ? '✅ On Site' :
               location === 'out-of-range' ? '⚠️ Out of Range' :
               '❌ No GPS'}
            </p>
            {site && <p className="text-sm font-semibold">{site}</p>}
            {distance > 0 && <p className="text-xs">Distance: {distance}m</p>}
            
            {address && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">
                  📌 Full Address:
                </p>
                <p className="text-xs text-gray-800 font-medium leading-relaxed">
                  {address}
                </p>
              </div>
            )}
            
            {latitude && longitude && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">
                  📊 Coordinates:
                </p>
                <p className="font-mono text-[11px] text-gray-700">
                  {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  📍 View on Google Maps →
                </a>
              </div>
            )}
          </div>

          {record.flagged && record.flag_reasons?.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs font-bold text-amber-700 uppercase mb-2">🚩 Flags</p>
              <ul className="space-y-1">
                {record.flag_reasons.map((reason, i) => (
                  <li key={i} className="text-xs text-amber-700">• {reason.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default AttendanceList;
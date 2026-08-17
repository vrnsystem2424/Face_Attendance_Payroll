



// // src/pages/super-admin/AllEmployees.jsx

// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   fetchEmployees,
//   deleteEmployee,
//   updateWorkerType,        // ✅ NEW
//   getDeletePreview,
//   clearDeletePreview,
// } from '../../redux/slices/employeeSlice';
// import { fetchCompanies } from '../../redux/slices/companySlice';

// const AllEmployees = () => {
//   const dispatch = useDispatch();
//   const { employees, loading, deletePreview } = useSelector((s) => s.employees);
//   const { companies } = useSelector((s) => s.company);

//   const [filters, setFilters] = useState({
//     company: 'all',
//     search: '',
//     status: 'all',
//     workerType: 'all', // ✅ NEW
//   });

//   // Delete modal
//   const [deleteModal, setDeleteModal] = useState(null);
//   const [deleteConfirmText, setDeleteConfirmText] = useState('');
//   const [deletingId, setDeletingId] = useState(null);

//   // ✅ NEW - Worker Type Modal
//   const [workerTypeModal, setWorkerTypeModal] = useState(null);
//   const [editWorkerType, setEditWorkerType] = useState('office');
//   const [workerTypeLoading, setWorkerTypeLoading] = useState(false);

//   useEffect(() => {
//     dispatch(fetchEmployees(''));
//     dispatch(fetchCompanies());
//   }, [dispatch]);

//   // ── Filter employees ──
//   const filteredEmployees = employees.filter((emp) => {
//     if (filters.status !== 'all' && emp.status !== filters.status) return false;

//     if (filters.company !== 'all') {
//       const empCompanyId = emp.company_id?._id || emp.company_id;
//       if (empCompanyId !== filters.company) return false;
//     }

//     // ✅ NEW - Worker Type Filter
//     if (filters.workerType !== 'all') {
//       const empWorkerType = emp.worker_type || 'office';
//       if (empWorkerType !== filters.workerType) return false;
//     }

//     if (filters.search) {
//       const search = filters.search.toLowerCase();
//       return (
//         emp.name?.toLowerCase().includes(search) ||
//         emp.emp_code?.toLowerCase().includes(search) ||
//         emp.phone?.includes(search) ||
//         emp.department?.toLowerCase().includes(search) ||
//         emp.email?.toLowerCase().includes(search)
//       );
//     }

//     return true;
//   });

//   // Company-wise stats
//   const companyStats = {};
//   let totalSalary = 0;
//   employees.forEach((emp) => {
//     const compName = emp.company_id?.name || emp.department || 'Unknown';
//     if (!companyStats[compName]) companyStats[compName] = { count: 0, salary: 0 };
//     companyStats[compName].count++;
//     companyStats[compName].salary += emp.monthly_salary || 0;
//     totalSalary += emp.monthly_salary || 0;
//   });

//   // ✅ NEW - Worker type stats
//   const officeCount = employees.filter(e => (e.worker_type || 'office') === 'office').length;
//   const siteCount = employees.filter(e => e.worker_type === 'site').length;

//   const formatINR = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

//   // ── DELETE ──
//   const openDeleteModal = (emp) => {
//     setDeleteModal(emp);
//     setDeleteConfirmText('');
//     dispatch(getDeletePreview(emp._id));
//   };

//   const handleDeleteConfirm = async () => {
//     if (deleteConfirmText !== 'DELETE') { alert('Type "DELETE" to confirm'); return; }
//     setDeletingId(deleteModal._id);
//     const result = await dispatch(deleteEmployee(deleteModal._id));
//     setDeletingId(null);
//     if (result.meta.requestStatus === 'fulfilled') {
//       setDeleteModal(null);
//       setDeleteConfirmText('');
//       dispatch(clearDeletePreview());
//       dispatch(fetchEmployees(''));
//     } else {
//       alert(result.payload || 'Delete failed');
//     }
//   };

//   const closeDeleteModal = () => {
//     setDeleteModal(null);
//     setDeleteConfirmText('');
//     dispatch(clearDeletePreview());
//   };

//   // ✅ NEW - WORKER TYPE
//   const openWorkerTypeModal = (emp) => {
//     setWorkerTypeModal(emp);
//     setEditWorkerType(emp.worker_type || 'office');
//   };

//   const handleWorkerTypeUpdate = async () => {
//     setWorkerTypeLoading(true);
//     const result = await dispatch(
//       updateWorkerType({ id: workerTypeModal._id, worker_type: editWorkerType })
//     );
//     setWorkerTypeLoading(false);
//     if (result.meta.requestStatus === 'fulfilled') {
//       setWorkerTypeModal(null);
//     }
//   };

//   const statusStyle = (status) => {
//     if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
//     if (status === 'pending') return 'bg-amber-50 text-amber-700';
//     return 'bg-red-50 text-red-600';
//   };

//   return (
//     <div className="min-h-screen bg-[#faf8f5]">
//       <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />

//       <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

//         {/* ── Header ── */}
//         <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md">
//               <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
//               </svg>
//             </div>
//             <div>
//               <div className="flex items-center gap-2">
//                 <h1 className="text-2xl font-extrabold text-[#1A1A2E]">All Employees</h1>
//                 <span className="rounded-full bg-gradient-to-r from-[#E8590C] to-[#D14800] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
//                   Global
//                 </span>
//               </div>
//               <p className="text-sm text-[#9CA3AF]">{employees.length} employees across all companies</p>
//             </div>
//           </div>

//           {/* ✅ NEW - Worker Type Quick Stats */}
//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2">
//               <span className="text-base">🏢</span>
//               <div>
//                 <p className="text-[10px] font-bold uppercase text-purple-600">Office</p>
//                 <p className="text-sm font-extrabold text-purple-700">{officeCount}</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
//               <span className="text-base">🚧</span>
//               <div>
//                 <p className="text-[10px] font-bold uppercase text-blue-600">Site</p>
//                 <p className="text-sm font-extrabold text-blue-700">{siteCount}</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ── Company Stats ── */}
//         <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//           {Object.entries(companyStats).map(([name, stat]) => (
//             <div key={name} className="overflow-hidden rounded-2xl bg-white shadow-sm">
//               <div className="h-1 w-full bg-[#E8590C]" />
//               <div className="p-4">
//                 <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">{name}</p>
//                 <p className="mt-1 text-xl font-extrabold text-[#1A1A2E]">
//                   {stat.count} <span className="text-sm text-[#9CA3AF]">employees</span>
//                 </p>
//                 <p className="mt-1 text-lg font-bold text-[#E8590C]">{formatINR(stat.salary)}</p>
//                 <p className="text-[10px] text-[#9CA3AF]">Monthly salary</p>
//               </div>
//             </div>
//           ))}
//           <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D44] shadow-sm">
//             <div className="h-1 w-full bg-[#E8590C]" />
//             <div className="p-4 text-white">
//               <p className="text-xs font-bold uppercase tracking-wider text-gray-300">Total All Companies</p>
//               <p className="mt-1 text-xl font-extrabold">
//                 {employees.length} <span className="text-sm text-gray-400">employees</span>
//               </p>
//               <p className="mt-1 text-lg font-bold text-[#F4A261]">{formatINR(totalSalary)}</p>
//               <p className="text-[10px] text-gray-400">Monthly salary</p>
//             </div>
//           </div>
//         </div>

//         {/* ── Filters ── */}
//         <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
//           <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
//           <div className="p-6">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

//               {/* Search */}
//               <div>
//                 <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Search</label>
//                 <div className="relative">
//                   <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
//                     <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
//                     </svg>
//                   </span>
//                   <input
//                     type="text"
//                     placeholder="Name, code, phone, email..."
//                     value={filters.search}
//                     onChange={(e) => setFilters({ ...filters, search: e.target.value })}
//                     className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#E8590C]"
//                   />
//                 </div>
//               </div>

//               {/* Company */}
//               <div>
//                 <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Company</label>
//                 <select
//                   value={filters.company}
//                   onChange={(e) => setFilters({ ...filters, company: e.target.value })}
//                   className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
//                 >
//                   <option value="all">All Companies ({employees.length})</option>
//                   {companies.map((c) => (
//                     <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
//                   ))}
//                 </select>
//               </div>

//               {/* Status */}
//               <div>
//                 <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Status</label>
//                 <select
//                   value={filters.status}
//                   onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//                   className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
//                 >
//                   <option value="all">All Status</option>
//                   <option value="approved">Approved</option>
//                   <option value="pending">Pending</option>
//                   <option value="rejected">Rejected</option>
//                 </select>
//               </div>

//               {/* ✅ NEW - Worker Type Filter */}
//               <div>
//                 <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Worker Type</label>
//                 <select
//                   value={filters.workerType}
//                   onChange={(e) => setFilters({ ...filters, workerType: e.target.value })}
//                   className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="office">🏢 Office Workers ({officeCount})</option>
//                   <option value="site">🚧 Site Workers ({siteCount})</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ── Table ── */}
//         <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
//           <div className="border-b border-gray-100 px-6 py-4">
//             <h3 className="text-base font-bold text-[#1A1A2E]">
//               {filteredEmployees.length} employees
//             </h3>
//           </div>

//           {loading ? (
//             <div className="flex items-center justify-center py-20">
//               <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
//             </div>
//           ) : filteredEmployees.length === 0 ? (
//             <div className="py-20 text-center text-sm text-[#9CA3AF]">No employees found</div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="bg-[#faf8f5]">
//                     {[
//                       'Sr', 'Name', 'Code', 'Phone', 'Company',
//                       'Department', 'Designation', 'Salary',
//                       'Worker Type',  // ✅ NEW
//                       'Face', 'Status', 'Actions'
//                     ].map((h) => (
//                       <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-50">
//                   {filteredEmployees.map((emp, idx) => (
//                     <tr key={emp._id} className="hover:bg-[#faf8f5] transition-colors">

//                       {/* Sr */}
//                       <td className="px-4 py-3 text-[#9CA3AF]">{idx + 1}</td>

//                       {/* Name */}
//                       <td className="px-4 py-3">
//                         <p className="font-semibold text-[#1A1A2E]">{emp.name}</p>
//                         <p className="text-[10px] text-[#9CA3AF]">{emp.email}</p>
//                       </td>

//                       {/* Code */}
//                       <td className="px-4 py-3 font-mono font-bold text-[#1A1A2E]">{emp.emp_code}</td>

//                       {/* Phone */}
//                       <td className="px-4 py-3 text-[#4B5563]">{emp.phone}</td>

//                       {/* Company */}
//                       <td className="px-4 py-3">
//                         <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
//                           {emp.company_id?.name || emp.department}
//                         </span>
//                       </td>

//                       {/* Department */}
//                       <td className="px-4 py-3 text-[#4B5563]">{emp.department}</td>

//                       {/* Designation */}
//                       <td className="px-4 py-3 text-[#4B5563] text-xs">{emp.designation || '—'}</td>

//                       {/* Salary */}
//                       <td className="px-4 py-3">
//                         {emp.monthly_salary > 0 ? (
//                           <span className="font-bold text-[#1A1A2E]">{formatINR(emp.monthly_salary)}</span>
//                         ) : (
//                           <span className="text-[11px] italic text-gray-400">Not set</span>
//                         )}
//                       </td>

//                       {/* ✅ NEW - Worker Type */}
//                       <td className="px-4 py-3">
//                         <div className="flex items-center gap-1.5">
//                           <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
//                             emp.worker_type === 'site'
//                               ? 'bg-blue-50 text-blue-700'
//                               : 'bg-purple-50 text-purple-700'
//                           }`}>
//                             <span className={`h-1.5 w-1.5 rounded-full ${
//                               emp.worker_type === 'site' ? 'bg-blue-500' : 'bg-purple-500'
//                             }`} />
//                             {emp.worker_type === 'site' ? '🚧 Site' : '🏢 Office'}
//                           </span>
//                           {emp.status === 'approved' && (
//                             <button
//                               onClick={() => openWorkerTypeModal(emp)}
//                               className="rounded-md border border-gray-200 bg-white p-1 text-[#9CA3AF] transition-all hover:border-[#E8590C] hover:bg-[#FFF8F3] hover:text-[#E8590C]"
//                               title="Change Worker Type"
//                             >
//                               <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
//                               </svg>
//                             </button>
//                           )}
//                         </div>
//                       </td>

//                       {/* Face */}
//                       <td className="px-4 py-3">
//                         <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
//                           emp.face_registered ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'
//                         }`}>
//                           <span className={`h-1.5 w-1.5 rounded-full ${emp.face_registered ? 'bg-emerald-500' : 'bg-red-500'}`} />
//                           {emp.face_registered ? 'Yes' : 'No'}
//                         </span>
//                       </td>

//                       {/* Status */}
//                       <td className="px-4 py-3">
//                         <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(emp.status)}`}>
//                           {emp.status}
//                         </span>
//                       </td>

//                       {/* Actions */}
//                       <td className="px-4 py-3">
//                         <button
//                           onClick={() => openDeleteModal(emp)}
//                           disabled={deletingId === emp._id}
//                           className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
//                           title="Delete Employee"
//                         >
//                           {deletingId === emp._id ? (
//                             <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
//                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                             </svg>
//                           ) : (
//                             <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
//                             </svg>
//                           )}
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

//       {/* ══════════════════════════════════════════════ */}
//       {/* ✅ NEW - WORKER TYPE MODAL                    */}
//       {/* ══════════════════════════════════════════════ */}
//       {workerTypeModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
//           <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
//             <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
//             <div className="p-7">

//               {/* Header */}
//               <div className="mb-5 flex items-center gap-3">
//                 <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
//                   <svg className="h-6 w-6 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-extrabold text-[#1A1A2E]">Worker Type</h3>
//                   <p className="text-xs text-[#9CA3AF]">
//                     {workerTypeModal.name} — {workerTypeModal.emp_code}
//                   </p>
//                 </div>
//               </div>

//               {/* Employee Info */}
//               <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3 space-y-1">
//                 <p className="text-xs text-[#9CA3AF]">
//                   Company:{' '}
//                   <span className="font-bold text-blue-600">
//                     {workerTypeModal.company_id?.name || '—'}
//                   </span>
//                 </p>
//                 <p className="text-xs text-[#9CA3AF]">
//                   Department:{' '}
//                   <span className="font-bold text-[#1A1A2E]">
//                     {workerTypeModal.department || '—'}
//                   </span>
//                 </p>
//                 <p className="text-xs text-[#9CA3AF]">
//                   Current Type:{' '}
//                   <span className="font-bold text-[#1A1A2E]">
//                     {workerTypeModal.worker_type === 'site' ? '🚧 Site Worker' : '🏢 Office Worker'}
//                   </span>
//                 </p>
//               </div>

//               {/* Toggle Cards */}
//               <div className="mb-6">
//                 <label className="mb-3 block text-sm font-semibold text-[#1A1A2E]">
//                   Select Worker Type <span className="text-[#E8590C]">*</span>
//                 </label>
//                 <div className="grid grid-cols-2 gap-3">

//                   {/* Office */}
//                   <button
//                     onClick={() => setEditWorkerType('office')}
//                     className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
//                       editWorkerType === 'office'
//                         ? 'border-purple-500 bg-purple-50'
//                         : 'border-gray-200 bg-white hover:border-gray-300'
//                     }`}
//                   >
//                     {editWorkerType === 'office' && (
//                       <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500">
//                         <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
//                         </svg>
//                       </div>
//                     )}
//                     <div className="mb-2 text-2xl">🏢</div>
//                     <p className="text-sm font-bold text-[#1A1A2E]">Office Worker</p>
//                     <p className="mt-1 text-[10px] text-[#9CA3AF] leading-tight">
//                       9:45 AM ke baad aane par Late mark hoga
//                     </p>
//                   </button>

//                   {/* Site */}
//                   <button
//                     onClick={() => setEditWorkerType('site')}
//                     className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
//                       editWorkerType === 'site'
//                         ? 'border-blue-500 bg-blue-50'
//                         : 'border-gray-200 bg-white hover:border-gray-300'
//                     }`}
//                   >
//                     {editWorkerType === 'site' && (
//                       <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
//                         <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
//                         </svg>
//                       </div>
//                     )}
//                     <div className="mb-2 text-2xl">🚧</div>
//                     <p className="text-sm font-bold text-[#1A1A2E]">Site Worker</p>
//                     <p className="mt-1 text-[10px] text-[#9CA3AF] leading-tight">
//                       Kabhi bhi aaye — Late nahi lagegi
//                     </p>
//                   </button>
//                 </div>

//                 {/* Info Box */}
//                 <div className={`mt-3 rounded-xl p-3 text-[11px] leading-relaxed ${
//                   editWorkerType === 'site'
//                     ? 'bg-blue-50 text-blue-700'
//                     : 'bg-purple-50 text-purple-700'
//                 }`}>
//                   {editWorkerType === 'site'
//                     ? '✅ Site worker ko late nahi lagegi — GPS location se koi fark nahi padega'
//                     : '⏰ Office worker ko 9:45 AM ke baad aane par late mark hoga'}
//                 </div>
//               </div>

//               {/* Buttons */}
//               <div className="flex gap-3">
//                 <button
//                   onClick={handleWorkerTypeUpdate}
//                   disabled={workerTypeLoading}
//                   className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
//                 >
//                   {workerTypeLoading ? (
//                     <span className="flex items-center justify-center gap-2">
//                       <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                       </svg>
//                       Updating...
//                     </span>
//                   ) : 'Update Worker Type'}
//                 </button>
//                 <button
//                   onClick={() => { setWorkerTypeModal(null); setEditWorkerType('office'); }}
//                   disabled={workerTypeLoading}
//                   className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50 disabled:opacity-50"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ══════════════════════════════════════════════ */}
//       {/* DELETE MODAL                                  */}
//       {/* ══════════════════════════════════════════════ */}
//       {deleteModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
//           <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
//             <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-red-600" />
//             <div className="p-7">
//               <div className="mb-5 flex items-center gap-3">
//                 <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
//                   <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-extrabold text-red-600">⚠️ Delete Employee?</h3>
//                   <p className="text-xs text-[#9CA3AF]">This action cannot be undone</p>
//                 </div>
//               </div>

//               <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3 space-y-1">
//                 <p className="text-sm"><span className="text-[#9CA3AF]">Name:</span> <span className="font-bold text-[#1A1A2E]">{deleteModal.name}</span></p>
//                 <p className="text-sm"><span className="text-[#9CA3AF]">Code:</span> <span className="font-bold text-[#1A1A2E]">{deleteModal.emp_code}</span></p>
//                 <p className="text-sm"><span className="text-[#9CA3AF]">Email:</span> <span className="font-bold text-[#1A1A2E]">{deleteModal.email}</span></p>
//                 <p className="text-sm"><span className="text-[#9CA3AF]">Company:</span> <span className="font-bold text-[#E8590C]">{deleteModal.company_id?.name || '—'}</span></p>
//                 {deleteModal.role && deleteModal.role !== 'employee' && (
//                   <p className="text-sm"><span className="text-[#9CA3AF]">Role:</span> <span className="font-bold text-purple-600 uppercase">{deleteModal.role}</span></p>
//                 )}
//               </div>

//               {deletePreview ? (
//                 <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50 p-4">
//                   <p className="text-sm font-bold text-red-700 mb-3">🗑️ Following data will be permanently deleted:</p>
//                   <div className="grid grid-cols-3 gap-2">
//                     {[
//                       { count: deletePreview.counts.attendance_records, label: 'Attendance' },
//                       { count: deletePreview.counts.leave_records, label: 'Leaves' },
//                       { count: deletePreview.counts.photos, label: 'Photos' },
//                     ].map((item) => (
//                       <div key={item.label} className="rounded-lg bg-white p-3 text-center">
//                         <p className="text-2xl font-extrabold text-red-600">{item.count}</p>
//                         <p className="text-[10px] text-gray-500 uppercase font-bold">{item.label}</p>
//                       </div>
//                     ))}
//                   </div>
//                   <p className="mt-3 text-[11px] text-red-700">+ Employee profile, leave balance, all login data, Cloudinary photos</p>
//                 </div>
//               ) : (
//                 <div className="mb-5 flex justify-center py-4">
//                   <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
//                 </div>
//               )}

//               <div className="mb-5">
//                 <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
//                   Type <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-red-700">DELETE</span> to confirm:
//                 </label>
//                 <input
//                   type="text"
//                   value={deleteConfirmText}
//                   onChange={(e) => setDeleteConfirmText(e.target.value)}
//                   placeholder="Type DELETE here"
//                   autoFocus
//                   className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-sm font-mono font-bold text-red-600 placeholder:text-gray-300 placeholder:font-normal outline-none focus:border-red-500"
//                 />
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={handleDeleteConfirm}
//                   disabled={deleteConfirmText !== 'DELETE' || deletingId === deleteModal._id}
//                   className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
//                 >
//                   {deletingId === deleteModal._id ? 'Deleting...' : '🗑️ Delete Forever'}
//                 </button>
//                 <button
//                   onClick={closeDeleteModal}
//                   disabled={deletingId === deleteModal._id}
//                   className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50"
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
//       `}</style>
//     </div>
//   );
// };

// export default AllEmployees;






// src/pages/super-admin/AllEmployees.jsx

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployees,
  deleteEmployee,
  updateWorkerType,
  updateJoiningDate,        // ✅ NEW
  getDeletePreview,
  clearDeletePreview,
} from '../../redux/slices/employeeSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const AllEmployees = () => {
  const dispatch = useDispatch();
  const { employees, loading, deletePreview } = useSelector((s) => s.employees);
  const { companies } = useSelector((s) => s.company);

  const [filters, setFilters] = useState({
    company: 'all',
    search: '',
    status: 'all',
    workerType: 'all',
  });

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Worker Type Modal
  const [workerTypeModal, setWorkerTypeModal] = useState(null);
  const [editWorkerType, setEditWorkerType] = useState('office');
  const [workerTypeLoading, setWorkerTypeLoading] = useState(false);

  // ✅ NEW - Joining Date Modal
  const [joiningDateModal, setJoiningDateModal] = useState(null);
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [joiningDateLoading, setJoiningDateLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees(''));
    dispatch(fetchCompanies());
  }, [dispatch]);

  // ── Filter ──
  const filteredEmployees = employees.filter((emp) => {
    if (filters.status !== 'all' && emp.status !== filters.status) return false;
    if (filters.company !== 'all') {
      const empCompanyId = emp.company_id?._id || emp.company_id;
      if (empCompanyId !== filters.company) return false;
    }
    if (filters.workerType !== 'all') {
      const empWorkerType = emp.worker_type || 'office';
      if (empWorkerType !== filters.workerType) return false;
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        emp.name?.toLowerCase().includes(search) ||
        emp.emp_code?.toLowerCase().includes(search) ||
        emp.phone?.includes(search) ||
        emp.department?.toLowerCase().includes(search) ||
        emp.email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Stats
  const companyStats = {};
  let totalSalary = 0;
  employees.forEach((emp) => {
    const compName = emp.company_id?.name || emp.department || 'Unknown';
    if (!companyStats[compName]) companyStats[compName] = { count: 0, salary: 0 };
    companyStats[compName].count++;
    companyStats[compName].salary += emp.monthly_salary || 0;
    totalSalary += emp.monthly_salary || 0;
  });

  const officeCount = employees.filter(e => (e.worker_type || 'office') === 'office').length;
  const siteCount = employees.filter(e => e.worker_type === 'site').length;

  const formatINR = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

  // ── DELETE ──
  const openDeleteModal = (emp) => {
    setDeleteModal(emp);
    setDeleteConfirmText('');
    dispatch(getDeletePreview(emp._id));
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== 'DELETE') { alert('Type "DELETE" to confirm'); return; }
    setDeletingId(deleteModal._id);
    const result = await dispatch(deleteEmployee(deleteModal._id));
    setDeletingId(null);
    if (result.meta.requestStatus === 'fulfilled') {
      setDeleteModal(null);
      setDeleteConfirmText('');
      dispatch(clearDeletePreview());
      dispatch(fetchEmployees(''));
    } else {
      alert(result.payload || 'Delete failed');
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
    setDeleteConfirmText('');
    dispatch(clearDeletePreview());
  };

  // ── WORKER TYPE ──
  const openWorkerTypeModal = (emp) => {
    setWorkerTypeModal(emp);
    setEditWorkerType(emp.worker_type || 'office');
  };

  const handleWorkerTypeUpdate = async () => {
    setWorkerTypeLoading(true);
    const result = await dispatch(
      updateWorkerType({ id: workerTypeModal._id, worker_type: editWorkerType })
    );
    setWorkerTypeLoading(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setWorkerTypeModal(null);
    }
  };

  // ✅ NEW - JOINING DATE
  const openJoiningDateModal = (emp) => {
    setJoiningDateModal(emp);
    setEditJoiningDate(emp.joining_date || '');
  };

  const handleJoiningDateUpdate = async () => {
    setJoiningDateLoading(true);
    const result = await dispatch(
      updateJoiningDate({ id: joiningDateModal._id, joining_date: editJoiningDate })
    );
    setJoiningDateLoading(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setJoiningDateModal(null);
      setEditJoiningDate('');
    }
  };

  // ── Joining Date Preview Helper ──
  const getJoiningMonthPreview = (dateStr) => {
    if (!dateStr || !dateStr.includes('/')) return null;
    const parts = dateStr.split('/').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [d, m, y] = parts;
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    if (m < 1 || m > 12) return null;
    return `${monthNames[m]} ${y}`;
  };

  const statusStyle = (status) => {
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-600';
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* ── Header ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#1A1A2E]">All Employees</h1>
                <span className="rounded-full bg-gradient-to-r from-[#E8590C] to-[#D14800] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  Global
                </span>
              </div>
              <p className="text-sm text-[#9CA3AF]">{employees.length} employees across all companies</p>
            </div>
          </div>

          {/* Worker Type Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2">
              <span className="text-base">🏢</span>
              <div>
                <p className="text-[10px] font-bold uppercase text-purple-600">Office</p>
                <p className="text-sm font-extrabold text-purple-700">{officeCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
              <span className="text-base">🚧</span>
              <div>
                <p className="text-[10px] font-bold uppercase text-blue-600">Site</p>
                <p className="text-sm font-extrabold text-blue-700">{siteCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Company Stats ── */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(companyStats).map(([name, stat]) => (
            <div key={name} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="h-1 w-full bg-[#E8590C]" />
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">{name}</p>
                <p className="mt-1 text-xl font-extrabold text-[#1A1A2E]">
                  {stat.count} <span className="text-sm text-[#9CA3AF]">employees</span>
                </p>
                <p className="mt-1 text-lg font-bold text-[#E8590C]">{formatINR(stat.salary)}</p>
                <p className="text-[10px] text-[#9CA3AF]">Monthly salary</p>
              </div>
            </div>
          ))}
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D44] shadow-sm">
            <div className="h-1 w-full bg-[#E8590C]" />
            <div className="p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-300">Total All Companies</p>
              <p className="mt-1 text-xl font-extrabold">
                {employees.length} <span className="text-sm text-gray-400">employees</span>
              </p>
              <p className="mt-1 text-lg font-bold text-[#F4A261]">{formatINR(totalSalary)}</p>
              <p className="text-[10px] text-gray-400">Monthly salary</p>
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

              {/* Search */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Search</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Name, code, phone, email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#E8590C]"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Company</label>
                <select
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
                >
                  <option value="all">All Companies ({employees.length})</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Worker Type Filter */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Worker Type</label>
                <select
                  value={filters.workerType}
                  onChange={(e) => setFilters({ ...filters, workerType: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
                >
                  <option value="all">All Types</option>
                  <option value="office">🏢 Office ({officeCount})</option>
                  <option value="site">🚧 Site ({siteCount})</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-bold text-[#1A1A2E]">
              {filteredEmployees.length} employees
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-20 text-center text-sm text-[#9CA3AF]">No employees found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {[
                      'Sr', 'Name', 'Code', 'Phone', 'Company',
                      'Department', 'Designation', 'Salary',
                      'Joining',       // ✅ NEW
                      'Worker Type',
                      'Face', 'Status', 'Actions'
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEmployees.map((emp, idx) => (
                    <tr key={emp._id} className="hover:bg-[#faf8f5] transition-colors">

                      {/* Sr */}
                      <td className="px-4 py-3 text-[#9CA3AF]">{idx + 1}</td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1A1A2E]">{emp.name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{emp.email}</p>
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3 font-mono font-bold text-[#1A1A2E]">{emp.emp_code}</td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-[#4B5563]">{emp.phone}</td>

                      {/* Company */}
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {emp.company_id?.name || emp.department}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 text-[#4B5563]">{emp.department}</td>

                      {/* Designation */}
                      <td className="px-4 py-3 text-[#4B5563] text-xs">{emp.designation || '—'}</td>

                      {/* Salary */}
                      <td className="px-4 py-3">
                        {emp.monthly_salary > 0 ? (
                          <span className="font-bold text-[#1A1A2E]">{formatINR(emp.monthly_salary)}</span>
                        ) : (
                          <span className="text-[11px] italic text-gray-400">Not set</span>
                        )}
                      </td>

                      {/* ✅ NEW - Joining Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] ${emp.joining_date ? 'font-semibold text-[#1A1A2E]' : 'italic text-gray-400'}`}>
                            {emp.joining_date || 'Not set'}
                          </span>
                          {emp.status === 'approved' && (
                            <button
                              onClick={() => openJoiningDateModal(emp)}
                              className="rounded-md border border-gray-200 bg-white p-1 text-[#9CA3AF] transition-all hover:border-[#E8590C] hover:bg-[#FFF8F3] hover:text-[#E8590C]"
                              title="Set Joining Date"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Worker Type */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            emp.worker_type === 'site'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              emp.worker_type === 'site' ? 'bg-blue-500' : 'bg-purple-500'
                            }`} />
                            {emp.worker_type === 'site' ? '🚧 Site' : '🏢 Office'}
                          </span>
                          {emp.status === 'approved' && (
                            <button
                              onClick={() => openWorkerTypeModal(emp)}
                              className="rounded-md border border-gray-200 bg-white p-1 text-[#9CA3AF] transition-all hover:border-[#E8590C] hover:bg-[#FFF8F3] hover:text-[#E8590C]"
                              title="Change Worker Type"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Face */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          emp.face_registered ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${emp.face_registered ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {emp.face_registered ? 'Yes' : 'No'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(emp.status)}`}>
                          {emp.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDeleteModal(emp)}
                          disabled={deletingId === emp._id}
                          className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
                          title="Delete Employee"
                        >
                          {deletingId === emp._id ? (
                            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          )}
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

      {/* ══════════════════════════════════════════════ */}
      {/* ✅ NEW - JOINING DATE MODAL                   */}
      {/* ══════════════════════════════════════════════ */}
      {joiningDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-7">

              {/* Header */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <svg className="h-6 w-6 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A1A2E]">Joining Date</h3>
                  <p className="text-xs text-[#9CA3AF]">
                    {joiningDateModal.name} — {joiningDateModal.emp_code}
                  </p>
                </div>
              </div>

              {/* Employee Info */}
              <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3 space-y-1">
                <p className="text-xs text-[#9CA3AF]">
                  Company:{' '}
                  <span className="font-bold text-blue-600">
                    {joiningDateModal.company_id?.name || '—'}
                  </span>
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  Current Joining Date:{' '}
                  <span className="font-bold text-[#1A1A2E]">
                    {joiningDateModal.joining_date || 'Not set'}
                  </span>
                </p>
              </div>

              {/* Warning */}
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[11px] font-bold text-amber-700">⚠️ Important:</p>
                <p className="mt-1 text-[11px] text-amber-600">
                  Joining date set karne ke baad employee ko <strong>sirf us month se paid leave</strong> milegi.
                  Purani leave balance me <strong>koi change nahi hoga</strong>.
                </p>
              </div>

              {/* Input */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Joining Date <span className="text-[#E8590C]">*</span>
                </label>
                <input
                  type="text"
                  value={editJoiningDate}
                  onChange={(e) => setEditJoiningDate(e.target.value)}
                  placeholder="e.g. 14/8/2026"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm font-semibold text-[#1A1A2E] placeholder:font-normal placeholder:text-gray-400 outline-none focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                />
                <p className="mt-1 text-[10px] text-[#9CA3AF]">
                  Format: day/month/year (e.g. 14/8/2026 ya 1/7/2026)
                </p>

                {/* Preview */}
                {(() => {
                  const preview = getJoiningMonthPreview(editJoiningDate);
                  if (!preview) return null;
                  return (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                      <p className="text-[11px] font-bold text-emerald-700">
                        ✅ Leave credit shuru hogi: <span className="text-emerald-800">{preview}</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-emerald-600">
                        Is month se 1 paid leave per month automatically credit hogi
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleJoiningDateUpdate}
                  disabled={joiningDateLoading || !editJoiningDate}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {joiningDateLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </span>
                  ) : 'Save Joining Date'}
                </button>
                <button
                  onClick={() => { setJoiningDateModal(null); setEditJoiningDate(''); }}
                  disabled={joiningDateLoading}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* WORKER TYPE MODAL                             */}
      {/* ══════════════════════════════════════════════ */}
      {workerTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-7">

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <svg className="h-6 w-6 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A1A2E]">Worker Type</h3>
                  <p className="text-xs text-[#9CA3AF]">
                    {workerTypeModal.name} — {workerTypeModal.emp_code}
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3 space-y-1">
                <p className="text-xs text-[#9CA3AF]">
                  Company: <span className="font-bold text-blue-600">{workerTypeModal.company_id?.name || '—'}</span>
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  Department: <span className="font-bold text-[#1A1A2E]">{workerTypeModal.department || '—'}</span>
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  Current Type:{' '}
                  <span className="font-bold text-[#1A1A2E]">
                    {workerTypeModal.worker_type === 'site' ? '🚧 Site Worker' : '🏢 Office Worker'}
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-[#1A1A2E]">
                  Select Worker Type <span className="text-[#E8590C]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditWorkerType('office')}
                    className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                      editWorkerType === 'office'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {editWorkerType === 'office' && (
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500">
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                    <div className="mb-2 text-2xl">🏢</div>
                    <p className="text-sm font-bold text-[#1A1A2E]">Office Worker</p>
                    <p className="mt-1 text-[10px] text-[#9CA3AF] leading-tight">
                      9:45 AM ke baad aane par Late mark hoga
                    </p>
                  </button>

                  <button
                    onClick={() => setEditWorkerType('site')}
                    className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                      editWorkerType === 'site'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {editWorkerType === 'site' && (
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                    <div className="mb-2 text-2xl">🚧</div>
                    <p className="text-sm font-bold text-[#1A1A2E]">Site Worker</p>
                    <p className="mt-1 text-[10px] text-[#9CA3AF] leading-tight">
                      Kabhi bhi aaye — Late nahi lagegi
                    </p>
                  </button>
                </div>

                <div className={`mt-3 rounded-xl p-3 text-[11px] leading-relaxed ${
                  editWorkerType === 'site' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  {editWorkerType === 'site'
                    ? '✅ Site worker ko late nahi lagegi — GPS location se koi fark nahi padega'
                    : '⏰ Office worker ko 9:45 AM ke baad aane par late mark hoga'}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleWorkerTypeUpdate}
                  disabled={workerTypeLoading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {workerTypeLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Updating...
                    </span>
                  ) : 'Update Worker Type'}
                </button>
                <button
                  onClick={() => { setWorkerTypeModal(null); setEditWorkerType('office'); }}
                  disabled={workerTypeLoading}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* DELETE MODAL                                  */}
      {/* ══════════════════════════════════════════════ */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-red-600" />
            <div className="p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-red-600">⚠️ Delete Employee?</h3>
                  <p className="text-xs text-[#9CA3AF]">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3 space-y-1">
                <p className="text-sm"><span className="text-[#9CA3AF]">Name:</span> <span className="font-bold text-[#1A1A2E]">{deleteModal.name}</span></p>
                <p className="text-sm"><span className="text-[#9CA3AF]">Code:</span> <span className="font-bold text-[#1A1A2E]">{deleteModal.emp_code}</span></p>
                <p className="text-sm"><span className="text-[#9CA3AF]">Email:</span> <span className="font-bold text-[#1A1A2E]">{deleteModal.email}</span></p>
                <p className="text-sm"><span className="text-[#9CA3AF]">Company:</span> <span className="font-bold text-[#E8590C]">{deleteModal.company_id?.name || '—'}</span></p>
                {deleteModal.role && deleteModal.role !== 'employee' && (
                  <p className="text-sm"><span className="text-[#9CA3AF]">Role:</span> <span className="font-bold text-purple-600 uppercase">{deleteModal.role}</span></p>
                )}
              </div>

              {deletePreview ? (
                <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-700 mb-3">🗑️ Following data will be permanently deleted:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { count: deletePreview.counts.attendance_records, label: 'Attendance' },
                      { count: deletePreview.counts.leave_records, label: 'Leaves' },
                      { count: deletePreview.counts.photos, label: 'Photos' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-white p-3 text-center">
                        <p className="text-2xl font-extrabold text-red-600">{item.count}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-red-700">+ Employee profile, leave balance, all login data, Cloudinary photos</p>
                </div>
              ) : (
                <div className="mb-5 flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                </div>
              )}

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Type <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-red-700">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  autoFocus
                  className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-sm font-mono font-bold text-red-600 placeholder:text-gray-300 placeholder:font-normal outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteConfirmText !== 'DELETE' || deletingId === deleteModal._id}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {deletingId === deleteModal._id ? 'Deleting...' : '🗑️ Delete Forever'}
                </button>
                <button
                  onClick={closeDeleteModal}
                  disabled={deletingId === deleteModal._id}
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
      `}</style>
    </div>
  );
};

export default AllEmployees;
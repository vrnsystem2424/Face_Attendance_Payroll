// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   fetchEmployees,
//   approveEmployee,
//   rejectEmployee,
//   deleteEmployee,
//   updateEmployeeSalary,
//   getDeletePreview,
//   clearDeletePreview,
// } from '../../redux/slices/employeeSlice';
// import { fetchAllMasterData } from '../../redux/slices/masterSlice';

// const Employees = () => {
//   const dispatch = useDispatch();
//   const { employees, loading, deletePreview } = useSelector((s) => s.employees);
//   const { managers } = useSelector((s) => s.master);

//   const [filter, setFilter] = useState('');

//   // Approve modal
//   const [approveModal, setApproveModal] = useState(null);
//   const [selectedManager, setSelectedManager] = useState('');
//   const [monthlySalary, setMonthlySalary] = useState('');

//   // Salary edit modal
//   const [salaryEditModal, setSalaryEditModal] = useState(null);
//   const [editSalaryValue, setEditSalaryValue] = useState('');

//   // 🆕 Delete modal
//   const [deleteModal, setDeleteModal] = useState(null);
//   const [deleteConfirmText, setDeleteConfirmText] = useState('');
//   const [deletingId, setDeletingId] = useState(null);

//   useEffect(() => {
//     dispatch(fetchEmployees(filter));
//     dispatch(fetchAllMasterData());
//   }, [dispatch, filter]);

//   const handleApproveSubmit = async () => {
//     if (!selectedManager) { alert('Manager select karo!'); return; }
//     if (!monthlySalary || Number(monthlySalary) <= 0) { alert('Valid monthly salary daalo!'); return; }

//     const result = await dispatch(
//       approveEmployee({
//         id: approveModal._id,
//         data: {
//           leave_approval_manager: selectedManager,
//           monthly_salary: Number(monthlySalary),
//         },
//       })
//     );

//     if (result.meta.requestStatus === 'fulfilled') {
//       setApproveModal(null);
//       setSelectedManager('');
//       setMonthlySalary('');
//       dispatch(fetchEmployees(filter));
//     }
//   };

//   const openSalaryEdit = (emp) => {
//     setSalaryEditModal(emp);
//     setEditSalaryValue(emp.monthly_salary || '');
//   };

//   const handleSalaryUpdate = async () => {
//     if (editSalaryValue === '' || Number(editSalaryValue) < 0) {
//       alert('Valid salary daalo!');
//       return;
//     }

//     const result = await dispatch(
//       updateEmployeeSalary({
//         id: salaryEditModal._id,
//         monthly_salary: Number(editSalaryValue),
//       })
//     );

//     if (result.meta.requestStatus === 'fulfilled') {
//       setSalaryEditModal(null);
//       setEditSalaryValue('');
//       dispatch(fetchEmployees(filter));
//     }
//   };

//   // 🆕 Open delete modal with preview
//   const openDeleteModal = async (emp) => {
//     setDeleteModal(emp);
//     setDeleteConfirmText('');
//     dispatch(getDeletePreview(emp._id));
//   };

//   // 🆕 Confirm delete
//   const handleDeleteConfirm = async () => {
//     if (deleteConfirmText !== 'DELETE') {
//       alert('Type "DELETE" to confirm');
//       return;
//     }

//     setDeletingId(deleteModal._id);
//     const result = await dispatch(deleteEmployee(deleteModal._id));
//     setDeletingId(null);

//     if (result.meta.requestStatus === 'fulfilled') {
//       setDeleteModal(null);
//       setDeleteConfirmText('');
//       dispatch(clearDeletePreview());
//       dispatch(fetchEmployees(filter));
//     } else {
//       alert(result.payload || 'Delete failed');
//     }
//   };

//   const closeDeleteModal = () => {
//     setDeleteModal(null);
//     setDeleteConfirmText('');
//     dispatch(clearDeletePreview());
//   };

//   const statusStyle = (status) => {
//     if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
//     if (status === 'pending') return 'bg-amber-50 text-amber-700';
//     return 'bg-red-50 text-red-600';
//   };

//   const statusDot = (status) => {
//     if (status === 'approved') return 'bg-emerald-500';
//     if (status === 'pending') return 'bg-amber-500';
//     return 'bg-red-500';
//   };

//   return (
//     <div className="min-h-screen bg-[#faf8f5]">
//       <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
//       <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

//       <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

//         {/* Header */}
//         <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
//           <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
//           <div className="flex flex-wrap items-center justify-between gap-4 p-6">
//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
//                 <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
//                 </svg>
//               </div>
//               <div>
//                 <h2 className="text-lg font-extrabold text-[#1A1A2E]">Employees</h2>
//                 <p className="text-xs text-[#9CA3AF]">{employees.length} total records</p>
//               </div>
//             </div>

//             <div className="relative">
//               <select
//                 value={filter}
//                 onChange={(e) => setFilter(e.target.value)}
//                 className="appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 pl-4 pr-10 text-sm font-semibold text-[#1A1A2E] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
//               >
//                 <option value="">All Employees</option>
//                 <option value="pending">Pending</option>
//                 <option value="approved">Approved</option>
//                 <option value="rejected">Rejected</option>
//               </select>
//               <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF]">
//                 <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
//                 </svg>
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
//           {loading ? (
//             <div className="flex flex-col items-center justify-center py-20">
//               <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
//               <p className="mt-4 text-sm text-[#9CA3AF]">Loading employees…</p>
//             </div>
//           ) : employees.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-20">
//               <p className="text-sm font-medium text-[#9CA3AF]">No employees found</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="bg-[#faf8f5]">
//                     {['Name', 'Code', 'Email', 'Phone', 'Dept', 'Designation', 'Company', 'Manager', 'Salary', 'Face', 'Status', 'Actions'].map((h) => (
//                       <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-50">
//                   {employees.map((emp) => (
//                     <tr key={emp._id} className="group transition-colors hover:bg-[#faf8f5]">
//                       <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{emp.name}</td>
//                       <td className="px-5 py-3.5 text-[#4B5563]">{emp.emp_code}</td>
//                       <td className="px-5 py-3.5 text-[#4B5563]">{emp.email || '—'}</td>
//                       <td className="px-5 py-3.5 text-[#4B5563]">{emp.phone}</td>
//                       <td className="px-5 py-3.5 text-[#4B5563]">{emp.department || '—'}</td>
//                       <td className="px-5 py-3.5 text-[#4B5563]">{emp.designation || '—'}</td>
//                       <td className="px-5 py-3.5">
//                         <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
//                           {emp.company_id?.name || '—'}
//                         </span>
//                       </td>
//                       <td className="px-5 py-3.5 text-[#4B5563]">
//                         {emp.leave_approval_manager || '—'}
//                       </td>

//                       <td className="px-5 py-3.5">
//                         <div className="flex items-center gap-1.5">
//                           {emp.monthly_salary > 0 ? (
//                             <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
//                               ₹{emp.monthly_salary.toLocaleString('en-IN')}
//                             </span>
//                           ) : (
//                             <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] italic text-gray-400">
//                               Not set
//                             </span>
//                           )}
//                           {emp.status === 'approved' && (
//                             <button
//                               onClick={() => openSalaryEdit(emp)}
//                               className="rounded-md border border-gray-200 bg-white p-1 text-[#9CA3AF] transition-all hover:border-[#E8590C] hover:bg-[#FFF8F3] hover:text-[#E8590C]"
//                               title="Edit Salary"
//                             >
//                               <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
//                               </svg>
//                             </button>
//                           )}
//                         </div>
//                       </td>

//                       <td className="px-5 py-3.5">
//                         <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${emp.face_registered ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
//                           <span className={`h-1.5 w-1.5 rounded-full ${emp.face_registered ? 'bg-emerald-500' : 'bg-red-500'}`} />
//                           {emp.face_registered ? 'Yes' : 'No'}
//                         </span>
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle(emp.status)}`}>
//                           <span className={`h-1.5 w-1.5 rounded-full ${statusDot(emp.status)}`} />
//                           {emp.status}
//                         </span>
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <div className="flex items-center gap-2">
//                           {emp.status === 'pending' && (
//                             <>
//                               <button
//                                 onClick={() => setApproveModal(emp)}
//                                 className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white transition-all hover:bg-emerald-600"
//                               >
//                                 Approve
//                               </button>
//                               <button
//                                 onClick={() => dispatch(rejectEmployee(emp._id))}
//                                 className="rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white transition-all hover:bg-red-600"
//                               >
//                                 Reject
//                               </button>
//                             </>
//                           )}
//                           {/* 🆕 Delete Button with Modal */}
//                           <button
//                             onClick={() => openDeleteModal(emp)}
//                             disabled={deletingId === emp._id}
//                             className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
//                             title="Delete Employee"
//                           >
//                             {deletingId === emp._id ? (
//                               <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
//                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                               </svg>
//                             ) : (
//                               <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
//                               </svg>
//                             )}
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* APPROVE MODAL */}
//       {approveModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
//           <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
//             <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
//             <div className="p-7">
//               <div className="mb-5 flex items-center gap-3">
//                 <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
//                   <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-extrabold text-[#1A1A2E]">Approve Employee</h3>
//                   <p className="text-xs text-[#9CA3AF]">{approveModal.name} — {approveModal.emp_code}</p>
//                 </div>
//               </div>

//               <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3 space-y-1">
//                 <p className="text-xs text-[#9CA3AF]">
//                   Department: <span className="font-semibold text-[#1A1A2E]">{approveModal.department}</span>
//                 </p>
//                 <p className="text-xs text-[#9CA3AF]">
//                   Company: <span className="font-semibold text-[#1A1A2E]">{approveModal.company_id?.name || '—'}</span>
//                 </p>
//               </div>

//               <div className="mb-5">
//                 <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
//                   Leave Approval Manager <span className="text-[#E8590C]">*</span>
//                 </label>
//                 <div className="relative">
//                   <select
//                     value={selectedManager}
//                     onChange={(e) => setSelectedManager(e.target.value)}
//                     className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-4 pr-10 text-sm text-[#1A1A2E] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
//                   >
//                     <option value="">— Select Manager —</option>
//                     {managers.map((m) => (
//                       <option key={m._id} value={m.value}>{m.value}</option>
//                     ))}
//                   </select>
//                   <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF]">
//                     <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
//                     </svg>
//                   </span>
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
//                   Monthly Salary <span className="text-[#E8590C]">*</span>
//                 </label>
//                 <div className="relative">
//                   <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#E8590C]">
//                     <span className="text-lg font-bold">₹</span>
//                   </span>
//                   <input
//                     type="number"
//                     min="0"
//                     step="1000"
//                     value={monthlySalary}
//                     onChange={(e) => setMonthlySalary(e.target.value)}
//                     placeholder="e.g. 25000"
//                     className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-sm font-semibold text-[#1A1A2E] placeholder:font-normal placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
//                   />
//                 </div>
//                 {monthlySalary && Number(monthlySalary) > 0 && (
//                   <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-3 py-2">
//                     <span className="text-[11px] text-[#9CA3AF]">
//                       Per day: <span className="font-bold text-[#E8590C]">₹{Math.round(Number(monthlySalary) / 30).toLocaleString('en-IN')}</span>
//                     </span>
//                     <span className="text-[11px] text-gray-300">•</span>
//                     <span className="text-[11px] text-[#9CA3AF]">
//                       Per hour (8h): <span className="font-bold text-[#E8590C]">₹{Math.round(Number(monthlySalary) / 30 / 8).toLocaleString('en-IN')}</span>
//                     </span>
//                   </div>
//                 )}
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={handleApproveSubmit}
//                   className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg"
//                 >
//                   Confirm Approval
//                 </button>
//                 <button
//                   onClick={() => { setApproveModal(null); setSelectedManager(''); setMonthlySalary(''); }}
//                   className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* SALARY EDIT MODAL */}
//       {salaryEditModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
//           <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
//             <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
//             <div className="p-7">
//               <div className="mb-5 flex items-center gap-3">
//                 <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
//                   <svg className="h-6 w-6 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-extrabold text-[#1A1A2E]">Update Salary</h3>
//                   <p className="text-xs text-[#9CA3AF]">{salaryEditModal.name} — {salaryEditModal.emp_code}</p>
//                 </div>
//               </div>

//               <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3">
//                 <p className="text-xs text-[#9CA3AF]">
//                   Current Salary:{' '}
//                   <span className="font-bold text-[#1A1A2E]">
//                     {salaryEditModal.monthly_salary > 0
//                       ? `₹${salaryEditModal.monthly_salary.toLocaleString('en-IN')}`
//                       : 'Not set'}
//                   </span>
//                 </p>
//               </div>

//               <div className="mb-6">
//                 <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
//                   New Monthly Salary <span className="text-[#E8590C]">*</span>
//                 </label>
//                 <div className="relative">
//                   <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#E8590C]">
//                     <span className="text-lg font-bold">₹</span>
//                   </span>
//                   <input
//                     type="number"
//                     min="0"
//                     step="1000"
//                     value={editSalaryValue}
//                     onChange={(e) => setEditSalaryValue(e.target.value)}
//                     placeholder="e.g. 30000"
//                     autoFocus
//                     className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-sm font-semibold text-[#1A1A2E] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
//                   />
//                 </div>
//                 {editSalaryValue && Number(editSalaryValue) > 0 && (
//                   <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-3 py-2">
//                     <span className="text-[11px] text-[#9CA3AF]">
//                       Per day: <span className="font-bold text-[#E8590C]">₹{Math.round(Number(editSalaryValue) / 30).toLocaleString('en-IN')}</span>
//                     </span>
//                     <span className="text-[11px] text-gray-300">•</span>
//                     <span className="text-[11px] text-[#9CA3AF]">
//                       Per hour: <span className="font-bold text-[#E8590C]">₹{Math.round(Number(editSalaryValue) / 30 / 8).toLocaleString('en-IN')}</span>
//                     </span>
//                   </div>
//                 )}
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={handleSalaryUpdate}
//                   className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg"
//                 >
//                   Update Salary
//                 </button>
//                 <button
//                   onClick={() => { setSalaryEditModal(null); setEditSalaryValue(''); }}
//                   className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* 🆕 DELETE CONFIRMATION MODAL */}
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
//                 <p className="text-sm">
//                   <span className="text-[#9CA3AF]">Name:</span>{' '}
//                   <span className="font-bold text-[#1A1A2E]">{deleteModal.name}</span>
//                 </p>
//                 <p className="text-sm">
//                   <span className="text-[#9CA3AF]">Code:</span>{' '}
//                   <span className="font-bold text-[#1A1A2E]">{deleteModal.emp_code}</span>
//                 </p>
//                 <p className="text-sm">
//                   <span className="text-[#9CA3AF]">Email:</span>{' '}
//                   <span className="font-bold text-[#1A1A2E]">{deleteModal.email}</span>
//                 </p>
//               </div>

//               {/* Records that will be deleted */}
//               {deletePreview ? (
//                 <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50 p-4">
//                   <p className="text-sm font-bold text-red-700 mb-3">
//                     🗑️ Following data will be permanently deleted:
//                   </p>
//                   <div className="grid grid-cols-3 gap-2">
//                     <div className="rounded-lg bg-white p-3 text-center">
//                       <p className="text-2xl font-extrabold text-red-600">
//                         {deletePreview.counts.attendance_records}
//                       </p>
//                       <p className="text-[10px] text-gray-500 uppercase font-bold">Attendance</p>
//                     </div>
//                     <div className="rounded-lg bg-white p-3 text-center">
//                       <p className="text-2xl font-extrabold text-red-600">
//                         {deletePreview.counts.leave_records}
//                       </p>
//                       <p className="text-[10px] text-gray-500 uppercase font-bold">Leaves</p>
//                     </div>
//                     <div className="rounded-lg bg-white p-3 text-center">
//                       <p className="text-2xl font-extrabold text-red-600">
//                         {deletePreview.counts.photos}
//                       </p>
//                       <p className="text-[10px] text-gray-500 uppercase font-bold">Photos</p>
//                     </div>
//                   </div>
//                   <p className="mt-3 text-[11px] text-red-700">
//                     + Employee profile, leave balance, all login data
//                   </p>
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
//                   className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-sm font-mono font-bold text-red-600 placeholder:text-gray-300 placeholder:font-normal outline-none transition-all focus:border-red-500"
//                 />
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={handleDeleteConfirm}
//                   disabled={deleteConfirmText !== 'DELETE' || deletingId === deleteModal._id}
//                   className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-sm font-bold text-white shadow-md shadow-red-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
//                 >
//                   {deletingId === deleteModal._id ? 'Deleting...' : '🗑️ Delete Forever'}
//                 </button>
//                 <button
//                   onClick={closeDeleteModal}
//                   disabled={deletingId === deleteModal._id}
//                   className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50"
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

// export default Employees;








import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployees,
  approveEmployee,
  rejectEmployee,
  deleteEmployee,
  updateEmployeeSalary,
  updateEmployeeDesignation,  // 🆕
  updateEmployeeManager,      // 🆕
  getDeletePreview,
  clearDeletePreview,
} from '../../redux/slices/employeeSlice';
import { fetchAllMasterData } from '../../redux/slices/masterSlice';

// ════════════════════════════════════════════
// 🆕 Designation Options
// ════════════════════════════════════════════
const DESIGNATION_OPTIONS = [
  'Site Engineer',
  'Project Manager',
  'Supervisor',
  'Labour',
  'Accountant',
  'HR Manager',
  'Civil Engineer',
  'Electrical Engineer',
  'Safety Officer',
  'Store Keeper',
  'Driver',
  'Security Guard',
  'Helper',
  'Operator',
  'Foreman',
  'Technician',
  'Surveyor',
  'Architect',
  'Quality Inspector',
  'Admin Executive',
];

const Employees = () => {
  const dispatch = useDispatch();
  const { employees, loading, deletePreview } = useSelector((s) => s.employees);
  const { managers } = useSelector((s) => s.master);

  const [filter, setFilter] = useState('');

  // ── Approve Modal ──
  const [approveModal, setApproveModal] = useState(null);
  const [selectedManager, setSelectedManager] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');

  // ── Salary Edit Modal ──
  const [salaryEditModal, setSalaryEditModal] = useState(null);
  const [editSalaryValue, setEditSalaryValue] = useState('');

  // ── 🆕 Designation Edit Modal ──
  const [designationModal, setDesignationModal] = useState(null);
  const [editDesignationValue, setEditDesignationValue] = useState('');

  // ── 🆕 Manager Edit Modal ──
  const [managerModal, setManagerModal] = useState(null);
  const [editManagerValue, setEditManagerValue] = useState('');

  // ── Delete Modal ──
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    dispatch(fetchEmployees(filter));
    dispatch(fetchAllMasterData());
  }, [dispatch, filter]);

  // ════════════════════════════════════════════
  // APPROVE
  // ════════════════════════════════════════════
  const handleApproveSubmit = async () => {
    if (!selectedManager) { alert('Manager select karo!'); return; }
    if (!monthlySalary || Number(monthlySalary) <= 0) { alert('Valid monthly salary daalo!'); return; }

    const result = await dispatch(
      approveEmployee({
        id: approveModal._id,
        data: {
          leave_approval_manager: selectedManager,
          monthly_salary: Number(monthlySalary),
        },
      })
    );

    if (result.meta.requestStatus === 'fulfilled') {
      setApproveModal(null);
      setSelectedManager('');
      setMonthlySalary('');
      dispatch(fetchEmployees(filter));
    }
  };

  // ════════════════════════════════════════════
  // SALARY
  // ════════════════════════════════════════════
  const openSalaryEdit = (emp) => {
    setSalaryEditModal(emp);
    setEditSalaryValue(emp.monthly_salary || '');
  };

  const handleSalaryUpdate = async () => {
    if (editSalaryValue === '' || Number(editSalaryValue) < 0) {
      alert('Valid salary daalo!');
      return;
    }

    const result = await dispatch(
      updateEmployeeSalary({
        id: salaryEditModal._id,
        monthly_salary: Number(editSalaryValue),
      })
    );

    if (result.meta.requestStatus === 'fulfilled') {
      setSalaryEditModal(null);
      setEditSalaryValue('');
    }
  };

  // ════════════════════════════════════════════
  // 🆕 DESIGNATION
  // ════════════════════════════════════════════
  const openDesignationEdit = (emp) => {
    setDesignationModal(emp);
    setEditDesignationValue(emp.designation || '');
  };

  const handleDesignationUpdate = async () => {
    if (!editDesignationValue || editDesignationValue.trim() === '') {
      alert('Designation select karo!');
      return;
    }

    const result = await dispatch(
      updateEmployeeDesignation({
        id: designationModal._id,
        designation: editDesignationValue,
      })
    );

    if (result.meta.requestStatus === 'fulfilled') {
      setDesignationModal(null);
      setEditDesignationValue('');
    }
  };

  // ════════════════════════════════════════════
  // 🆕 MANAGER
  // ════════════════════════════════════════════
  const openManagerEdit = (emp) => {
    setManagerModal(emp);
    setEditManagerValue(emp.leave_approval_manager || '');
  };

  const handleManagerUpdate = async () => {
    const result = await dispatch(
      updateEmployeeManager({
        id: managerModal._id,
        leave_approval_manager: editManagerValue,
      })
    );

    if (result.meta.requestStatus === 'fulfilled') {
      setManagerModal(null);
      setEditManagerValue('');
    }
  };

  // ════════════════════════════════════════════
  // DELETE
  // ════════════════════════════════════════════
  const openDeleteModal = async (emp) => {
    setDeleteModal(emp);
    setDeleteConfirmText('');
    dispatch(getDeletePreview(emp._id));
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Type "DELETE" to confirm');
      return;
    }

    setDeletingId(deleteModal._id);
    const result = await dispatch(deleteEmployee(deleteModal._id));
    setDeletingId(null);

    if (result.meta.requestStatus === 'fulfilled') {
      setDeleteModal(null);
      setDeleteConfirmText('');
      dispatch(clearDeletePreview());
    } else {
      alert(result.payload || 'Delete failed');
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
    setDeleteConfirmText('');
    dispatch(clearDeletePreview());
  };

  // ════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════
  const statusStyle = (status) => {
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-600';
  };

  const statusDot = (status) => {
    if (status === 'approved') return 'bg-emerald-500';
    if (status === 'pending') return 'bg-amber-500';
    return 'bg-red-500';
  };

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* BG blobs */}
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* ── Header ── */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
                <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#1A1A2E]">Employees</h2>
                <p className="text-xs text-[#9CA3AF]">{employees.length} total records</p>
              </div>
            </div>

            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 pl-4 pr-10 text-sm font-semibold text-[#1A1A2E] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
              >
                <option value="">All Employees</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-4 text-sm text-[#9CA3AF]">Loading employees…</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm font-medium text-[#9CA3AF]">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {[
                      'Name', 'Code', 'Email', 'Phone', 'Dept',
                      'Designation', 'Company', 'Manager',
                      'Salary', 'Face', 'Status', 'Actions'
                    ].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => (
                    <tr key={emp._id} className="group transition-colors hover:bg-[#faf8f5]">

                      {/* Name */}
                      <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{emp.name}</td>

                      {/* Code */}
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.emp_code}</td>

                      {/* Email */}
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.email || '—'}</td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.phone}</td>

                      {/* Dept */}
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.department || '—'}</td>

                      {/* ══ 🆕 DESIGNATION with Edit ══ */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#4B5563]">
                            {emp.designation || (
                              <span className="italic text-gray-400">Not set</span>
                            )}
                          </span>
                          {emp.status === 'approved' && (
                            <button
                              onClick={() => openDesignationEdit(emp)}
                              className="rounded-md border border-gray-200 bg-white p-1 text-[#9CA3AF] transition-all hover:border-[#E8590C] hover:bg-[#FFF8F3] hover:text-[#E8590C]"
                              title="Edit Designation"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {emp.company_id?.name || '—'}
                        </span>
                      </td>

                      {/* ══ 🆕 MANAGER with Edit ══ */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#4B5563]">
                            {emp.leave_approval_manager || (
                              <span className="italic text-gray-400">Not set</span>
                            )}
                          </span>
                          {emp.status === 'approved' && (
                            <button
                              onClick={() => openManagerEdit(emp)}
                              className="rounded-md border border-gray-200 bg-white p-1 text-[#9CA3AF] transition-all hover:border-[#E8590C] hover:bg-[#FFF8F3] hover:text-[#E8590C]"
                              title="Edit Manager"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Salary */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {emp.monthly_salary > 0 ? (
                            <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                              ₹{emp.monthly_salary.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] italic text-gray-400">
                              Not set
                            </span>
                          )}
                          {emp.status === 'approved' && (
                            <button
                              onClick={() => openSalaryEdit(emp)}
                              className="rounded-md border border-gray-200 bg-white p-1 text-[#9CA3AF] transition-all hover:border-[#E8590C] hover:bg-[#FFF8F3] hover:text-[#E8590C]"
                              title="Edit Salary"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Face */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${emp.face_registered ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${emp.face_registered ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {emp.face_registered ? 'Yes' : 'No'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle(emp.status)}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDot(emp.status)}`} />
                          {emp.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {emp.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setApproveModal(emp)}
                                className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white transition-all hover:bg-emerald-600"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => dispatch(rejectEmployee(emp._id))}
                                className="rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white transition-all hover:bg-red-600"
                              >
                                Reject
                              </button>
                            </>
                          )}
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

      {/* ══════════════════════════════════════════ */}
      {/* APPROVE MODAL                             */}
      {/* ══════════════════════════════════════════ */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A1A2E]">Approve Employee</h3>
                  <p className="text-xs text-[#9CA3AF]">{approveModal.name} — {approveModal.emp_code}</p>
                </div>
              </div>

              <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3 space-y-1">
                <p className="text-xs text-[#9CA3AF]">
                  Department: <span className="font-semibold text-[#1A1A2E]">{approveModal.department}</span>
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  Company: <span className="font-semibold text-[#1A1A2E]">{approveModal.company_id?.name || '—'}</span>
                </p>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Leave Approval Manager <span className="text-[#E8590C]">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-4 pr-10 text-sm text-[#1A1A2E] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                  >
                    <option value="">— Select Manager —</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m.value}>{m.value}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Monthly Salary <span className="text-[#E8590C]">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#E8590C]">
                    <span className="text-lg font-bold">₹</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-sm font-semibold text-[#1A1A2E] placeholder:font-normal placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                  />
                </div>
                {monthlySalary && Number(monthlySalary) > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-3 py-2">
                    <span className="text-[11px] text-[#9CA3AF]">
                      Per day: <span className="font-bold text-[#E8590C]">₹{Math.round(Number(monthlySalary) / 30).toLocaleString('en-IN')}</span>
                    </span>
                    <span className="text-[11px] text-gray-300">•</span>
                    <span className="text-[11px] text-[#9CA3AF]">
                      Per hour (8h): <span className="font-bold text-[#E8590C]">₹{Math.round(Number(monthlySalary) / 30 / 8).toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApproveSubmit}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Confirm Approval
                </button>
                <button
                  onClick={() => { setApproveModal(null); setSelectedManager(''); setMonthlySalary(''); }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* SALARY EDIT MODAL                         */}
      {/* ══════════════════════════════════════════ */}
      {salaryEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <svg className="h-6 w-6 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A1A2E]">Update Salary</h3>
                  <p className="text-xs text-[#9CA3AF]">{salaryEditModal.name} — {salaryEditModal.emp_code}</p>
                </div>
              </div>

              <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3">
                <p className="text-xs text-[#9CA3AF]">
                  Current Salary:{' '}
                  <span className="font-bold text-[#1A1A2E]">
                    {salaryEditModal.monthly_salary > 0
                      ? `₹${salaryEditModal.monthly_salary.toLocaleString('en-IN')}`
                      : 'Not set'}
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  New Monthly Salary <span className="text-[#E8590C]">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#E8590C]">
                    <span className="text-lg font-bold">₹</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editSalaryValue}
                    onChange={(e) => setEditSalaryValue(e.target.value)}
                    placeholder="e.g. 30000"
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-10 pr-4 text-sm font-semibold text-[#1A1A2E] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                  />
                </div>
                {editSalaryValue && Number(editSalaryValue) > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-3 py-2">
                    <span className="text-[11px] text-[#9CA3AF]">
                      Per day: <span className="font-bold text-[#E8590C]">₹{Math.round(Number(editSalaryValue) / 30).toLocaleString('en-IN')}</span>
                    </span>
                    <span className="text-[11px] text-gray-300">•</span>
                    <span className="text-[11px] text-[#9CA3AF]">
                      Per hour: <span className="font-bold text-[#E8590C]">₹{Math.round(Number(editSalaryValue) / 30 / 8).toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSalaryUpdate}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Update Salary
                </button>
                <button
                  onClick={() => { setSalaryEditModal(null); setEditSalaryValue(''); }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* 🆕 DESIGNATION EDIT MODAL                 */}
      {/* ══════════════════════════════════════════ */}
      {designationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-7">

              {/* Header */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <svg className="h-6 w-6 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A1A2E]">Update Designation</h3>
                  <p className="text-xs text-[#9CA3AF]">{designationModal.name} — {designationModal.emp_code}</p>
                </div>
              </div>

              {/* Current Value */}
              <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3">
                <p className="text-xs text-[#9CA3AF]">
                  Current Designation:{' '}
                  <span className="font-bold text-[#1A1A2E]">
                    {designationModal.designation || 'Not set'}
                  </span>
                </p>
              </div>

              {/* Dropdown */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Select New Designation <span className="text-[#E8590C]">*</span>
                </label>
                <div className="relative">
                  <select
                    value={editDesignationValue}
                    onChange={(e) => setEditDesignationValue(e.target.value)}
                    autoFocus
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-4 pr-10 text-sm text-[#1A1A2E] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                  >
                    <option value="">— Select Designation —</option>
                    {DESIGNATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>

                {/* Preview badge */}
                {editDesignationValue && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
                    <span className="text-[11px] text-[#9CA3AF]">New designation:</span>
                    <span className="rounded-md bg-[#E8590C] px-2 py-0.5 text-[11px] font-bold text-white">
                      {editDesignationValue}
                    </span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDesignationUpdate}
                  disabled={!editDesignationValue}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Update Designation
                </button>
                <button
                  onClick={() => { setDesignationModal(null); setEditDesignationValue(''); }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* 🆕 MANAGER EDIT MODAL                     */}
      {/* ══════════════════════════════════════════ */}
      {managerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl animate-modalIn">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-7">

              {/* Header */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <svg className="h-6 w-6 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1A1A2E]">Update Manager</h3>
                  <p className="text-xs text-[#9CA3AF]">{managerModal.name} — {managerModal.emp_code}</p>
                </div>
              </div>

              {/* Current Value */}
              <div className="mb-5 rounded-xl bg-[#faf8f5] px-4 py-3">
                <p className="text-xs text-[#9CA3AF]">
                  Current Manager:{' '}
                  <span className="font-bold text-[#1A1A2E]">
                    {managerModal.leave_approval_manager || 'Not set'}
                  </span>
                </p>
              </div>

              {/* Dropdown */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Select New Manager <span className="text-[#E8590C]">*</span>
                </label>
                <div className="relative">
                  <select
                    value={editManagerValue}
                    onChange={(e) => setEditManagerValue(e.target.value)}
                    autoFocus
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-4 pr-10 text-sm text-[#1A1A2E] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                  >
                    <option value="">— No Manager —</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m.value}>{m.value}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>

                {/* Preview */}
                {editManagerValue && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
                    <span className="text-[11px] text-[#9CA3AF]">New manager:</span>
                    <span className="rounded-md bg-[#E8590C] px-2 py-0.5 text-[11px] font-bold text-white">
                      {editManagerValue}
                    </span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleManagerUpdate}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Update Manager
                </button>
                <button
                  onClick={() => { setManagerModal(null); setEditManagerValue(''); }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* DELETE MODAL                              */}
      {/* ══════════════════════════════════════════ */}
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
                <p className="text-sm">
                  <span className="text-[#9CA3AF]">Name:</span>{' '}
                  <span className="font-bold text-[#1A1A2E]">{deleteModal.name}</span>
                </p>
                <p className="text-sm">
                  <span className="text-[#9CA3AF]">Code:</span>{' '}
                  <span className="font-bold text-[#1A1A2E]">{deleteModal.emp_code}</span>
                </p>
                <p className="text-sm">
                  <span className="text-[#9CA3AF]">Email:</span>{' '}
                  <span className="font-bold text-[#1A1A2E]">{deleteModal.email}</span>
                </p>
              </div>

              {deletePreview ? (
                <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-700 mb-3">
                    🗑️ Following data will be permanently deleted:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white p-3 text-center">
                      <p className="text-2xl font-extrabold text-red-600">
                        {deletePreview.counts.attendance_records}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Attendance</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-center">
                      <p className="text-2xl font-extrabold text-red-600">
                        {deletePreview.counts.leave_records}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Leaves</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-center">
                      <p className="text-2xl font-extrabold text-red-600">
                        {deletePreview.counts.photos}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Photos</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-red-700">
                    + Employee profile, leave balance, all login data
                  </p>
                </div>
              ) : (
                <div className="mb-5 flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                </div>
              )}

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  Type{' '}
                  <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-red-700">DELETE</span>
                  {' '}to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  autoFocus
                  className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4 text-sm font-mono font-bold text-red-600 placeholder:text-gray-300 placeholder:font-normal outline-none transition-all focus:border-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteConfirmText !== 'DELETE' || deletingId === deleteModal._id}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-sm font-bold text-white shadow-md shadow-red-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {deletingId === deleteModal._id ? 'Deleting...' : '🗑️ Delete Forever'}
                </button>
                <button
                  onClick={closeDeleteModal}
                  disabled={deletingId === deleteModal._id}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] transition-all hover:bg-gray-50"
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

export default Employees;
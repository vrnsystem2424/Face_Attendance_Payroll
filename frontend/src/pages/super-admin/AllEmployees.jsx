// src/pages/super-admin/AllEmployees.jsx

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployees,
  deleteEmployee,
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
  });

  // 🆕 Delete modal states
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    // Super Admin sees ALL employees (not just approved)
    dispatch(fetchEmployees(''));
    dispatch(fetchCompanies());
  }, [dispatch]);

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    // Status filter
    if (filters.status !== 'all' && emp.status !== filters.status) return false;

    // Company filter
    if (filters.company !== 'all') {
      const empCompanyId = emp.company_id?._id || emp.company_id;
      if (empCompanyId !== filters.company) return false;
    }

    // Search filter
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

  // Company-wise count
  const companyStats = {};
  let totalSalary = 0;
  employees.forEach((emp) => {
    const compName = emp.company_id?.name || emp.department || 'Unknown';
    if (!companyStats[compName]) companyStats[compName] = { count: 0, salary: 0 };
    companyStats[compName].count++;
    companyStats[compName].salary += emp.monthly_salary || 0;
    totalSalary += emp.monthly_salary || 0;
  });

  const formatINR = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

  // 🆕 Open delete modal with preview
  const openDeleteModal = (emp) => {
    setDeleteModal(emp);
    setDeleteConfirmText('');
    dispatch(getDeletePreview(emp._id));
  };

  // 🆕 Confirm delete
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

  const statusStyle = (status) => {
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-600';
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
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
        </div>

        {/* Company-wise Salary Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(companyStats).map(([name, stat]) => (
            <div key={name} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="h-1 w-full bg-[#E8590C]" />
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">{name}</p>
                <p className="mt-1 text-xl font-extrabold text-[#1A1A2E]">{stat.count} <span className="text-sm text-[#9CA3AF]">employees</span></p>
                <p className="mt-1 text-lg font-bold text-[#E8590C]">{formatINR(stat.salary)}</p>
                <p className="text-[10px] text-[#9CA3AF]">Monthly salary</p>
              </div>
            </div>
          ))}
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D44] shadow-sm">
            <div className="h-1 w-full bg-[#E8590C]" />
            <div className="p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-300">Total All Companies</p>
              <p className="mt-1 text-xl font-extrabold">{employees.length} <span className="text-sm text-gray-400">employees</span></p>
              <p className="mt-1 text-lg font-bold text-[#F4A261]">{formatINR(totalSalary)}</p>
              <p className="text-[10px] text-gray-400">Monthly salary</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Search */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Search</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197" />
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

              {/* Company Filter */}
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

              {/* 🆕 Status Filter */}
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
            </div>
          </div>
        </div>

        {/* Table */}
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
                    {['Sr', 'Name', 'Code', 'Phone', 'Company', 'Department', 'Designation', 'Salary', 'Face', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEmployees.map((emp, idx) => (
                    <tr key={emp._id} className="hover:bg-[#faf8f5] transition-colors">
                      <td className="px-4 py-3 text-[#9CA3AF]">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1A1A2E]">{emp.name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{emp.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#1A1A2E]">{emp.emp_code}</td>
                      <td className="px-4 py-3 text-[#4B5563]">{emp.phone}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {emp.company_id?.name || emp.department}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#4B5563]">{emp.department}</td>
                      <td className="px-4 py-3 text-[#4B5563] text-xs">{emp.designation || '—'}</td>
                      <td className="px-4 py-3">
                        {emp.monthly_salary > 0 ? (
                          <span className="font-bold text-[#1A1A2E]">{formatINR(emp.monthly_salary)}</span>
                        ) : (
                          <span className="text-[11px] italic text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          emp.face_registered ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${emp.face_registered ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {emp.face_registered ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(emp.status)}`}>
                          {emp.status}
                        </span>
                      </td>
                      {/* 🆕 Actions Column with Delete */}
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

      {/* 🆕 DELETE CONFIRMATION MODAL */}
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
                <p className="text-sm">
                  <span className="text-[#9CA3AF]">Company:</span>{' '}
                  <span className="font-bold text-[#E8590C]">{deleteModal.company_id?.name || '—'}</span>
                </p>
                {deleteModal.role && deleteModal.role !== 'employee' && (
                  <p className="text-sm">
                    <span className="text-[#9CA3AF]">Role:</span>{' '}
                    <span className="font-bold text-purple-600 uppercase">{deleteModal.role}</span>
                  </p>
                )}
              </div>

              {/* Records that will be deleted */}
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
                    + Employee profile, leave balance, all login data, Cloudinary photos
                  </p>
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

export default AllEmployees;
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployees,
  approveEmployee,
  rejectEmployee,
  deleteEmployee,
  updateEmployeeSalary,
} from '../../redux/slices/employeeSlice';
import { fetchAllMasterData } from '../../redux/slices/masterSlice';

const Employees = () => {
  const dispatch = useDispatch();
  const { employees, loading } = useSelector((s) => s.employees);
  const { managers } = useSelector((s) => s.master);

  const [filter, setFilter] = useState('');

  // Approve modal
  const [approveModal, setApproveModal] = useState(null);
  const [selectedManager, setSelectedManager] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');

  // Salary edit modal
  const [salaryEditModal, setSalaryEditModal] = useState(null);
  const [editSalaryValue, setEditSalaryValue] = useState('');

  useEffect(() => {
    dispatch(fetchEmployees(filter));
    dispatch(fetchAllMasterData());
  }, [dispatch, filter]);

  // Approve with manager + salary
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

  // Open salary edit modal
  const openSalaryEdit = (emp) => {
    setSalaryEditModal(emp);
    setEditSalaryValue(emp.monthly_salary || '');
  };

  // Update salary
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
      dispatch(fetchEmployees(filter));
    }
  };

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

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
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

        {/* Table */}
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
                    {['Name', 'Code', 'Email', 'Phone', 'Dept', 'Designation', 'Company', 'Manager', 'Salary', 'Face', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => (
                    <tr key={emp._id} className="group transition-colors hover:bg-[#faf8f5]">
                      <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{emp.name}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.emp_code}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.email || '—'}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.phone}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.department || '—'}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.designation || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {emp.company_id?.name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#4B5563]">
                        {emp.leave_approval_manager || '—'}
                      </td>

                      {/* 💰 SALARY COLUMN with edit button */}
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

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${emp.face_registered ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${emp.face_registered ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {emp.face_registered ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle(emp.status)}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDot(emp.status)}`} />
                          {emp.status}
                        </span>
                      </td>
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
                            onClick={() => { if (window.confirm('Delete karna hai?')) dispatch(deleteEmployee(emp._id)); }}
                            className="rounded-lg border border-gray-200 bg-white p-1.5 text-[#9CA3AF] transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
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

      {/* ═══════════════════════════════════════════ */}
      {/*  APPROVE MODAL — Manager + Salary           */}
      {/* ═══════════════════════════════════════════ */}
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

              {/* Manager */}
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

              {/* 💰 SALARY */}
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

      {/* ═══════════════════════════════════════════ */}
      {/*  SALARY EDIT MODAL                          */}
      {/* ═══════════════════════════════════════════ */}
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
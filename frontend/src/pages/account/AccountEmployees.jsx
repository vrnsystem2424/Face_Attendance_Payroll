import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees, updateEmployeeSalary } from '../../redux/slices/employeeSlice';

const AccountEmployees = () => {
  const dispatch = useDispatch();
  const { employees, loading } = useSelector((s) => s.employees);

  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [salaryEditModal, setSalaryEditModal] = useState(null);
  const [editSalaryValue, setEditSalaryValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees('approved'));
  }, [dispatch]);

  // Companies List
  const companies = useMemo(() => {
    const map = new Map();
    (employees || []).forEach((emp) => {
      const id = emp.company_id?._id || emp.company_id;
      const name = emp.company_id?.name;
      if (id && name) map.set(String(id), name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [employees]);

  // Filter Employees
  const filteredEmployees = useMemo(() => {
    return (employees || []).filter((emp) => {
      if (companyFilter !== 'all') {
        const empCompId = String(emp.company_id?._id || emp.company_id || '');
        if (empCompId !== companyFilter) return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        emp.name?.toLowerCase().includes(q) ||
        emp.emp_code?.toLowerCase().includes(q) ||
        emp.phone?.includes(q) ||
        emp.email?.toLowerCase().includes(q)
      );
    });
  }, [employees, companyFilter, search]);

  const openSalaryModal = (emp) => {
    setSalaryEditModal(emp);
    setEditSalaryValue(emp.monthly_salary || '');
  };

  const handleSalarySave = async () => {
    if (editSalaryValue === '' || Number(editSalaryValue) < 0) {
      alert('Valid salary daalo!');
      return;
    }
    setSaving(true);
    const result = await dispatch(
      updateEmployeeSalary({
        id: salaryEditModal._id,
        monthly_salary: Number(editSalaryValue),
      })
    );
    setSaving(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setSalaryEditModal(null);
      setEditSalaryValue('');
      dispatch(fetchEmployees('approved'));
    } else {
      alert(result.payload || 'Salary update failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#1A1A2E]">Employees & Salaries</h2>
              <p className="text-xs text-[#9CA3AF]">{filteredEmployees.length} active employees</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search name, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-gray-200 bg-[#FAFAFA] py-2 px-4 text-sm outline-none focus:border-[#E8590C]"
              />

              {companies.length > 1 && (
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-[#FAFAFA] py-2 px-4 text-sm font-semibold outline-none focus:border-[#E8590C]"
                >
                  <option value="all">All Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8590C] border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Name', 'Code', 'Phone', 'Company', 'Designation', 'Monthly Salary', 'Action'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-[#faf8f5]">
                      <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{emp.name}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.emp_code}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.phone}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                          {emp.company_id?.name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{emp.designation || '—'}</td>
                      <td className="px-5 py-3.5 font-bold text-emerald-700">
                        {emp.monthly_salary > 0 ? `₹${emp.monthly_salary.toLocaleString('en-IN')}` : 'Not set'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => openSalaryModal(emp)}
                          className="rounded-lg bg-[#E8590C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#D14800]"
                        >
                          Edit Salary
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

      {/* Salary Modal */}
      {salaryEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#1A1A2E]">Update Salary</h3>
            <p className="text-xs text-gray-500 mb-4">{salaryEditModal.name} ({salaryEditModal.emp_code})</p>

            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Monthly Salary (₹)</label>
            <input
              type="number"
              value={editSalaryValue}
              onChange={(e) => setEditSalaryValue(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm font-semibold outline-none focus:border-[#E8590C]"
              placeholder="e.g. 25000"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSalarySave}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#E8590C] py-2.5 text-sm font-bold text-white hover:bg-[#D14800]"
              >
                {saving ? 'Saving...' : 'Save Salary'}
              </button>
              <button
                onClick={() => setSalaryEditModal(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
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

export default AccountEmployees;
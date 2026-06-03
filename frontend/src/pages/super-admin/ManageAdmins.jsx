import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllAdmins,
  createAdmin,
  deleteAdmin,
  promoteToManager,
  demoteToEmployee,
  fetchAllEmployeesGlobal,
  clearSuperAdminMessage,
  clearSuperAdminError,
} from '../../redux/slices/superAdminSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const ManageAdmins = () => {
  const dispatch = useDispatch();
  const { admins, allEmployees, loading, error, message } = useSelector((s) => s.superAdmin);
  const { companies } = useSelector((s) => s.company);

  const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'employees'
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ role: '', company_id: '' });

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', company_id: '',
  });

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'admins') {
      dispatch(fetchAllAdmins(filter));
    } else {
      dispatch(fetchAllEmployeesGlobal(filter));
    }
  }, [dispatch, activeTab, filter]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => dispatch(clearSuperAdminMessage()), 3000);
      return () => clearTimeout(t);
    }
  }, [message, dispatch]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createAdmin(formData));
    if (result.meta.requestStatus === 'fulfilled') {
      setFormData({ name: '', email: '', phone: '', password: '', company_id: '' });
      setShowForm(false);
      dispatch(fetchAllAdmins(filter));
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm('Delete this admin?')) {
      await dispatch(deleteAdmin(id));
    }
  };

  const handlePromote = async (id, name) => {
    if (window.confirm(`Promote ${name} to Manager?`)) {
      await dispatch(promoteToManager(id));
      dispatch(fetchAllEmployeesGlobal(filter));
    }
  };

  const handleDemote = async (id, name) => {
    if (window.confirm(`Demote ${name} back to Employee?`)) {
      await dispatch(demoteToEmployee(id));
      dispatch(fetchAllEmployeesGlobal(filter));
    }
  };

  const inputCls = "w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-4 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]";

  const roleColor = (role) => {
    const map = {
      employee: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      manager: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      admin: { bg: 'bg-[#FFF3E8]', text: 'text-[#E8590C]', dot: 'bg-[#E8590C]' },
    };
    return map[role] || map.employee;
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1A1A2E]">Manage Admins & Users</h1>
              <p className="text-xs text-[#9CA3AF]">Cross-company user management</p>
            </div>
          </div>

          {activeTab === 'admins' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                showForm
                  ? 'border border-gray-200 bg-white text-[#4B5563]'
                  : 'bg-gradient-to-r from-[#E8590C] to-[#D14800] text-white shadow-md shadow-orange-200/40 hover:shadow-lg'
              }`}
            >
              {showForm ? 'Close' : '+ Create Admin'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {[
            { key: 'admins', label: 'Admins & Managers', icon: '🛡' },
            { key: 'employees', label: 'All Users', icon: '👥' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#E8590C] to-[#D14800] text-white shadow-md shadow-orange-200/40'
                  : 'border border-gray-200 bg-white text-[#4B5563] hover:bg-[#FFF8F3] hover:text-[#E8590C]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            ✓ {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Create Admin Form */}
        {showForm && activeTab === 'admins' && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60 animate-formIn">
            <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-6">
              <h3 className="mb-5 text-sm font-bold text-[#1A1A2E]">Create New Admin</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Company <span className="text-[#E8590C]">*</span>
                    </label>
                    <select name="company_id" value={formData.company_id} onChange={handleChange} required
                      className={inputCls}>
                      <option value="">Select company</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Full Name <span className="text-[#E8590C]">*</span>
                    </label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required
                      placeholder="Admin name" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Email <span className="text-[#E8590C]">*</span>
                    </label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                      placeholder="admin@company.com" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Phone <span className="text-[#E8590C]">*</span>
                    </label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required maxLength={10}
                      placeholder="10 digit" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Password <span className="text-[#E8590C]">*</span>
                  </label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6}
                    placeholder="Min 6 characters" className={inputCls} />
                </div>

                <button type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  Create Admin Account
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <select value={filter.company_id} onChange={(e) => setFilter({ ...filter, company_id: e.target.value })}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]">
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          {activeTab === 'admins' && (
            <select value={filter.role} onChange={(e) => setFilter({ ...filter, role: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]">
              <option value="">All Roles</option>
              <option value="admin">Admins</option>
              <option value="manager">Managers</option>
            </select>
          )}
        </div>

        {/* List Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-3 text-sm text-[#9CA3AF]">Loading…</p>
            </div>
          ) : (activeTab === 'admins' ? admins : allEmployees).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-[#9CA3AF]">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Name', 'Email', 'Company', 'Role', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(activeTab === 'admins' ? admins : allEmployees).map((user) => {
                    const rc = roleColor(user.role);
                    return (
                      <tr key={user._id} className="group hover:bg-[#faf8f5]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] text-sm font-bold text-white">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-[#1A1A2E]">{user.name}</p>
                              <p className="text-[11px] text-[#9CA3AF]">{user.emp_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[#4B5563]">{user.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-[#4B5563]">
                            {user.company_id?.code || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${rc.bg} ${rc.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${rc.dot}`} />
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            user.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                            user.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {user.role === 'admin' && (
                              <button onClick={() => handleDeleteAdmin(user._id)}
                                className="rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-600">
                                Delete
                              </button>
                            )}
                            {user.role === 'employee' && (
                              <button onClick={() => handlePromote(user._id, user.name)}
                                className="rounded-lg bg-purple-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-600">
                                ↑ Promote
                              </button>
                            )}
                            {user.role === 'manager' && (
                              <button onClick={() => handleDemote(user._id, user.name)}
                                className="rounded-lg bg-gray-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-gray-600">
                                ↓ Demote
                              </button>
                            )}
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
      </div>

      <style>{`
        @keyframes formIn {
          from { opacity:0; transform:translateY(-8px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .animate-formIn { animation:formIn .25s ease-out }
      `}</style>
    </div>
  );
};

export default ManageAdmins;
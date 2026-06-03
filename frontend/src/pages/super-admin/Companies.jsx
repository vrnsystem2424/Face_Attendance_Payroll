import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  clearCompanyError,
  clearCompanyMessage,
} from '../../redux/slices/companySlice';

const Companies = () => {
  const dispatch = useDispatch();
  const { companies, loading, error, message } = useSelector((s) => s.company);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', address: '' });

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => dispatch(clearCompanyMessage()), 3000);
      return () => clearTimeout(t);
    }
  }, [message, dispatch]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await dispatch(updateCompany({ id: editId, data: formData }));
    } else {
      await dispatch(createCompany(formData));
    }
    setFormData({ name: '', code: '', address: '' });
    setShowForm(false);
    setEditId(null);
    dispatch(fetchCompanies());
  };

  const handleEdit = (company) => {
    setFormData({ name: company.name, code: company.code, address: company.address || '' });
    setEditId(company._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? Company will be deactivated.')) {
      await dispatch(deleteCompany(id));
      dispatch(fetchCompanies());
    }
  };

  const inputCls = "w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-4 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]";

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1A1A2E]">Companies Management</h1>
              <p className="text-xs text-[#9CA3AF]">{companies.length} companies configured</p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditId(null);
              setFormData({ name: '', code: '', address: '' });
            }}
            className={`group relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 ${
              showForm
                ? 'border border-gray-200 bg-white text-[#4B5563] hover:bg-gray-50'
                : 'bg-gradient-to-r from-[#E8590C] to-[#D14800] text-white shadow-md shadow-orange-200/40 hover:shadow-lg'
            }`}
          >
            <span className="relative flex items-center gap-2">
              {showForm ? 'Close' : '+ Add Company'}
            </span>
          </button>
        </div>

        {/* Success/Error */}
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

        {/* Form */}
        {showForm && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60 animate-formIn">
            <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-6">
              <h3 className="mb-5 text-sm font-bold text-[#1A1A2E]">
                {editId ? 'Edit Company' : 'Add New Company'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Company Name <span className="text-[#E8590C]">*</span>
                  </label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                    placeholder="e.g. RCC Construction" className={inputCls} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Company Code <span className="text-[#E8590C]">*</span>
                  </label>
                  <input type="text" name="code" value={formData.code} onChange={handleChange} required
                    placeholder="e.g. RCC" maxLength={10}
                    className={`${inputCls} uppercase`} disabled={!!editId} />
                  <p className="mt-1.5 text-[11px] text-[#9CA3AF]">
                    {editId ? 'Code cannot be changed' : 'Short unique code (e.g. RCC, DIM, VRN)'}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange}
                    placeholder="Office address" className={inputCls} />
                </div>

                <button type="submit"
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="relative">{editId ? 'Update Company' : 'Create Company'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Companies List */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1A1A2E]">All Companies</h3>
              <span className="rounded-full bg-[#FFF3E8] px-2 py-0.5 text-[11px] font-bold text-[#E8590C]">
                {companies.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-3 text-sm text-[#9CA3AF]">Loading…</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF3E8]">
                <svg className="h-7 w-7 text-[#E8590C]/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18" />
                </svg>
              </div>
              <p className="text-sm text-[#9CA3AF]">No companies yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 p-2">
              {companies.map((c, i) => (
                <div key={c._id} className="group flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-4 transition-all hover:bg-[#faf8f5]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] text-base font-bold text-white shadow-sm">
                      {c.code}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#1A1A2E]">{c.name}</p>
                        <span className="rounded-full bg-[#FFF3E8] px-2 py-0.5 text-[10px] font-bold uppercase text-[#E8590C]">
                          {c.code}
                        </span>
                        {c.active === false && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      {c.address && (
                        <p className="mt-0.5 text-xs text-[#9CA3AF]">{c.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(c)}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-all hover:bg-amber-100">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(c._id)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 transition-all hover:bg-red-100">
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
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

export default Companies;
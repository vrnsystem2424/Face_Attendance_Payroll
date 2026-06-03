// src/pages/admin/Sites.jsx

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSites, addSite, updateSite, deleteSite } from '../../redux/slices/siteSlice';

const Sites = () => {
  const dispatch = useDispatch();
  const { sites, loading } = useSelector((s) => s.sites);
  const { user } = useSelector((s) => s.auth);   // 🆕 For company info

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    site_name: '', type: 'office', latitude: '', longitude: '', radius: 100,
  });

  useEffect(() => { dispatch(fetchSites()); }, [dispatch]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius: parseInt(formData.radius),
    };
    if (editId) await dispatch(updateSite({ id: editId, data }));
    else await dispatch(addSite(data));
    setFormData({ site_name: '', type: 'office', latitude: '', longitude: '', radius: 100 });
    setShowForm(false);
    setEditId(null);
  };

  const handleEdit = (site) => {
    setFormData({ site_name: site.site_name, type: site.type, latitude: site.latitude, longitude: site.longitude, radius: site.radius });
    setEditId(site._id);
    setShowForm(true);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData({ ...formData, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }),
        () => alert('Location nahi mili. Permission do.')
      );
    }
  };

  const inputCls = "w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-4 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]";

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1A1A2E]">Sites Management</h1>
              <p className="text-xs text-[#9CA3AF]">
                {sites.length} sites configured
                {user?.company_id?.name && (
                  <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {user.company_id.name}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => { setShowForm(!showForm); setEditId(null); setFormData({ site_name: '', type: 'office', latitude: '', longitude: '', radius: 100 }); }}
            className={`group relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 ${
              showForm
                ? 'border border-gray-200 bg-white text-[#4B5563] hover:bg-gray-50'
                : 'bg-gradient-to-r from-[#E8590C] to-[#D14800] text-white shadow-md shadow-orange-200/40 hover:shadow-lg'
            }`}
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative flex items-center gap-2">
              {showForm ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Site
                </>
              )}
            </span>
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60 animate-formIn">
            <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1A1A2E]">
                  {editId ? 'Edit Site' : 'Add New Site'}
                </h3>
                {/* 🆕 Company indicator */}
                {!editId && user?.company_id?.name && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                    For: {user.company_id.name}
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Site Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Site Name <span className="text-[#E8590C]">*</span>
                  </label>
                  <input
                    type="text"
                    name="site_name"
                    value={formData.site_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Head Office"
                    className={inputCls}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">Type</label>
                  <div className="relative">
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`${inputCls} appearance-none pr-10`}
                    >
                      <option value="office">Office</option>
                      <option value="site">Site</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Lat + Lng */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Latitude <span className="text-[#E8590C]">*</span>
                    </label>
                    <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} required placeholder="28.6139" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Longitude <span className="text-[#E8590C]">*</span>
                    </label>
                    <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} required placeholder="77.2090" className={inputCls} />
                  </div>
                </div>

                {/* Get Location */}
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8590C]/20 bg-[#FFF8F3] py-2.5 text-sm font-semibold text-[#E8590C] transition-all hover:border-[#E8590C]/40 hover:bg-[#FFF3E8]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Use Current Location
                </button>

                {/* Radius */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Radius (meters) <span className="text-[#E8590C]">*</span>
                  </label>
                  <input type="number" name="radius" value={formData.radius} onChange={handleChange} required placeholder="100" className={inputCls} />
                </div>

                <button
                  type="submit"
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {editId ? 'Update Site' : 'Add Site'}
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Sites List */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1A1A2E]">All Sites</h3>
              <span className="rounded-full bg-[#FFF3E8] px-2 py-0.5 text-[11px] font-bold text-[#E8590C]">
                {sites.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-3 text-sm text-[#9CA3AF]">Loading sites…</p>
            </div>
          ) : sites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF3E8]">
                <svg className="h-7 w-7 text-[#E8590C]/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <p className="text-sm text-[#9CA3AF]">No sites yet. Add your first site above.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 p-2">
              {sites.map((site) => (
                <div
                  key={site._id}
                  className="group flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-4 transition-all hover:bg-[#faf8f5]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFF3E8] text-[#E8590C]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#1A1A2E]">{site.site_name}</p>
                        <span className="rounded-full bg-[#FFF3E8] px-2 py-0.5 text-[10px] font-bold uppercase text-[#E8590C]">
                          {site.type}
                        </span>
                        {/* 🆕 Company badge */}
                        {site.company_id?.name && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            {site.company_id.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">
                        Radius: <span className="font-semibold text-[#4B5563]">{site.radius}m</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#C0C0C0]">
                        {site.latitude}, {site.longitude}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(site)}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-all hover:bg-amber-100"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Delete karna hai?')) dispatch(deleteSite(site._id)); }}
                      className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 transition-all hover:bg-red-100"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete
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

export default Sites;
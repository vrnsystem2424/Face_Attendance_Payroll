// src/pages/super-admin/Sites.jsx

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSites, addSite, updateSite, deleteSite } from '../../redux/slices/siteSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const SuperAdminSites = () => {
  const dispatch = useDispatch();
  const { sites, loading } = useSelector((s) => s.sites);
  const { companies } = useSelector((s) => s.company);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [formData, setFormData] = useState({
    site_name: '', type: 'office', latitude: '', longitude: '', radius: 300, company_id: '',
  });

  useEffect(() => {
    dispatch(fetchSites());
    dispatch(fetchCompanies());
  }, [dispatch]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.company_id) {
      alert('Please select a company');
      return;
    }

    const data = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius: parseInt(formData.radius),
    };

    if (editId) await dispatch(updateSite({ id: editId, data }));
    else await dispatch(addSite(data));

    setFormData({ site_name: '', type: 'office', latitude: '', longitude: '', radius: 300, company_id: '' });
    setShowForm(false);
    setEditId(null);
    dispatch(fetchSites());
  };

  const handleEdit = (site) => {
    setFormData({
      site_name: site.site_name,
      type: site.type,
      latitude: site.latitude,
      longitude: site.longitude,
      radius: site.radius,
      company_id: site.company_id?._id || site.company_id || '',
    });
    setEditId(site._id);
    setShowForm(true);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData({ ...formData, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }),
        () => alert('Location nahi mili')
      );
    }
  };

  // Filter sites by company
  const filteredSites = selectedCompany === 'all'
    ? sites
    : sites.filter(s => {
        const siteCompId = s.company_id?._id || s.company_id;
        return siteCompId === selectedCompany;
      });

  const inputCls = "w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]";

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#1A1A2E]">All Sites</h1>
                <span className="rounded-full bg-gradient-to-r from-[#E8590C] to-[#D14800] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  Global
                </span>
              </div>
              <p className="text-sm text-[#9CA3AF]">{sites.length} sites across all companies</p>
            </div>
          </div>

          <button
            onClick={() => { setShowForm(!showForm); setEditId(null); setFormData({ site_name: '', type: 'office', latitude: '', longitude: '', radius: 300, company_id: '' }); }}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              showForm
                ? 'border border-gray-200 bg-white text-[#4B5563]'
                : 'bg-gradient-to-r from-[#E8590C] to-[#D14800] text-white shadow-md'
            }`}
          >
            {showForm ? '✕ Close' : '+ Add Site'}
          </button>
        </div>

        {/* Company Filter */}
        <div className="mb-6 flex items-center gap-3">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="appearance-none rounded-xl border-2 border-[#E8590C]/20 bg-[#FFF8F3] py-2.5 px-4 text-sm font-semibold outline-none focus:border-[#E8590C]"
          >
            <option value="all">All Companies ({sites.length})</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({sites.filter(s => (s.company_id?._id || s.company_id) === c._id).length})
              </option>
            ))}
          </select>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-6">
              <h3 className="mb-5 text-sm font-bold text-[#1A1A2E]">
                {editId ? 'Edit Site' : 'Add New Site'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Company Selection */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Company <span className="text-[#E8590C]">*</span>
                  </label>
                  <select
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleChange}
                    required
                    className={`${inputCls} appearance-none border-2 border-[#E8590C]/20 bg-[#FFF8F3] font-semibold`}
                  >
                    <option value="">— Select Company —</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                {/* Site Name + Type */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Site Name <span className="text-[#E8590C]">*</span>
                    </label>
                    <input type="text" name="site_name" value={formData.site_name} onChange={handleChange} required placeholder="e.g. Head Office" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className={`${inputCls} appearance-none`}>
                      <option value="office">Office</option>
                      <option value="site">Site</option>
                    </select>
                  </div>
                </div>

                {/* Lat + Lng */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">Latitude <span className="text-[#E8590C]">*</span></label>
                    <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} required placeholder="23.1977" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">Longitude <span className="text-[#E8590C]">*</span></label>
                    <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} required placeholder="77.4170" className={inputCls} />
                  </div>
                </div>

                {/* Get Location */}
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8590C]/20 bg-[#FFF8F3] py-2.5 text-sm font-semibold text-[#E8590C] hover:bg-[#FFF3E8]"
                >
                  📍 Use Current Location
                </button>

                {/* Radius */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">Radius (meters) <span className="text-[#E8590C]">*</span></label>
                  <input type="number" name="radius" value={formData.radius} onChange={handleChange} required placeholder="300" className={inputCls} />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  {editId ? 'Update Site' : 'Add Site'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Sites List */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-sm font-bold text-[#1A1A2E]">
              {selectedCompany === 'all' ? 'All' : companies.find(c => c._id === selectedCompany)?.name} Sites
              <span className="ml-2 rounded-full bg-[#FFF3E8] px-2 py-0.5 text-[11px] font-bold text-[#E8590C]">
                {filteredSites.length}
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#9CA3AF]">No sites found</div>
          ) : (
            <div className="divide-y divide-gray-50 p-2">
              {filteredSites.map((site) => (
                <div key={site._id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-4 hover:bg-[#faf8f5]">
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
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {site.company_id?.name || 'No Company'}
                        </span>
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
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Delete?')) dispatch(deleteSite(site._id)); }}
                      className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSites;
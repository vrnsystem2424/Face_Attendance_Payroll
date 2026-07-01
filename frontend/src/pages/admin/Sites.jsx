import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchSites, 
  addSite, 
  updateSite, 
  deleteSite,
  clearSiteMessage,
} from '../../redux/slices/siteSlice';
import { fetchCompanies } from '../../redux/slices/companySlice';

const Sites = () => {
  const dispatch = useDispatch();
  const { sites, loading, error, message } = useSelector((s) => s.sites);
  const { companies } = useSelector((s) => s.company);

  const [selectedCompany, setSelectedCompany] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [formData, setFormData] = useState({
    site_name: '',
    type: 'office',
    latitude: '',
    longitude: '',
    radius: 100,
    company_id: '',
  });

  useEffect(() => {
    dispatch(fetchCompanies());
    dispatch(fetchSites());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSites(selectedCompany));
  }, [selectedCompany, dispatch]);

  // Auto clear success message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        dispatch(clearSiteMessage());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  const handleOpenModal = (site = null) => {
    if (site) {
      setEditingSite(site);
      setFormData({
        site_name: site.site_name || '',
        type: site.type || 'office',
        latitude: site.latitude || '',
        longitude: site.longitude || '',
        radius: site.radius || 100,
        company_id: site.company_id?._id || site.company_id || '',
      });
    } else {
      setEditingSite(null);
      setFormData({
        site_name: '',
        type: 'office',
        latitude: '',
        longitude: '',
        radius: 100,
        company_id: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSite(null);
    setFormData({
      site_name: '',
      type: 'office',
      latitude: '',
      longitude: '',
      radius: 100,
      company_id: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.site_name || !formData.latitude || !formData.longitude || !formData.company_id) {
      alert('All fields required!');
      return;
    }

    if (editingSite) {
      await dispatch(updateSite({
        id: editingSite._id,
        data: formData,
      }));
    } else {
      await dispatch(addSite(formData));
    }
    
    handleCloseModal();
    dispatch(fetchSites(selectedCompany));
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await dispatch(deleteSite(deleteConfirm._id));
      setDeleteConfirm(null);
      dispatch(fetchSites(selectedCompany));
    }
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
              <p className="text-sm text-[#9CA3AF]">
                {sites.length} sites across all companies
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Site
          </button>
        </div>

        {/* Success Message */}
        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-700 font-semibold">✅ {message}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700 font-semibold">❌ {error}</p>
          </div>
        )}

        {/* Company Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCompany('all')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              selectedCompany === 'all'
                ? 'bg-[#E8590C] text-white shadow-md'
                : 'bg-white text-[#4B5563] hover:bg-[#FFF3E8]'
            }`}
          >
            All Companies ({sites.length})
          </button>
          {companies.map((company) => {
            const count = sites.filter(s => 
              (s.company_id?._id || s.company_id) === company._id
            ).length;
            return (
              <button
                key={company._id}
                onClick={() => setSelectedCompany(company._id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  selectedCompany === company._id
                    ? 'bg-[#E8590C] text-white shadow-md'
                    : 'bg-white text-[#4B5563] hover:bg-[#FFF3E8]'
                }`}
              >
                🏢 {company.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Sites Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-bold text-[#1A1A2E]">
              All Sites <span className="ml-2 rounded-full bg-[#FFF3E8] px-2 py-0.5 text-xs text-[#E8590C]">{sites.length}</span>
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
            </div>
          ) : sites.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3E8]">
                <svg className="h-8 w-8 text-[#E8590C]/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <p className="text-sm text-[#9CA3AF] mb-4">No sites found</p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E8590C] px-4 py-2 text-sm font-bold text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add First Site
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Sr', 'Site Name', 'Type', 'Company', 'Coordinates', 'Radius', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sites.map((site, idx) => (
                    <tr key={site._id} className="hover:bg-[#faf8f5] transition-colors">
                      <td className="px-4 py-3 text-[#9CA3AF]">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1A1A2E]">📍 {site.site_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 capitalize">
                          {site.type || 'office'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#FFF3E8] px-2.5 py-1 text-[11px] font-bold text-[#E8590C]">
                          🏢 {site.company_id?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-[#4B5563]">
                          {Number(site.latitude).toFixed(6)}, {Number(site.longitude).toFixed(6)}
                        </p>
                        <a
                          href={`https://www.google.com/maps?q=${site.latitude},${site.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#E8590C] hover:underline"
                        >
                          📍 View on Maps
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-700">
                          {site.radius}m
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(site)}
                            className="rounded-lg border border-gray-200 bg-white p-1.5 text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(site)}
                            className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 hover:bg-red-500 hover:text-white"
                            title="Delete"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166" />
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
            <div className="p-6">
              <h2 className="text-xl font-extrabold text-[#1A1A2E] mb-5">
                {editingSite ? '✏️ Edit Site' : '➕ Add New Site'}
              </h2>

              <div className="space-y-4">
                {/* Site Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-2">
                    Site Name *
                  </label>
                  <input
                    type="text"
                    value={formData.site_name}
                    onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                    placeholder="e.g. Main Office"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#E8590C]"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#E8590C]"
                  >
                    <option value="office">Office</option>
                    <option value="site">Site</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="branch">Branch</option>
                  </select>
                </div>

                {/* Company */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-2">
                    Company *
                  </label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#E8590C]"
                  >
                    <option value="">— Select Company —</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="23.197774"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#E8590C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="77.417452"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#E8590C]"
                    />
                  </div>
                </div>

                {/* Radius */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-2">
                    Radius (meters) *
                  </label>
                  <input
                    type="number"
                    value={formData.radius}
                    onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                    placeholder="100"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#E8590C]"
                  />
                  <p className="text-[10px] text-[#9CA3AF] mt-1">
                    Employees within this radius will be "on-site"
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                  <p className="text-[11px] text-blue-800">
                    💡 <strong>Tip:</strong> Get coordinates from Google Maps by right-clicking on location
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all"
                >
                  {editingSite ? 'Update Site' : 'Create Site'}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-red-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-red-600">Delete Site?</h3>
                  <p className="text-xs text-[#9CA3AF]">This cannot be undone</p>
                </div>
              </div>

              <div className="rounded-xl bg-[#faf8f5] p-3 mb-5">
                <p className="text-sm font-bold text-[#1A1A2E]">📍 {deleteConfirm.site_name}</p>
                <p className="text-xs text-[#9CA3AF]">Company: {deleteConfirm.company_id?.name}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600"
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-[#4B5563] hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sites;
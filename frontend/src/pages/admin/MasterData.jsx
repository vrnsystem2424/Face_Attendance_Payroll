import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllMasterData, addMasterData, deleteMasterData } from '../../redux/slices/masterSlice';

const TABS = [
  {
    key: 'department',
    label: 'Departments',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    key: 'designation',
    label: 'Designations',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    ),
  },
  {
    key: 'manager',
    label: 'Managers',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

const MasterData = () => {
  const dispatch = useDispatch();
  const { departments, designations, managers, loading } = useSelector((s) => s.master);

  const [activeTab, setActiveTab] = useState('department');
  const [newValue, setNewValue] = useState('');

  useEffect(() => { dispatch(fetchAllMasterData()); }, [dispatch]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    await dispatch(addMasterData({ type: activeTab, value: newValue.trim() }));
    setNewValue('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete karna hai?')) dispatch(deleteMasterData(id));
  };

  const getActiveData = () => {
    if (activeTab === 'department') return departments;
    if (activeTab === 'designation') return designations;
    return managers;
  };

  const getTabLabel = () => TABS.find((t) => t.key === activeTab)?.label || '';

  const counts = { department: departments.length, designation: designations.length, manager: managers.length };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {/* ── Page title ── */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1A1A2E]">Master Data</h1>
            <p className="text-xs text-[#9CA3AF]">Manage departments, designations and managers</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#E8590C] to-[#D14800] text-white shadow-md shadow-orange-200/40'
                  : 'border border-gray-200 bg-white text-[#4B5563] hover:border-[#E8590C]/30 hover:bg-[#FFF8F3] hover:text-[#E8590C]'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-[#FFF3E8] text-[#E8590C]'
              }`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Add Form ── */}
        <div className="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
          <div className="p-6">
            <h3 className="mb-4 text-sm font-bold text-[#1A1A2E]">
              Add New {getTabLabel().slice(0, -1)}
            </h3>
            <form onSubmit={handleAdd} className="flex gap-3">
              <div className="group relative flex-1">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={`Enter ${getTabLabel().slice(0, -1).toLowerCase()} name`}
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 pl-4 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newValue.trim()}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-55"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* ── List ── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1A1A2E]">{getTabLabel()} List</h3>
              <span className="rounded-full bg-[#FFF3E8] px-2 py-0.5 text-[11px] font-bold text-[#E8590C]">
                {getActiveData().length}
              </span>
            </div>
          </div>

          {getActiveData().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF3E8]">
                <svg className="h-7 w-7 text-[#E8590C]/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                </svg>
              </div>
              <p className="text-sm text-[#9CA3AF]">No data yet. Add your first entry above.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 p-2">
              {getActiveData().map((item, index) => (
                <div
                  key={item._id}
                  className="group flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:bg-[#faf8f5]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF3E8] text-[11px] font-bold text-[#E8590C]">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-[#1A1A2E]">{item.value}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="rounded-lg border border-transparent p-1.5 text-[#C0C0C0] opacity-0 transition-all group-hover:border-red-100 group-hover:bg-red-50 group-hover:text-red-500 group-hover:opacity-100"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tip box ── */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#E8590C]/15 bg-[#FFF8F3]">
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#E8590C]/10">
              <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#E8590C]">Quick Tip</p>
              <p className="mt-1 text-xs leading-5 text-[#4B5563]">
                Pehle sab departments, designations aur managers add karo. Phir employees
                register kar sakte hain dropdown se select karke.
              </p>
              <div className="mt-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-[#9CA3AF]">Your Departments:</p>
                <p className="text-xs text-[#4B5563]">RCC, DIMENSIONS, VRN INC</p>
                <p className="mt-2 text-[11px] font-semibold text-[#9CA3AF]">Your Managers:</p>
                <p className="text-xs text-[#4B5563]">Lt Col Mayank Sharma (Retd), Vipin Chauhan, Ajay Kumar Sharma, Subhash Patidar, Sameer Gupta, Ravindra Singh</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterData;
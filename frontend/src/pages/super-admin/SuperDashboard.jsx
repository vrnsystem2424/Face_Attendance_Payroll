import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchGlobalStats } from '../../redux/slices/superAdminSlice';
import { fetchCompanyStats } from '../../redux/slices/companySlice';

const SuperDashboard = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector((s) => s.superAdmin);
  const { stats: companyStats } = useSelector((s) => s.company);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchGlobalStats());
    dispatch(fetchCompanyStats());
  }, [dispatch]);

  const globalCards = [
    {
      label: 'Total Companies',
      value: stats?.total_companies || 0,
      color: '#E8590C',
      bg: '#FFF3E8',
      icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
    },
    {
      label: 'Total Employees',
      value: stats?.total_employees || 0,
      color: '#16a34a',
      bg: '#f0fdf4',
      icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    },
    {
      label: 'Managers',
      value: stats?.total_managers || 0,
      color: '#7c3aed',
      bg: '#f5f3ff',
      icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      label: 'Admins',
      value: stats?.total_admins || 0,
      color: '#0891b2',
      bg: '#ecfeff',
      icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pending_approvals || 0,
      color: '#d97706',
      bg: '#fffbeb',
      icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Pending Leaves',
      value: stats?.pending_leaves || 0,
      color: '#dc2626',
      bg: '#fef2f2',
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    },
  ];

  // 🆕 UPDATED — Added Payroll Reports
  const quickLinks = [
  {
    to: '/super-admin/companies',
    label: 'Manage Companies',
    desc: 'Add, edit, deactivate companies',
    icon: 'M3.75 21h16.5M4.5 3h15...',
  },
  {
    to: '/super-admin/admins',
    label: 'Manage Admins',
    desc: 'Create & manage company admins',
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036...',
  },
  // 🆕 ADD THIS
  {
    to: '/super-admin/monthly-settings',
    label: 'Monthly Settings',
    desc: 'Set required hours, holidays & weekly off',
    icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75',
  },
  {
    to: '/super-admin/payroll',
    label: 'Payroll Reports',
    desc: 'Monthly salary reports & PDF download',
    icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101...',
    highlight: true,
  },
];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A2E]">Super Admin Console</h1>
                <span className="rounded-full bg-gradient-to-r from-[#E8590C] to-[#D14800] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  Global
                </span>
              </div>
              <p className="text-sm text-[#9CA3AF]">Welcome back, {user?.name}</p>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="mb-8">
          <h2 className="mb-4 text-base font-bold text-[#1A1A2E]">Global Overview</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {globalCards.map((card) => (
              <div key={card.label} className="group overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="h-1 w-full" style={{ background: card.color }} />
                <div className="p-4">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: card.bg, color: card.color }}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                    </svg>
                  </div>
                  <p className="text-2xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🆕 UPDATED — Quick Actions (3 cards now) */}
        <div className="mb-8">
          <h2 className="mb-4 text-base font-bold text-[#1A1A2E]">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`group flex items-start gap-4 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                  link.highlight
                    ? 'bg-gradient-to-br from-[#E8590C] to-[#D14800] text-white shadow-md shadow-orange-200/40 hover:shadow-orange-300/50'
                    : 'bg-[#1A1A2E] text-white shadow-md hover:shadow-[#1A1A2E]/20'
                }`}>
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                  link.highlight ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-white">{link.label}</p>
                  <p className={`mt-1 text-xs leading-5 ${link.highlight ? 'text-orange-100' : 'text-gray-400'}`}>
                    {link.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Company Breakdown */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E8]">
                <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">Company Breakdown</h3>
                <p className="text-xs text-[#9CA3AF]">Per-company statistics</p>
              </div>
            </div>
          </div>

          {!companyStats || companyStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF3E8]">
                <svg className="h-7 w-7 text-[#E8590C]/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <p className="text-sm text-[#9CA3AF]">No companies yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 p-4">
              {companyStats.map((c) => (
                <div key={c._id} className="group flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-4 transition-all hover:bg-[#faf8f5]">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] text-base font-bold text-white shadow-sm">
                      {c.code}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A2E]">{c.name}</p>
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">Code: {c.code}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Employees', value: c.total_employees, color: '#16a34a' },
                      { label: 'Approved', value: c.approved_employees, color: '#0891b2' },
                      { label: 'Pending', value: c.pending_approvals, color: '#d97706' },
                      { label: 'Managers', value: c.managers, color: '#7c3aed' },
                      { label: 'Admins', value: c.admins, color: '#E8590C' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                        <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{stat.label}</p>
                      </div>
                    ))}
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

export default SuperDashboard;
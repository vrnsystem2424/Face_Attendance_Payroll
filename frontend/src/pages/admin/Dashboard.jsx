import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTodayAttendance } from '../../redux/slices/attendanceSlice';
import { fetchAllLeaves } from '../../redux/slices/leaveSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { todayData } = useSelector((state) => state.attendance);
  const { allLeaves } = useSelector((state) => state.leaves);

  useEffect(() => {
    dispatch(fetchTodayAttendance());
    dispatch(fetchAllLeaves('pending'));
  }, [dispatch]);

  const pendingLeaves = allLeaves.filter((l) => l.status === 'pending');

  const statCards = [
    {
      label: 'Total Employees',
      value: todayData?.total_employees || 0,
      color: '#E8590C',
      bg: '#FFF3E8',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      label: 'Present Today',
      value: todayData?.present_today || 0,
      color: '#16a34a',
      bg: '#f0fdf4',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Absent Today',
      value: todayData?.absent_today || 0,
      color: '#dc2626',
      bg: '#fef2f2',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending Leaves',
      value: pendingLeaves.length,
      color: '#d97706',
      bg: '#fffbeb',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
  ];

  const quickLinks = [
    {
      to: '/admin/employees',
      label: 'Manage Employees',
      desc: 'View & approve employee records',
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      primary: true,
    },
    {
      to: '/admin/attendance',
      label: 'View Attendance',
      desc: 'Daily check-in & check-out logs',
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
    {
      to: '/admin/sites',
      label: 'Manage Sites',
      desc: 'Add & configure office locations',
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      to: '/admin/reception',
      label: 'Reception Mode',
      desc: 'Face scan attendance system',
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
      ),
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* ambient blobs */}
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A2E]">
                Admin Dashboard
              </h1>
              <p className="text-sm text-[#9CA3AF]">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* top accent */}
              <div className="h-1 w-full" style={{ background: card.color }} />
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: card.bg, color: card.color }}
                  >
                    {card.icon}
                  </div>
                </div>
                <p
                  className="text-3xl font-extrabold"
                  style={{ color: card.color }}
                >
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-medium text-[#9CA3AF]">
                  {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick Links ── */}
        <div className="mb-8">
          <h2 className="mb-4 text-base font-bold text-[#1A1A2E]">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`group flex items-start gap-4 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                  link.highlight
                    ? 'bg-gradient-to-br from-[#E8590C] to-[#D14800] text-white shadow-md shadow-orange-200/40 hover:shadow-orange-300/50'
                    : link.primary
                    ? 'bg-[#1A1A2E] text-white shadow-md hover:shadow-[#1A1A2E]/20'
                    : 'bg-white text-[#1A1A2E] shadow-sm shadow-gray-200/60 hover:border-[#E8590C]/20 border border-gray-100'
                }`}
              >
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                    link.highlight
                      ? 'bg-white/20'
                      : link.primary
                      ? 'bg-white/10'
                      : 'bg-[#FFF3E8] text-[#E8590C]'
                  }`}
                >
                  {link.icon}
                </div>
                <div>
                  <p className={`font-bold text-sm ${link.highlight || link.primary ? 'text-white' : 'text-[#1A1A2E]'}`}>
                    {link.label}
                  </p>
                  <p className={`mt-1 text-xs leading-5 ${link.highlight ? 'text-orange-100' : link.primary ? 'text-gray-400' : 'text-[#9CA3AF]'}`}>
                    {link.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Today's Attendance Table ── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          {/* table header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E8]">
                <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">Today's Attendance</h3>
                <p className="text-xs text-[#9CA3AF]">
                  {todayData?.attendance?.length || 0} records
                </p>
              </div>
            </div>
            <Link
              to="/admin/attendance"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#4B5563] transition-all hover:border-[#E8590C]/30 hover:bg-[#FFF8F3] hover:text-[#E8590C]"
            >
              View All
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {!todayData?.attendance?.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3E8]">
                <svg className="h-8 w-8 text-[#E8590C]/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#9CA3AF]">No attendance records today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Name', 'Code', 'Check In', 'Check Out', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {todayData.attendance.map((record) => (
                    <tr
                      key={record._id}
                      className="group transition-colors hover:bg-[#faf8f5]"
                    >
                      <td className="px-6 py-3.5 font-semibold text-[#1A1A2E]">
                        {record.name}
                      </td>
                      <td className="px-6 py-3.5 text-[#4B5563]">
                        {record.emp_code}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-emerald-600">
                          {record.in_time || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-red-500">
                          {record.out_time || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
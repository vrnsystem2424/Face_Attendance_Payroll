



import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  fetchTodayAttendance,
  fetchAbsentToday,
  fetchOnLeaveToday,
} from '../../redux/slices/attendanceSlice';
import { fetchAllLeaves } from '../../redux/slices/leaveSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { todayData, absentToday, onLeaveToday } = useSelector((state) => state.attendance);
  const { allLeaves } = useSelector((state) => state.leaves);

  const isFollowupAdmin = user?.admin_type === 'followup';

  useEffect(() => {
    dispatch(fetchTodayAttendance());
    dispatch(fetchAbsentToday());
    dispatch(fetchOnLeaveToday());
    if (!isFollowupAdmin) {
      dispatch(fetchAllLeaves('pending'));
    }
  }, [dispatch, isFollowupAdmin]);

  const pendingLeaves = (allLeaves || []).filter((l) => l.status === 'pending');

  const statCards = [
    {
      label: 'Total Employees',
      value: todayData?.total_employees || 0,
      color: '#E8590C',
    },
    {
      label: 'Present Today',
      value: todayData?.present_today || 0,
      color: '#16a34a',
    },
    {
      label: 'Absent Today',
      value: absentToday?.absent_count || todayData?.absent_today || 0,
      color: '#dc2626',
    },
    {
      label: 'On Leave',
      value: onLeaveToday?.count || 0,
      color: '#d97706',
    },
  ];

  if (!isFollowupAdmin) {
    statCards.push({
      label: 'Pending Leaves',
      value: pendingLeaves.length,
      color: '#7c3aed',
    });
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A2E]">
                {isFollowupAdmin ? 'Follow-up Dashboard' : 'Admin Dashboard'}
              </h1>
              <p className="text-sm text-[#9CA3AF]">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  timeZone: 'Asia/Kolkata'
                })}
                {user?.company_id?.name && ` • ${user.company_id.name}`}
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className={`mb-8 grid grid-cols-2 gap-4 ${isFollowupAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
          {statCards.map((card) => (
            <div key={card.label} className="overflow-hidden rounded-2xl bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="h-1 w-full" style={{ background: card.color }} />
              <div className="p-5">
                <p className="text-3xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
                <p className="mt-1 text-xs font-medium text-[#9CA3AF]">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 🚫 Absent Employees */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <h3 className="text-white font-bold text-lg">
              🚫 Absent Today — {absentToday?.absent_count || 0} Employees
            </h3>
            <p className="text-red-100 text-xs">
              {absentToday?.date} • {absentToday?.present_count || 0} present out of {absentToday?.total_employees || 0}
            </p>
          </div>

          <div className="p-4">
            {!absentToday?.absent_employees?.length ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-sm font-bold text-emerald-600">Sab Present Hain!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {absentToday.absent_employees.map((emp, idx) => (
                  <div key={emp._id} className="flex items-center gap-3 rounded-xl border-2 border-red-100 bg-red-50/50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1A1A2E] text-sm truncate">{emp.name}</p>
                      <p className="text-[11px] font-mono text-[#E8590C] font-bold">{emp.emp_code}</p>
                      {emp.phone && (
                        <p className="text-sm font-bold text-[#1A1A2E] mt-1">📞 {emp.phone}</p>
                      )}
                      {emp.department && (
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                          🏢 {emp.department}
                          {emp.designation && ` • ${emp.designation}`}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-red-500 text-white px-3 py-1 text-[10px] font-bold uppercase flex-shrink-0">
                      Absent
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 🆕 📋 On Leave Today */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
            <h3 className="text-white font-bold text-lg">
              📋 On Leave Today — {onLeaveToday?.count || 0} Employees
            </h3>
            <p className="text-amber-100 text-xs">{onLeaveToday?.date}</p>
          </div>

          <div className="p-4">
            {!onLeaveToday?.employees?.length ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-sm font-bold text-emerald-600">Koi Leave Pe Nahi Hai!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {onLeaveToday.employees.map((leave, idx) => (
                  <div key={leave._id} className="flex items-center gap-3 rounded-xl border-2 border-amber-100 bg-amber-50/50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1A1A2E] text-sm truncate">{leave.emp_name}</p>
                      <p className="text-[11px] font-mono text-[#E8590C] font-bold">{leave.emp_code}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          leave.leave_type === 'sick' ? 'bg-red-100 text-red-700' :
                          leave.leave_type === 'casual' ? 'bg-blue-100 text-blue-700' :
                          leave.leave_type === 'emergency' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {leave.leave_type}
                        </span>
                        {leave.is_half_day && (
                          <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[9px] font-bold">
                            Half Day
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] mt-1">
                        📅 {leave.from_date} → {leave.to_date}
                        {leave.approved_days && ` (${leave.approved_days} days)`}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-500 text-white px-3 py-1 text-[10px] font-bold uppercase flex-shrink-0">
                      Leave
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - Only Regular Admin */}
        {!isFollowupAdmin && (
          <div className="mb-8">
            <h2 className="mb-4 text-base font-bold text-[#1A1A2E]">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: '/admin/employees', label: 'Manage Employees', desc: 'View & approve records', primary: true },
                { to: '/admin/attendance', label: 'View Attendance', desc: 'Daily check-in logs' },
                { to: '/admin/sites', label: 'Manage Sites', desc: 'Office locations' },
                { to: '/admin/reception', label: 'Reception Mode', desc: 'Face scan system', highlight: true },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    link.highlight
                      ? 'bg-gradient-to-br from-[#E8590C] to-[#D14800] text-white shadow-md'
                      : link.primary
                      ? 'bg-[#1A1A2E] text-white shadow-md'
                      : 'bg-white text-[#1A1A2E] shadow-sm border border-gray-100'
                  }`}
                >
                  <p className={`font-bold text-sm ${link.highlight || link.primary ? 'text-white' : 'text-[#1A1A2E]'}`}>
                    {link.label}
                  </p>
                  <p className={`mt-1 text-xs ${link.highlight ? 'text-orange-100' : link.primary ? 'text-gray-400' : 'text-[#9CA3AF]'}`}>
                    {link.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ✅ Present Today Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h3 className="text-base font-bold text-[#1A1A2E]">
                ✅ Present Today — {todayData?.attendance?.length || 0} Employees
              </h3>
              <p className="text-xs text-[#9CA3AF]">Today's attendance records</p>
            </div>
            {!isFollowupAdmin && (
              <Link
                to="/admin/attendance"
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#4B5563] hover:bg-[#FFF3E8] hover:text-[#E8590C]"
              >
                View All →
              </Link>
            )}
          </div>

          {!todayData?.attendance?.length ? (
            <div className="text-center py-16">
              <p className="text-sm text-[#9CA3AF]">No attendance records today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Sr', 'Name', 'Code', 'Check In', 'Check Out', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {todayData.attendance.map((record, idx) => (
                    <tr key={record._id} className="hover:bg-[#faf8f5] transition-colors">
                      <td className="px-4 py-3 text-[#9CA3AF]">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-[#1A1A2E]">{record.name}</td>
                      <td className="px-4 py-3 text-[#4B5563] font-mono text-xs">{record.emp_code}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-emerald-600">{record.in_time || '-'}</span>
                        {record.is_late && <span className="ml-1 text-[9px] text-amber-600">⏰</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-red-500">{record.out_time || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          record.is_half_day ? 'bg-orange-50 text-orange-700' :
                          record.is_late ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {record.is_half_day ? '⚠️ Half Day' :
                           record.is_late ? '⏰ Late' :
                           '✅ Present'}
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
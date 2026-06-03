import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyAttendance,
  fetchMonthlySummary,
} from '../redux/slices/attendanceSlice';

const MyRecords = () => {
  const dispatch = useDispatch();
  const { myAttendance, monthlySummary, loading } = useSelector((s) => s.attendance);
  const { user } = useSelector((s) => s.auth);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    dispatch(fetchMyAttendance());
    dispatch(fetchMonthlySummary({ month, year }));
  }, [dispatch, month, year]);

  // ── Helper: calculate working hours for table ──
  const calcHours = (inTime, outTime) => {
    if (!inTime || !outTime) return '-';
    const parse = (t) => {
      const [time, period] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    const diff = parse(outTime) - parse(inTime);
    if (diff < 0) return '-';
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const summaryCards = [
    {
      label: 'Hours Worked',
      value: monthlySummary?.worked_hours || '0h 0m',
      sub: `of ${monthlySummary?.required_hours || 0}h required`,
      color: '#E8590C',
      bg: '#FFF3E8',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Present Days',
      value: monthlySummary?.present_days || 0,
      sub: `${monthlySummary?.absent_days || 0} absent`,
      color: '#16a34a',
      bg: '#f0fdf4',
      icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Leaves Taken',
      value: monthlySummary?.leave_days || 0,
      sub: 'this month',
      color: '#d97706',
      bg: '#fffbeb',
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    },
    {
      label: 'Completion',
      value: `${monthlySummary?.completion_percent || 0}%`,
      sub: monthlySummary?.pending_hours ? `${monthlySummary.pending_hours} pending` : 'complete',
      color: '#7c3aed',
      bg: '#f5f3ff',
      icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25',
    },
  ];

  // Filter attendance by selected month
  const filteredAttendance = (myAttendance || []).filter(r => {
    if (!r.date) return false;
    const [, m, y] = r.date.split('/').map(Number);
    return m === month && y === year;
  });

  // Year/Month options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'radial-gradient(#1A1A2E 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1A1A2E]">My Records</h1>
              <p className="text-xs text-[#9CA3AF]">{user?.name} • {user?.emp_code}</p>
            </div>
          </div>

          {/* Month/Year Picker */}
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]"
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Monthly Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="group overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="h-1 w-full" style={{ background: card.color }} />
              <div className="p-4">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: card.bg, color: card.color }}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
                <p className="text-xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
                <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">{card.label}</p>
                <p className="mt-1 text-[10px] text-[#C0C0C0]">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {monthlySummary && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-white p-5 shadow-sm shadow-gray-200/60">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A2E]">
                  {monthlySummary.month_name} {monthlySummary.year} Progress
                </h3>
                <p className="text-xs text-[#9CA3AF]">
                  {monthlySummary.worked_hours} of {monthlySummary.required_hours}h target
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-[#E8590C]">{monthlySummary.completion_percent}%</p>
                <p className="text-[10px] text-[#9CA3AF]">Completed</p>
              </div>
            </div>

            <div className="relative h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#E8590C] to-[#F4A261] transition-all duration-700"
                style={{ width: `${monthlySummary.completion_percent}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="font-bold text-emerald-600">{monthlySummary.holiday_count || 0}</p>
                <p className="text-[10px] text-[#9CA3AF]">Holidays</p>
              </div>
              <div>
                <p className="font-bold text-blue-600">{monthlySummary.weekend_count || 0}</p>
                <p className="text-[10px] text-[#9CA3AF]">Weekends</p>
              </div>
              <div>
                <p className="font-bold text-[#E8590C]">{monthlySummary.avg_hours_per_day || '0h'}</p>
                <p className="text-[10px] text-[#9CA3AF]">Avg / Day</p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E8]">
                <svg className="h-4 w-4 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A2E]">Daily Records</h3>
                <p className="text-xs text-[#9CA3AF]">{filteredAttendance.length} entries this month</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-3 text-sm text-[#9CA3AF]">Loading records…</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF3E8]">
                <svg className="h-7 w-7 text-[#E8590C]/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                </svg>
              </div>
              <p className="text-sm text-[#9CA3AF]">No records for {months[month - 1]} {year}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Date', 'Check In', 'Check Out', 'Hours', 'Location', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAttendance.map((record) => {
                    const hours = calcHours(record.in_time, record.out_time);
                    return (
                      <tr key={record._id} className="group transition-colors hover:bg-[#faf8f5]">
                        <td className="px-6 py-3.5 font-semibold text-[#1A1A2E]">{record.date}</td>
                        <td className="px-6 py-3.5">
                          {record.in_time ? (
                            <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {record.in_time}
                            </span>
                          ) : <span className="text-[#D1D5DB]">—</span>}
                        </td>
                        <td className="px-6 py-3.5">
                          {record.out_time ? (
                            <span className="flex items-center gap-1.5 font-semibold text-[#E8590C]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#E8590C]" />
                              {record.out_time}
                            </span>
                          ) : <span className="text-[#D1D5DB]">—</span>}
                        </td>
                        <td className="px-6 py-3.5">
                          {hours !== '-' ? (
                            <span className="rounded-full bg-[#1A1A2E] px-2.5 py-1 text-[11px] font-bold text-white">
                              {hours}
                            </span>
                          ) : <span className="text-[#D1D5DB]">—</span>}
                        </td>
                        <td className="px-6 py-3.5">
                          {record.in_site ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-[#1A1A2E]">{record.in_site}</span>
                              <span className={`mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                record.in_location_status === 'on-site'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : record.in_location_status === 'out-of-range'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-gray-50 text-gray-500'
                              }`}>
                                {record.in_location_status || 'no-gps'}
                              </span>
                            </div>
                          ) : <span className="text-[#D1D5DB]">—</span>}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                            record.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${record.status === 'present' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {record.status}
                          </span>
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
    </div>
  );
};

export default MyRecords;
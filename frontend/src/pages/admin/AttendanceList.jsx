import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllAttendance } from '../../redux/slices/attendanceSlice';

const AttendanceList = () => {
  const dispatch = useDispatch();
  const { allAttendance, loading, error } = useSelector((s) => s.attendance);

  const getTodayDateForInput = () => new Date().toISOString().split('T')[0];

  const formatDateForBackend = (inputDate) => {
    if (!inputDate) return undefined;
    if (inputDate.includes('/')) return inputDate;
    const parts = inputDate.split('-');
    if (parts.length !== 3) return inputDate;
    const [year, month, day] = parts;
    if (!year || !month || !day) return inputDate;
    return `${Number(day)}/${Number(month)}/${year}`;
  };

  const [date, setDate] = useState(getTodayDateForInput());
  const [empCode, setEmpCode] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchAllAttendance({ date: formatDateForBackend(getTodayDateForInput()) }));
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(fetchAllAttendance({
      date: date ? formatDateForBackend(date) : undefined,
      emp_code: empCode || undefined,
    }));
  };

  const handleClearDate = () => {
    setDate('');
    dispatch(fetchAllAttendance({ emp_code: empCode || undefined }));
  };

  const handleReset = () => {
    const today = getTodayDateForInput();
    setDate(today);
    setEmpCode('');
    setStatusFilter('all');
    dispatch(fetchAllAttendance({ date: formatDateForBackend(today) }));
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const filteredAttendance = (allAttendance || []).filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'on-site') return r.in_location_status === 'on-site';
    if (statusFilter === 'out-of-range') return r.in_location_status === 'out-of-range';
    if (statusFilter === 'no-gps') return !r.in_location_status || r.in_location_status === 'no-gps';
    return true;
  });

  const totalPresent = (allAttendance || []).length;
  const onSiteCount = (allAttendance || []).filter((r) => r.in_location_status === 'on-site').length;
  const outOfRangeCount = (allAttendance || []).filter((r) => r.in_location_status === 'out-of-range').length;
  const noGpsCount = (allAttendance || []).filter((r) => !r.in_location_status || r.in_location_status === 'no-gps').length;

  const locationBadge = (status, distance) => {
    if (!status || status === 'no-gps') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
          No GPS
        </span>
      );
    }
    if (status === 'on-site') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          On Site {distance ? `(${distance}m)` : ''}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Out of Range {distance ? `(${distance}m)` : ''}
      </span>
    );
  };

  const statCards = [
    { label: 'Total Present', value: totalPresent, color: '#E8590C', bg: '#FFF3E8', border: '#E8590C', filter: 'all' },
    { label: 'On Site', value: onSiteCount, color: '#16a34a', bg: '#f0fdf4', border: '#16a34a', filter: 'on-site' },
    { label: 'Out of Range', value: outOfRangeCount, color: '#dc2626', bg: '#fef2f2', border: '#dc2626', filter: 'out-of-range' },
    { label: 'No GPS', value: noGpsCount, color: '#9CA3AF', bg: '#F9FAFB', border: '#9CA3AF', filter: 'no-gps' },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* ── Header card ── */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            {/* title row */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
                  <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#1A1A2E]">Attendance Records</h2>
                  <p className="text-xs text-[#9CA3AF]">{filteredAttendance.length} records found</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#4B5563] transition-all hover:border-[#E8590C]/30 hover:bg-[#FFF8F3] hover:text-[#E8590C]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Reset
              </button>
            </div>

            {/* filter row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="group relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 pl-10 pr-4 text-sm text-[#1A1A2E] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                />
              </div>

              {date && (
                <button
                  onClick={handleClearDate}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#9CA3AF] transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Date
                </button>
              )}

              <div className="group relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Employee Code"
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-44 rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 pl-10 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:shadow-[0_0_0_3px_rgba(232,89,12,0.07)]"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={loading}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Searching…
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      Search
                    </>
                  )}
                </span>
              </button>
            </div>

            {date && (
              <p className="mt-3 text-xs text-[#9CA3AF]">
                Sending to API:{' '}
                <span className="font-bold text-[#E8590C]">{formatDateForBackend(date)}</span>
              </p>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/80 px-4 py-3">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              onClick={() => setStatusFilter(card.filter === statusFilter ? 'all' : card.filter)}
              className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              style={{
                border: `2px solid ${statusFilter === card.filter ? card.border : 'transparent'}`,
              }}
            >
              <div className="h-1 w-full transition-all" style={{ background: card.color, opacity: statusFilter === card.filter ? 1 : 0.3 }} />
              <div className="p-5">
                <p className="text-3xl font-extrabold" style={{ color: card.color }}>
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-medium text-[#9CA3AF]">{card.label}</p>
                {statusFilter === card.filter && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: card.bg, color: card.color }}>
                    Active filter
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-4 text-sm text-[#9CA3AF]">Loading records…</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3E8]">
                <svg className="h-8 w-8 text-[#E8590C]/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#9CA3AF]">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Name', 'Code', 'Date', 'IN', 'IN Location', 'OUT', 'OUT Location', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAttendance.map((record) => (
                    <tr key={record._id} className="group transition-colors hover:bg-[#faf8f5]">
                      <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{record.name}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{record.emp_code}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{record.date}</td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-600">{record.in_time || '-'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          {locationBadge(record.in_location_status, record.in_distance)}
                          {record.in_site && (
                            <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                              {record.in_site}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-red-500">{record.out_time || '-'}</td>
                      <td className="px-5 py-3.5">
                        {record.out_time ? (
                          <div className="flex flex-col gap-1">
                            {locationBadge(record.out_location_status, record.out_distance)}
                            {record.out_site && (
                              <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                                {record.out_site}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#D1D5DB]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          record.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${record.status === 'present' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
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

export default AttendanceList;
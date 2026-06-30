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
  const [selectedPhoto, setSelectedPhoto] = useState(null);

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
    if (statusFilter === 'flagged') return r.flagged === true;
    if (statusFilter === 'on-site') return r.in_location_status === 'on-site';
    if (statusFilter === 'out-of-range') return r.in_location_status === 'out-of-range';
    if (statusFilter === 'no-gps') return !r.in_location_status || r.in_location_status === 'no-gps';
    return true;
  });

  const totalPresent = (allAttendance || []).length;
  const onSiteCount = (allAttendance || []).filter((r) => r.in_location_status === 'on-site').length;
  const outOfRangeCount = (allAttendance || []).filter((r) => r.in_location_status === 'out-of-range').length;
  const flaggedCount = (allAttendance || []).filter((r) => r.flagged === true).length;

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
    { label: '🚩 Flagged', value: flaggedCount, color: '#d97706', bg: '#fffbeb', border: '#d97706', filter: 'flagged' },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header card */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="h-1 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
          <div className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
                  <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
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
                Reset
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm text-[#1A1A2E] outline-none focus:border-[#E8590C]"
              />

              {date && (
                <button
                  onClick={handleClearDate}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#9CA3AF] hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                >
                  Clear Date
                </button>
              )}

              <input
                type="text"
                placeholder="Employee Code"
                value={empCode}
                onChange={(e) => setEmpCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-44 rounded-xl border border-gray-200 bg-[#FAFAFA] py-2.5 px-4 text-sm text-[#1A1A2E] outline-none focus:border-[#E8590C]"
              />

              <button
                onClick={handleSearch}
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading ? 'Searching…' : 'Search'}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50/80 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              onClick={() => setStatusFilter(card.filter === statusFilter ? 'all' : card.filter)}
              className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
              style={{ border: `2px solid ${statusFilter === card.filter ? card.border : 'transparent'}` }}
            >
              <div className="h-1 w-full" style={{ background: card.color, opacity: statusFilter === card.filter ? 1 : 0.3 }} />
              <div className="p-5">
                <p className="text-3xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
                <p className="mt-1 text-xs font-medium text-[#9CA3AF]">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
              <p className="mt-4 text-sm text-[#9CA3AF]">Loading records…</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm font-medium text-[#9CA3AF]">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f5]">
                    {['Photo', 'Name', 'Code', 'Date', 'IN', 'IN Location', 'OUT', 'OUT Location', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAttendance.map((record) => (
                    <tr key={record._id} className={`hover:bg-[#faf8f5] transition-colors ${record.flagged ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        {record.in_selfie_url ? (
                          <button
                            onClick={() => setSelectedPhoto({ record, type: 'IN' })}
                            className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-[#E8590C] transition-all"
                          >
                            <img src={record.in_selfie_url} alt="IN" className="h-12 w-12 object-cover" loading="lazy" />
                            {record.flagged && (
                              <span className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] px-1 rounded-bl">🚩</span>
                            )}
                          </button>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-[10px] text-gray-400">No Photo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">{record.name}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{record.emp_code}</td>
                      <td className="px-5 py-3.5 text-[#4B5563]">{record.date}</td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-600">{record.in_time || '-'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          {locationBadge(record.in_location_status, record.in_distance)}
                          {record.in_site && (
                            <span className="text-[11px] text-[#9CA3AF]">📍 {record.in_site}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-red-500">{record.out_time || '-'}</td>
                      <td className="px-5 py-3.5">
                        {record.out_time ? (
                          <div className="flex items-center gap-2">
                            {record.out_selfie_url && (
                              <button
                                onClick={() => setSelectedPhoto({ record, type: 'OUT' })}
                                className="overflow-hidden rounded border border-gray-200 hover:border-[#E8590C]"
                              >
                                <img src={record.out_selfie_url} alt="OUT" className="h-8 w-8 object-cover" />
                              </button>
                            )}
                            <div className="flex flex-col gap-1">
                              {locationBadge(record.out_location_status, record.out_distance)}
                              {record.out_site && (
                                <span className="text-[11px] text-[#9CA3AF]">📍 {record.out_site}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#D1D5DB]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          record.flagged ? 'bg-amber-50 text-amber-700' :
                          record.status === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {record.flagged ? '🚩 Flagged' : record.status}
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

      {selectedPhoto && (
        <PhotoModal
          data={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
};

// PHOTO MODAL WITH ADDRESS
const PhotoModal = ({ data, onClose }) => {
  const { record, type } = data;
  const photoUrl = type === 'IN' ? record.in_selfie_url : record.out_selfie_url;
  const time = type === 'IN' ? record.in_time : record.out_time;
  const location = type === 'IN' ? record.in_location_status : record.out_location_status;
  const distance = type === 'IN' ? record.in_distance : record.out_distance;
  const site = type === 'IN' ? record.in_site : record.out_site;
  const latitude = type === 'IN' ? record.in_latitude : record.out_latitude;
  const longitude = type === 'IN' ? record.in_longitude : record.out_longitude;
  const address = type === 'IN' ? record.in_address : record.out_address;  // 🆕

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-5 py-3 flex items-center justify-between sticky top-0 z-10 ${
          type === 'IN' ? 'bg-emerald-600' : 'bg-[#E8590C]'
        }`}>
          <h3 className="text-white font-bold">
            {type === 'IN' ? '✅ Check In' : '🏁 Check Out'} - {record.name}
          </h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-gray-100 p-4">
          <img src={photoUrl} alt="Selfie" className="w-full rounded-xl shadow-md" />
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Emp Code</p>
              <p className="font-bold text-gray-800">{record.emp_code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
              <p className="font-bold text-gray-800">{record.date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Time</p>
              <p className="font-bold text-gray-800">{time}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Confidence</p>
              <p className="font-bold text-emerald-600">🔒 {record.confidence}%</p>
            </div>
          </div>

          <div className={`rounded-xl p-3 border ${
            location === 'on-site' ? 'bg-emerald-50 border-emerald-200' :
            location === 'out-of-range' ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <p className="text-xs font-bold uppercase mb-1">
              {location === 'on-site' ? '✅ On Site' :
               location === 'out-of-range' ? '⚠️ Out of Range' :
               '❌ No GPS'}
            </p>
            {site && <p className="text-sm font-semibold">{site}</p>}
            {distance > 0 && <p className="text-xs">Distance: {distance}m</p>}
            
            {/* 🆕 Full Address Display */}
            {address && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">
                  📌 Full Address:
                </p>
                <p className="text-xs text-gray-800 font-medium leading-relaxed">
                  {address}
                </p>
              </div>
            )}
            
            {latitude && longitude && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">
                  📊 Coordinates:
                </p>
                <p className="font-mono text-[11px] text-gray-700">
                  {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  📍 View on Google Maps →
                </a>
              </div>
            )}
          </div>

          {record.flagged && record.flag_reasons?.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs font-bold text-amber-700 uppercase mb-2">🚩 Flags</p>
              <ul className="space-y-1">
                {record.flag_reasons.map((reason, i) => (
                  <li key={i} className="text-xs text-amber-700">• {reason.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default AttendanceList;
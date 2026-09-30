import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCompanies } from '../../redux/slices/companySlice';
import { 
  fetchAllEmployeesGlobal, 
  fetchEmployeeAuditData, 
  downloadEmployeeDetailedReport,
  clearAuditReportData 
} from '../../redux/slices/superAdminSlice';

const EmployeeDetailedReport = () => {
  const dispatch = useDispatch();
  const { companies } = useSelector((s) => s.company);
  const { allEmployees, auditReportData, auditLoading, downloadingReport, loading } = useSelector((s) => s.superAdmin);

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchCompanies());
    
    // 🎯 Sahi Current Date Calculation (2025 Current Month)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    setStartDate(`${year}-${month}-01`);
    setEndDate(`${year}-${month}-${day}`);

    return () => {
      dispatch(clearAuditReportData());
    };
  }, [dispatch]);

  const handleCompanyChange = (companyId) => {
    setSelectedCompany(companyId);
    setSelectedEmployee('');
    dispatch(clearAuditReportData());
    if (companyId) {
      dispatch(fetchAllEmployeesGlobal({ company_id: companyId, status: 'approved' }));
    }
  };

  // 🔍 1. VIEW ON SCREEN (WEB TABLE)
  const handleViewOnScreen = () => {
    if (!selectedCompany) return alert('Pehle Company select karein!');
    if (!selectedEmployee) return alert('Kripya Employee select karein!');
    if (!startDate || !endDate) return alert('Start date aur End date select karein!');

    dispatch(fetchEmployeeAuditData({
      employee_id: selectedEmployee,
      start_date: startDate,
      end_date: endDate,
    }));
  };

  // 👁️ 2. VIEW PDF IN NEW TAB
  const handlePdfAction = (mode) => {
    if (!selectedCompany || !selectedEmployee) return alert('Pehle Employee View karein!');
    
    const empObj = allEmployees.find(e => e._id === selectedEmployee);
    dispatch(downloadEmployeeDetailedReport({
      employee_id: selectedEmployee,
      start_date: startDate,
      end_date: endDate,
      employee_name: empObj?.name || 'Employee',
      view_mode: mode // 'inline' (View PDF) or 'download'
    }));
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="relative z-10 mx-auto max-w-[1300px] px-4 py-8 sm:px-6">

        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1A1A2E]">Employee GPS & Location Audit</h1>
            <p className="text-sm text-[#9CA3AF]">Individual Employee GPS verification & late arrival reports</p>
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Company */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Company *</label>
              <select
                value={selectedCompany}
                onChange={e => handleCompanyChange(e.target.value)}
                className="w-full rounded-xl border-2 border-[#E8590C]/20 bg-[#FFF8F3] py-3 px-4 text-sm font-semibold outline-none focus:border-[#E8590C]"
              >
                <option value="">— Select Company —</option>
                {companies.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            {/* Employee */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">Employee *</label>
              <select
                value={selectedEmployee}
                disabled={!selectedCompany || loading}
                onChange={e => { setSelectedEmployee(e.target.value); dispatch(clearAuditReportData()); }}
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C] disabled:opacity-50 font-medium text-gray-800"
              >
                <option value="">{loading ? '⏳ Loading...' : '— Select Employee —'}</option>
                {allEmployees.map(e => (
                  <option key={e._id} value={e._id}>{e.name} ({e.emp_code})</option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-[#9CA3AF]">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3 px-4 text-sm outline-none focus:border-[#E8590C]"
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {/* 1. VIEW ON SCREEN */}
            <button
              onClick={handleViewOnScreen}
              disabled={auditLoading || !selectedEmployee}
              className="rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50 transition-all"
            >
              {auditLoading ? '⏳ Fetching Records...' : '🔍 View Report On Screen'}
            </button>

            {/* 2. VIEW PDF IN NEW TAB */}
            {auditReportData && (
              <button
                onClick={() => handlePdfAction('inline')}
                disabled={downloadingReport}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                👁️ View PDF (New Tab)
              </button>
            )}

            {/* 3. DOWNLOAD PDF */}
            {auditReportData && (
              <button
                onClick={() => handlePdfAction('download')}
                disabled={downloadingReport}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                📥 Download PDF
              </button>
            )}
          </div>
        </div>

        {/* 📊 LIVE WEB REPORT DISPLAY */}
        {auditReportData && (
          <div className="space-y-6">

            {/* EMPLOYEE INFO BANNER */}
            <div className="rounded-2xl bg-gradient-to-r from-[#1A1A2E] to-[#2D2D44] p-5 text-white flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-extrabold">{auditReportData.employee.name}</h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  Code: <span className="text-white font-mono font-bold">{auditReportData.employee.emp_code}</span> • 
                  Dept: <span className="text-white font-semibold">{auditReportData.employee.department}</span> • 
                  Company: <span className="text-orange-400 font-bold">{auditReportData.employee.company_name}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 text-gray-200">
                  Period: <strong className="text-white">{auditReportData.period.start_date}</strong> to <strong className="text-white">{auditReportData.period.end_date}</strong>
                </span>
              </div>
            </div>

            {/* 4 SUMMARY WIDGET CARDS */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                <p className="text-[11px] font-bold uppercase text-gray-400">Total Present</p>
                <p className="mt-1 text-2xl font-extrabold text-[#1A1A2E]">{auditReportData.summary.total_present} Days</p>
              </div>
              <div className="rounded-2xl bg-amber-50/60 p-4 shadow-sm border border-amber-100">
                <p className="text-[11px] font-bold uppercase text-amber-700">Late Arrivals</p>
                <p className="mt-1 text-2xl font-extrabold text-amber-800">{auditReportData.summary.late_count}</p>
              </div>
              <div className="rounded-2xl bg-red-50/60 p-4 shadow-sm border border-red-100">
                <p className="text-[11px] font-bold uppercase text-red-700">Out of Range Punches</p>
                <p className="mt-1 text-2xl font-extrabold text-red-600">{auditReportData.summary.out_of_range_punches}</p>
              </div>
              <div className="rounded-2xl bg-rose-50/60 p-4 shadow-sm border border-rose-100">
                <p className="text-[11px] font-bold uppercase text-rose-700">Suspicious (Flags)</p>
                <p className="mt-1 text-2xl font-extrabold text-rose-600">{auditReportData.summary.suspicious_count}</p>
              </div>
            </div>

            {/* LIVE WEB TABLE */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 bg-[#FAFAFA] px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-[#1A1A2E] text-sm">Attendance & GPS Movement Logs ({auditReportData.records.length})</h3>
                <span className="text-xs text-gray-500">🔴 Red rows highlight Out-of-Range GPS punches</span>
              </div>

              {auditReportData.records.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                  No attendance records found for this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1A1A2E] text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">In Time</th>
                        <th className="py-3 px-4">In GPS Location / Status</th>
                        <th className="py-3 px-4">Out Time</th>
                        <th className="py-3 px-4">Out GPS Location / Status</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {auditReportData.records.map((rec) => {
                        const inIsOut = rec.in_location_status?.toLowerCase().includes('out');
                        const outIsOut = rec.out_location_status?.toLowerCase().includes('out');
                        const isAlertRow = inIsOut || outIsOut;

                        return (
                          <tr key={rec._id} className={isAlertRow ? 'bg-red-50/70 hover:bg-red-100/50' : 'hover:bg-gray-50'}>
                            <td className="py-3 px-4 font-bold text-[#1A1A2E]">{rec.date}</td>
                            <td className="py-3 px-4">
                              <span className={rec.in_status?.toLowerCase() === 'late' ? 'text-amber-700 font-bold' : 'text-gray-800'}>
                                {rec.in_time}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-[10px]">
                                  {rec.in_latitude && rec.in_longitude ? `${rec.in_latitude.toFixed(4)}, ${rec.in_longitude.toFixed(4)}` : 'No GPS'}
                                </span>
                                <span className={`font-bold text-[10px] ${inIsOut ? 'text-red-600' : 'text-emerald-700'}`}>
                                  [{rec.in_location_status}]
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">{rec.out_time}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-[10px]">
                                  {rec.out_latitude && rec.out_longitude ? `${rec.out_latitude.toFixed(4)}, ${rec.out_longitude.toFixed(4)}` : 'No GPS'}
                                </span>
                                <span className={`font-bold text-[10px] ${outIsOut ? 'text-red-600' : 'text-emerald-700'}`}>
                                  [{rec.out_location_status}]
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                rec.in_status?.toLowerCase() === 'late' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {rec.in_status}
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
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailedReport;
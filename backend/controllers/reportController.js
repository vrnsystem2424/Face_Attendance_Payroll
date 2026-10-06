

const PDFDocument = require('pdfkit');
const { calculateEmployeePayroll } = require('./payrollController');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const MonthlySettings = require('../models/MonthlySettings');
const Attendance = require('../models/Attendance');

const formatINRPlain = (num) => {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString('en-IN');
};

const getCompanyAddress = (company) => {
  if (company.address && company.address.trim() !== '') return company.address;
  return 'Bhopal, Madhya Pradesh, India';
};

const parseToDateObj = (dateStr) => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (str.includes('/')) {
    const parts = str.split('/').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) return new Date(parts[2], parts[1] - 1, parts[0]);
  } else if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      else return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
  }
  return null;
};

const formatLocationStatusStr = (locStatus, site, address, distance) => {
  const distVal = (distance !== undefined && distance !== null && !isNaN(distance) && distance > 0) ? Math.round(distance) : null;
  const distSuffix = distVal ? ` (${distVal}m)` : '';
  const statusLower = String(locStatus || '').toLowerCase();
  if (site && site !== 'Unknown Location' && site !== 'N/A' && site !== 'Manual Entry') return `• ${site}${distSuffix}`;
  if (statusLower === 'on-site' || statusLower.includes('on site') || statusLower === 'on_site') return `• On Site${distSuffix}`;
  if (statusLower === 'out-of-range' || statusLower.includes('out') || statusLower === 'out_of_range') return `• Out of Range${distSuffix}`;
  if (address && address !== 'N/A' && address !== 'Unknown Location') return `• ${address}${distSuffix}`;
  if (statusLower === 'no-gps') return 'No GPS';
  if (locStatus) return `• ${locStatus}${distSuffix}`;
  return '—';
};

const sanitizePdfText = (str) => {
  if (!str) return '—';
  let cleaned = String(str).replace(/[\u0900-\u097F]/g, '').replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned === '•' || cleaned === '()') {
    if (str.includes('On Site')) return '• On Site';
    if (str.includes('Out of Range')) return '• Out of Range';
    if (str.includes('Office') || str.includes('office')) return '• Office';
    return '• Location';
  }
  return cleaned;
};

const downloadPayrollPDF = async (req, res) => {
  try {
    const { company_id, department, month, year } = req.query;
    if (!company_id) return res.status(400).json({ success: false, message: 'company_id required' });
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();
    const company = await Company.findById(company_id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    const settings = await MonthlySettings.findOne({ company_id, month: currentMonth, year: currentYear });
    const filter = { company_id, status: 'approved', role: { $ne: 'super_admin' } };
    if (department && department !== 'all') filter.department = department;
    const employees = await Employee.find(filter).sort({ name: 1 });
    if (employees.length === 0) return res.status(404).json({ success: false, message: 'No employees found' });
    
    const payrollData = [];
    for (const emp of employees) {
      try {
        const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
        if (payroll) payrollData.push(payroll);
      } catch (err) { console.error(`Error calculating payroll for ${emp._id}:`, err.message); }
    }
    if (payrollData.length === 0) return res.status(404).json({ success: false, message: 'Could not generate payroll data' });
    
    const totalSalary = payrollData.reduce((s, p) => s + (p?.monthly_salary || 0), 0);
    const totalEarned = payrollData.reduce((s, p) => s + (p?.earned_salary || p?.net_payable || 0), 0);
    const totalCut = payrollData.reduce((s, p) => s + (p?.total_deduction || 0), 0);
    
    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' });
    const companyAddress = getCompanyAddress(company);
    const PAGE_W = 842;
    const PAGE_H = 595;
    const MARGIN = 15;
    const empCount = payrollData.length;
    let rowsPerPage = 28;
    let rowH = 15;
    let cellFS = 7.5;
    if (empCount <= 28) { rowsPerPage = 28; rowH = 16; cellFS = 7.5; } 
    else if (empCount <= 64) { rowsPerPage = Math.ceil(empCount / 2); rowH = 14; cellFS = 7.5; } 
    else { rowsPerPage = 28; rowH = 14; cellFS = 7.0; }
    const totalPages = Math.ceil(empCount / rowsPerPage) || 1;
    
    const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], margin: 0, autoFirstPage: true });
    const filename = `Payroll_${company.code || 'Company'}_${monthName}_${currentYear}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    
    const colors = {
      primary: '#E8590C', dark: '#1A1A2E', gray: '#6B7280', light: '#F8FAFC',
      success: '#16A34A', danger: '#DC2626', blue: '#2563EB', purple: '#7C3AED',
      amber: '#D97706', orange: '#EA580C', cyan: '#0891B2',
    };
    
    const tableLeft = MARGIN;
    const tableWidth = PAGE_W - MARGIN * 2;
    
    const cols = [
      { key: 'sr',      label: 'Sr',         width: 25,  align: 'left' },
      { key: 'name',    label: 'Name',       width: 100, align: 'left' },
      { key: 'present', label: 'Present',    width: 40,  align: 'center' },
      { key: 'wo',      label: 'W/O',        width: 30,  align: 'center' },
      { key: 'hol',     label: 'Hol',        width: 30,  align: 'center' },
      { key: 'late',    label: 'Late',       width: 30,  align: 'center' },
      { key: 'lded',    label: 'Lt Ded.',    width: 40,  align: 'center' },
      { key: 'hd',      label: 'HD',         width: 30,  align: 'center' },
      { key: 'hded',    label: 'HD Ded.',    width: 40,  align: 'center' },
      { key: 'leaves',  label: 'Leaves',     width: 40,  align: 'center' },
      { key: 'paidlv',  label: 'Paid Lv',    width: 40,  align: 'center' },
      { key: 'prevlv',  label: 'Prev Lv',    width: 45,  align: 'center' },
      { key: 'carry',   label: 'Carry',      width: 35,  align: 'center' },
      { key: 'final',   label: 'Final',      width: 38,  align: 'center' },
      { key: 'pct',     label: '%',          width: 35,  align: 'center' },
      { key: 'salary',  label: 'Salary',     width: 55,  align: 'right' },
      { key: 'cut',     label: 'Cut',        width: 45,  align: 'right' },
      { key: 'net',     label: 'Net',        width: 60,  align: 'right' },
    ];
    
    const totalColW = cols.reduce((s, c) => s + c.width, 0);
    const scale = tableWidth / totalColW;
    cols.forEach((c) => (c.width = c.width * scale));
    
    const drawHeader = (pageNum, total) => {
      doc.rect(0, 0, PAGE_W, 5).fill(colors.primary);
      doc.fillColor(colors.dark).fontSize(14).font('Helvetica-Bold').text((company.name || 'COMPANY').toUpperCase(), MARGIN, 12, { lineBreak: false });
      doc.fontSize(8).font('Helvetica').fillColor(colors.gray).text(companyAddress, MARGIN, 28, { width: 400, lineBreak: false });
      doc.fillColor(colors.primary).fontSize(12).font('Helvetica-Bold').text('PAYROLL REPORT', PAGE_W - 200, 12, { width: 180, align: 'right', lineBreak: false });
      doc.fillColor(colors.dark).fontSize(10).font('Helvetica-Bold').text(`${monthName} ${currentYear}`, PAGE_W - 200, 26, { width: 180, align: 'right', lineBreak: false });
      doc.roundedRect(PAGE_W - 95, 40, 75, 12, 3).fill(colors.blue);
      doc.fillColor('white').fontSize(7).font('Helvetica-Bold').text(`PAGE ${pageNum} OF ${total}`, PAGE_W - 95, 43, { width: 75, align: 'center', lineBreak: false });
      doc.moveTo(MARGIN, 55).lineTo(PAGE_W - MARGIN, 55).strokeColor(colors.primary).lineWidth(1).stroke();
    };
    
    const drawColumnHeader = (y) => {
      const COL_HEADER_H = 20;
      doc.rect(tableLeft, y, tableWidth, COL_HEADER_H).fill(colors.dark);
      let hx = tableLeft;
      const hTextY = y + 6;
      cols.forEach((col) => {
        doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold').text(col.label, hx + 3, hTextY, { width: col.width - 6, align: col.align, lineBreak: false });
        hx += col.width;
      });
    };
    
    const drawRows = (pageEmployees, startY, startIdx, rHeight, fSize) => {
      let y = startY;
      pageEmployees.forEach((emp, idx) => {
        const actualIdx = startIdx + idx;
        if (idx % 2 === 0) doc.rect(tableLeft, y, tableWidth, rHeight).fill(colors.light);
        
        const totalPunches = emp.total_checkins || 0;
        const totalWO = emp.weekly_off_paid || 0; 
        const totalHol = emp.holiday_paid || 0; 
        const totalHD = (emp.half_day_count || 0) + (emp.half_day_leave_count || 0);
        const hdDed = emp.half_day_deduction !== undefined ? emp.half_day_deduction : (totalHD * 0.5);
        const openingBalance = emp.leave_opening_balance || 0;
        const credited = emp.leave_credited || 0;
        
        const rowData = {
          sr:      `${actualIdx + 1}`,
          name:    emp.is_fsr ? `${emp.name} (FSR)` : (emp.name || '-'),
          present: `${totalPunches}`,
          wo:      `${totalWO}`,
          hol:     `${totalHol}`,
          late:    `${emp.late_count || 0}`,
          lded:    `${emp.late_leave_deduction || 0}`,
          hd:      `${totalHD}`,
          hded:    `${hdDed}`,
          leaves:  `${emp.full_day_leaves || 0}`,
          paidlv:  `${emp.paid_leave_days || 0}`,
          prevlv:  `${openingBalance + credited}`,
          carry:   `${emp.leave_closing_balance || 0}`,
          final:   `${emp.final_payable_days || 0}`,
          pct:     `${emp.progress_percent || 0}%`,
          salary:  formatINRPlain(emp.monthly_salary),
          cut:     formatINRPlain(emp.total_deduction),
          net:     formatINRPlain(emp.net_payable),
        };
        
        let xR = tableLeft;
        const cellY = y + (rHeight - fSize) / 2 - 0.5;
        cols.forEach((col) => {
          let textColor = colors.dark;
          let fontStyle = 'Helvetica';
          if (col.key === 'name') { fontStyle = 'Helvetica-Bold'; }
          else if (['final', 'net', 'salary'].includes(col.key)) { fontStyle = 'Helvetica-Bold'; }
          else if (col.key === 'cut' && (emp.total_deduction || 0) > 0) { textColor = colors.danger; }
          
          doc.fillColor(textColor).fontSize(fSize).font(fontStyle).text(rowData[col.key], xR + 3, cellY, { width: col.width - 6, align: col.align, lineBreak: false, ellipsis: true });
          xR += col.width;
        });
        doc.moveTo(tableLeft, y + rHeight).lineTo(tableLeft + tableWidth, y + rHeight).strokeColor('#E2E8F0').lineWidth(0.3).stroke();
        y += rHeight;
      });
      return y;
    };
    
    const drawTotalRow = (y) => {
      const TOTAL_ROW_H = 20;
      doc.rect(tableLeft, y, tableWidth, TOTAL_ROW_H).fill(colors.primary);
      
      const sumPresent = payrollData.reduce((s, p) => s + (p?.total_checkins || 0), 0);
      const sumWO = payrollData.reduce((s, p) => s + (p?.weekly_off_paid||0), 0);
      const sumHol = payrollData.reduce((s, p) => s + (p?.holiday_paid||0), 0);
      const sumLate = payrollData.reduce((s, p) => s + (p?.late_count || 0), 0);
      const sumLateDed = payrollData.reduce((s, p) => s + (p?.late_leave_deduction || 0), 0);
      const sumHD = payrollData.reduce((s, p) => s + ((p?.half_day_count || 0) + (p?.half_day_leave_count || 0)), 0);
      const sumHDDed = payrollData.reduce((s, p) => s + (p?.half_day_deduction !== undefined ? p?.half_day_deduction : (((p?.half_day_count || 0) + (p?.half_day_leave_count || 0)) * 0.5)), 0);
      const sumLeaves = payrollData.reduce((s, p) => s + (p?.full_day_leaves || 0), 0);
      const sumPaidLv = payrollData.reduce((s, p) => s + (p?.paid_leave_days || 0), 0);
      const sumCarry = payrollData.reduce((s, p) => s + (p?.leave_closing_balance || 0), 0);
      
      let xT = tableLeft;
      const totalTextY = y + 5;
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
      doc.text('TOTAL', xT + 4, totalTextY, { width: cols[0].width + cols[1].width - 8, align: 'left' });
      xT += cols[0].width + cols[1].width;
      
      const totalValues = [
        { val: `${sumPresent}`, idx: 2 }, { val: `${sumWO}`, idx: 3 }, { val: `${sumHol}`, idx: 4 },
        { val: `${sumLate}`, idx: 5 }, { val: `${sumLateDed}`, idx: 6 },
        { val: `${sumHD}`, idx: 7 }, { val: `${sumHDDed}`, idx: 8 },
        { val: `${sumLeaves}`, idx: 9 }, { val: `${sumPaidLv}`, idx: 10 },
        { val: `-`, idx: 11 }, { val: `${sumCarry}`, idx: 12 },
      ];
      
      totalValues.forEach(({ val, idx }) => {
        doc.text(val, xT + 3, totalTextY, { width: cols[idx].width - 6, align: 'center' });
        xT += cols[idx].width;
      });
      xT += cols[13].width + cols[14].width;
      
      doc.text(formatINRPlain(totalSalary), xT + 3, totalTextY, { width: cols[15].width - 6, align: 'right' });
      xT += cols[15].width;
      doc.text(formatINRPlain(totalCut), xT + 3, totalTextY, { width: cols[16].width - 6, align: 'right' });
      xT += cols[16].width;
      doc.text(formatINRPlain(totalEarned), xT + 3, totalTextY, { width: cols[17].width - 6, align: 'right' });
      return y + TOTAL_ROW_H;
    };
    
    for (let p = 0; p < totalPages; p++) {
      if (p > 0) doc.addPage({ size: [PAGE_W, PAGE_H], margin: 0 });
      const pageEmployees = payrollData.slice(p * rowsPerPage, (p + 1) * rowsPerPage);
      drawHeader(p + 1, totalPages);
      let y = 62;
      drawColumnHeader(y);
      y += 20;
      y = drawRows(pageEmployees, y, p * rowsPerPage, rowH, cellFS);
      if (p === totalPages - 1) { y += 4; drawTotalRow(y); }
    }
    doc.end();
  } catch (error) {
    if (!res.headersSent) return res.status(500).json({ success: false, message: 'PDF generation failed' });
  }
};

const downloadPayrollCSV = async (req, res) => {
  try {
    const { company_id, department, month, year } = req.query;
    if (!company_id) return res.status(400).json({ success: false, message: 'company_id required' });
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();
    const company = await Company.findById(company_id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    const settings = await MonthlySettings.findOne({ company_id, month: currentMonth, year: currentYear });
    const filter = { company_id, status: 'approved', role: { $ne: 'super_admin' } };
    if (department && department !== 'all') filter.department = department;
    const employees = await Employee.find(filter).sort({ name: 1 });
    if (employees.length === 0) return res.status(404).json({ success: false, message: 'No employees found' });
    
    const payrollData = [];
    for (const emp of employees) {
      const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
      if (payroll) payrollData.push(payroll);
    }
    if (payrollData.length === 0) return res.status(404).json({ success: false, message: 'Could not generate payroll data' });
    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' });
    
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };
    
    const rows = [];
    rows.push([`${company.name} - Payroll Report`]);
    rows.push([`${monthName} ${currentYear}`]);
    rows.push([]);
    rows.push([
      'Sr', 'Name', 'Present', 'W/O', 'Holiday', 'Late', 'Late Deduction', 'HD', 'HD Deduction',
      'Leaves', 'Paid Lv', 'Previous Month Leave Carry', 'Carry', 'Final Days', '%',
      'Salary', 'Cut', 'Net'
    ]);
    
    payrollData.forEach((emp, idx) => {
      const totalPunches = emp?.total_checkins || 0;
      const totalWO = emp?.weekly_off_paid || 0;
      const totalHol = emp?.holiday_paid || 0;
      const totalHD = (emp?.half_day_count || 0) + (emp?.half_day_leave_count || 0);
      const hdDed = emp?.half_day_deduction !== undefined ? emp?.half_day_deduction : (totalHD * 0.5);
      const prevBal = (emp?.leave_opening_balance || 0) + (emp?.leave_credited || 0);
      
      rows.push([
        idx + 1,
        emp?.name || '',
        totalPunches,
        totalWO,
        totalHol,
        emp?.late_count || 0,
        emp?.late_leave_deduction || 0,
        totalHD,
        hdDed,
        emp?.full_day_leaves || 0,
        emp?.paid_leave_days || 0,
        prevBal,
        emp?.leave_closing_balance || 0,
        emp?.final_payable_days || 0,
        `${emp?.progress_percent || 0}%`,
        emp?.monthly_salary || 0,
        emp?.total_deduction || 0,
        emp?.net_payable || 0,
      ]);
    });
    
    const csvContent = rows.map(row => row.map(cell => escapeCSV(cell)).join(',')).join('\n');
    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Payroll_${company.code || 'Company'}_${monthName}_${currentYear}.csv"`);
    res.send(bom + csvContent);
  } catch (error) {
    if (!res.headersSent) return res.status(500).json({ success: false, message: 'CSV generation failed' });
  }
};

const getEmployeeDetailedReportData = async (req, res) => {
  try {
    const employeeId = req.query.employee_id || req.query.employeeId;
    const fromDateStr = req.query.start_date || req.query.fromDate || req.query.from_date;
    const toDateStr = req.query.end_date || req.query.toDate || req.query.to_date;
    if (!employeeId || !fromDateStr || !toDateStr) return res.status(400).json({ success: false, message: 'Missing parameters: employee_id, start_date, end_date.' });
    const employee = await Employee.findById(employeeId).populate('company_id').lean();
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const startDate = parseToDateObj(fromDateStr);
    const endDate = parseToDateObj(toDateStr);
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);
    const attendanceRecords = await Attendance.find({ emp_id: employeeId }).lean();
    const filteredAttendance = attendanceRecords.filter(record => {
      if (!record.date) return false;
      const recDate = parseToDateObj(record.date);
      if (!recDate) return false;
      return recDate >= startDate && recDate <= endDate;
    });
    filteredAttendance.sort((a, b) => (parseToDateObj(b.date) || 0) - (parseToDateObj(a.date) || 0));
    let lateCount = 0, outOfRangeCount = 0, suspiciousCount = 0;
    const formattedRecords = filteredAttendance.map(rec => {
      const isLate = rec.is_late === true || rec.daily_status?.toLowerCase() === 'late' || rec.status?.toLowerCase() === 'late';
      if (isLate) lateCount++;
      const inIsOut = rec.in_location_status === 'out-of-range' || rec.in_location_status?.toLowerCase().includes('out');
      const outIsOut = rec.out_location_status === 'out-of-range' || rec.out_location_status?.toLowerCase().includes('out');
      if (inIsOut || outIsOut) outOfRangeCount++;
      const isFlagged = rec.flagged === true || rec.status?.toLowerCase() === 'flagged' || rec.daily_status?.toLowerCase() === 'flagged';
      if (isFlagged) suspiciousCount++;
      let displayStatus = rec.daily_status || rec.status || 'present';
      if (isFlagged) displayStatus = 'flagged'; else if (isLate) displayStatus = 'late'; else if (displayStatus === 'present') displayStatus = 'present';
      return {
        _id: rec._id ? String(rec._id) : Math.random().toString(),
        date: rec.date || '—', in_time: rec.in_time || '—', out_time: rec.out_time || '—',
        in_location_status: formatLocationStatusStr(rec.in_location_status, rec.in_site, rec.in_address, rec.in_distance),
        out_location_status: formatLocationStatusStr(rec.out_location_status, rec.out_site, rec.out_address, rec.out_distance),
        in_status: displayStatus, is_late: isLate, is_out_of_range: inIsOut || outIsOut, flagged: isFlagged
      };
    });
    return res.status(200).json({
      success: true,
      data: {
        employee: { name: employee.name, emp_code: employee.emp_code, department: employee.department, company_name: employee.company_id?.name || 'N/A' },
        period: { start_date: fromDateStr, end_date: toDateStr },
        summary: { total_present: filteredAttendance.length, late_count: lateCount, out_of_range_punches: outOfRangeCount, suspicious_count: suspiciousCount },
        records: formattedRecords
      }
    });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const downloadEmployeeDetailedReportPDF = async (req, res) => {
  try {
    const employeeId = req.query.employee_id || req.query.employeeId;
    const fromDateStr = req.query.start_date || req.query.fromDate || req.query.from_date;
    const toDateStr = req.query.end_date || req.query.toDate || req.query.to_date;
    if (!employeeId || !fromDateStr || !toDateStr) return res.status(400).json({ success: false, message: 'Missing parameters.' });
    const employee = await Employee.findById(employeeId).populate('company_id').lean();
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const startDate = parseToDateObj(fromDateStr);
    const endDate = parseToDateObj(toDateStr);
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);
    const attendanceRecords = await Attendance.find({ emp_id: employeeId }).lean();
    const filteredAttendance = attendanceRecords.filter(record => {
      if (!record.date) return false;
      const recDate = parseToDateObj(record.date);
      return recDate >= startDate && recDate <= endDate;
    });
    filteredAttendance.sort((a, b) => (parseToDateObj(b.date) || 0) - (parseToDateObj(a.date) || 0));
    
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const empCode = employee.emp_code || employee.code || 'EMP';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${req.query.view_mode === 'inline' ? 'inline' : 'attachment'}; filename=GPS_Audit_${empCode}.pdf`);
    doc.pipe(res);
    
    doc.fontSize(18).font('Helvetica-Bold').text('Employee GPS & Movement Audit Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Period: ${fromDateStr} to ${toDateStr}`, { align: 'center', color: '#555555' });
    doc.moveDown(1.5);
    let y = 75;
    doc.rect(30, y, 535, 55).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(employee.name || 'Employee', 40, y + 10);
    doc.fontSize(9).font('Helvetica').text(`Emp Code: ${empCode}`, 40, y + 28).text(`Department: ${employee.department || 'N/A'}`, 200, y + 28).text(`Company: ${employee.company_id?.name || 'N/A'}`, 360, y + 28);
    y += 70;
    
    let lateCount = 0, outOfRangeCount = 0, suspiciousCount = 0;
    const logs = filteredAttendance.map(rec => {
      const inIsOut = rec.in_location_status === 'out-of-range' || rec.in_location_status?.toLowerCase().includes('out');
      const outIsOut = rec.out_location_status === 'out-of-range' || rec.out_location_status?.toLowerCase().includes('out');
      if (inIsOut || outIsOut) outOfRangeCount++;
      const isLate = rec.is_late === true || rec.daily_status?.toLowerCase() === 'late';
      if (isLate) lateCount++;
      if (rec.flagged === true) suspiciousCount++;
      return {
        date: rec.date, punchIn: rec.in_time || '—', punchOut: rec.out_time || '—',
        inLocText: sanitizePdfText(formatLocationStatusStr(rec.in_location_status, rec.in_site, rec.in_address, rec.in_distance)),
        outLocText: sanitizePdfText(formatLocationStatusStr(rec.out_location_status, rec.out_site, rec.out_address, rec.out_distance)),
        isOutOfRange: inIsOut || outIsOut, status: rec.flagged ? 'Flagged' : isLate ? 'Late' : 'Present'
      };
    });
    
    const boxWidth = 125, boxY = y;
    doc.rect(30, boxY, boxWidth, 40).fillAndStroke('#f0fdf4', '#bbf7d0'); doc.fillColor('#166534').fontSize(9).font('Helvetica-Bold').text('TOTAL PRESENT', 35, boxY + 8); doc.fontSize(14).text(`${logs.length} Days`, 35, boxY + 22);
    doc.rect(165, boxY, boxWidth, 40).fillAndStroke('#fffbeb', '#fde68a'); doc.fillColor('#b45309').fontSize(9).font('Helvetica-Bold').text('LATE ARRIVALS', 170, boxY + 8); doc.fontSize(14).text(`${lateCount}`, 170, boxY + 22);
    doc.rect(300, boxY, boxWidth, 40).fillAndStroke('#fef2f2', '#fecaca'); doc.fillColor('#b91c1c').fontSize(9).font('Helvetica-Bold').text('OUT OF RANGE', 305, boxY + 8); doc.fontSize(14).text(`${outOfRangeCount}`, 305, boxY + 22);
    doc.rect(435, boxY, boxWidth + 5, 40).fillAndStroke('#fdf2f8', '#fbcfe8'); doc.fillColor('#be185d').fontSize(9).font('Helvetica-Bold').text('SUSPICIOUS (FLAGS)', 440, boxY + 8); doc.fontSize(14).text(`${suspiciousCount}`, 440, boxY + 22);
    y = boxY + 60;
    
    const cols = { date: 35, inTime: 95, inLoc: 150, outTime: 295, outLoc: 350, status: 495 };
    const widths = { date: 55, inTime: 50, inLoc: 135, outTime: 50, outLoc: 135, status: 65 };
    doc.rect(30, y, 535, 20).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('DATE', cols.date, y + 6, { width: widths.date }).text('IN TIME', cols.inTime, y + 6, { width: widths.inTime }).text('IN LOCATION', cols.inLoc, y + 6, { width: widths.inLoc }).text('OUT TIME', cols.outTime, y + 6, { width: widths.outTime }).text('OUT LOCATION', cols.outLoc, y + 6, { width: widths.outLoc }).text('STATUS', cols.status, y + 6, { width: widths.status, align: 'center' });
    y += 25;
    
    if (logs.length === 0) { doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('No attendance records found.', 35, y); }
    else {
      logs.forEach(log => {
        doc.font('Helvetica').fontSize(8);
        const rowHeight = Math.max(doc.heightOfString(log.inLocText, { width: widths.inLoc }), doc.heightOfString(log.outLocText, { width: widths.outLoc }), 14) + 8;
        if (y + rowHeight > 770) { doc.addPage(); y = 40; y += 25; doc.font('Helvetica').fontSize(8); }
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(log.date, cols.date, y, { width: widths.date });
        doc.font('Helvetica').text(log.punchIn, cols.inTime, y, { width: widths.inTime });
        doc.fillColor(log.inLocText.includes('On Site') ? '#166534' : log.isOutOfRange ? '#b91c1c' : '#475569').text(log.inLocText, cols.inLoc, y, { width: widths.inLoc });
        doc.fillColor('#0f172a').text(log.punchOut, cols.outTime, y, { width: widths.outTime });
        doc.fillColor(log.outLocText.includes('On Site') ? '#166534' : log.isOutOfRange ? '#b91c1c' : '#475569').text(log.outLocText, cols.outLoc, y, { width: widths.outLoc });
        doc.fillColor(log.status === 'Flagged' ? '#b45309' : log.status === 'Late' ? '#b91c1c' : '#166534').font('Helvetica-Bold').text(log.status, cols.status, y, { width: widths.status, align: 'center' });
        doc.moveTo(30, y + rowHeight - 3).lineTo(565, y + rowHeight - 3).strokeColor('#e2e8f0').stroke();
        y += rowHeight;
      });
    }
    doc.end();
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = {
  downloadPayrollPDF,
  downloadPayrollCSV,
  getEmployeeDetailedReportData,
  downloadEmployeeDetailedReportPDF,
};
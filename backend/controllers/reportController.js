
// const PDFDocument = require('pdfkit');
// const Employee = require('../models/Employee');
// const Attendance = require('../models/Attendance');

// // Helper: Convert mixed date formats ("18/9/2026", "2026-09-01") to standard Date Object
// const parseToDateObj = (dateStr) => {
//   if (!dateStr) return null;
//   const str = String(dateStr).trim();

//   if (str.includes('/')) {
//     const parts = str.split('/').map(Number);
//     if (parts.length === 3 && !parts.some(isNaN)) {
//       return new Date(parts[2], parts[1] - 1, parts[0]);
//     }
//   } else if (str.includes('-')) {
//     const parts = str.split('-');
//     if (parts.length === 3) {
//       if (parts[0].length === 4) {
//         return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
//       } else {
//         return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
//       }
//     }
//   }
//   return null;
// };

// // Helper: Format Location Status (e.g. "• On Site (48m)" or Site Name)
// const formatLocationStatusStr = (locStatus, site, address, distance) => {
//   const distVal = (distance !== undefined && distance !== null && !isNaN(distance) && distance > 0) ? Math.round(distance) : null;
//   const distSuffix = distVal ? ` (${distVal}m)` : '';
//   const statusLower = String(locStatus || '').toLowerCase();

//   // If explicit site or office name exists
//   if (site && site !== 'Unknown Location' && site !== 'N/A' && site !== 'Manual Entry') {
//     return `• ${site}${distSuffix}`;
//   }

//   if (statusLower === 'on-site' || statusLower.includes('on site') || statusLower === 'on_site') {
//     return `• On Site${distSuffix}`;
//   }

//   if (statusLower === 'out-of-range' || statusLower.includes('out') || statusLower === 'out_of_range') {
//     return `• Out of Range${distSuffix}`;
//   }

//   if (address && address !== 'N/A' && address !== 'Unknown Location') {
//     return `• ${address}${distSuffix}`;
//   }

//   if (statusLower === 'no-gps') {
//     return 'No GPS';
//   }

//   if (locStatus) {
//     return `• ${locStatus}${distSuffix}`;
//   }

//   return '—';
// };

// // Helper: Sanitize text for PDFKit (Removes non-ASCII / Hindi script that corrupts PDF text)
// const sanitizePdfText = (str) => {
//   if (!str) return '—';
//   let cleaned = String(str)
//     .replace(/[\u0900-\u097F]/g, '') // Remove Devanagari / Hindi script
//     .replace(/[^\x00-\x7F]/g, '')    // Remove non-ASCII corrupt characters
//     .replace(/\s+/g, ' ')            // Collapse multiple spaces
//     .trim();

//   if (!cleaned || cleaned === '•' || cleaned === '()') {
//     if (str.includes('On Site')) return '• On Site';
//     if (str.includes('Out of Range')) return '• Out of Range';
//     if (str.includes('Office') || str.includes('office')) return '• Office';
//     return '• Location';
//   }
//   return cleaned;
// };

// // @desc    Download Payroll Report PDF
// const downloadPayrollPDF = async (req, res) => {
//   try {
//     const { company, month } = req.query;
//     let query = company ? { company_id: company } : {};
//     const employees = await Employee.find(query).populate('company_id').lean();
    
//     const doc = new PDFDocument({ margin: 30, size: 'A4' });
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=Payroll_Report_${month || 'All'}.pdf`);
//     doc.pipe(res);

//     doc.fontSize(20).text('Payroll & Attendance Report', { align: 'center' });
//     doc.moveDown(0.5);
//     doc.fontSize(12).text(`Month: ${month || 'N/A'}`, { align: 'center' });
//     doc.moveDown(2);

//     doc.end();
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Download Payroll Report CSV
// const downloadPayrollCSV = async (req, res) => {
//   try {
//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition', `attachment; filename=Payroll_Report.csv`);
//     res.write('Emp ID,Name,Role\n');
//     res.end();
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get Detailed Employee GPS Audit Data (JSON)
// // @route   GET /api/super-admin/employee-report-data
// const getEmployeeDetailedReportData = async (req, res) => {
//   try {
//     const employeeId = req.query.employee_id || req.query.employeeId;
//     const fromDateStr = req.query.start_date || req.query.fromDate || req.query.from_date;
//     const toDateStr = req.query.end_date || req.query.toDate || req.query.to_date;

//     if (!employeeId || !fromDateStr || !toDateStr) {
//       return res.status(400).json({ success: false, message: 'Missing parameters: employee_id, start_date, end_date.' });
//     }

//     const employee = await Employee.findById(employeeId).populate('company_id').lean();
//     if (!employee) {
//       return res.status(404).json({ success: false, message: 'Employee not found.' });
//     }

//     const startDate = parseToDateObj(fromDateStr);
//     const endDate = parseToDateObj(toDateStr);

//     if (startDate) startDate.setHours(0, 0, 0, 0);
//     if (endDate) endDate.setHours(23, 59, 59, 999);

//     const attendanceRecords = await Attendance.find({ emp_id: employeeId }).lean();

//     const filteredAttendance = attendanceRecords.filter(record => {
//       if (!record.date) return false;
//       const recDate = parseToDateObj(record.date);
//       if (!recDate) return false;
//       return recDate >= startDate && recDate <= endDate;
//     });

//     filteredAttendance.sort((a, b) => {
//       const dA = parseToDateObj(a.date);
//       const dB = parseToDateObj(b.date);
//       return (dB || 0) - (dA || 0);
//     });

//     let lateCount = 0;
//     let outOfRangeCount = 0;
//     let suspiciousCount = 0;

//     const formattedRecords = filteredAttendance.map(rec => {
//       // Late Check
//       const isLate = rec.is_late === true || 
//                      rec.daily_status?.toLowerCase() === 'late' || 
//                      rec.status?.toLowerCase() === 'late';
//       if (isLate) lateCount++;

//       // Out of Range Check
//       const inIsOut = rec.in_location_status === 'out-of-range' || rec.in_location_status?.toLowerCase().includes('out');
//       const outIsOut = rec.out_location_status === 'out-of-range' || rec.out_location_status?.toLowerCase().includes('out');
//       const isOutOfRange = inIsOut || outIsOut;
//       if (isOutOfRange) outOfRangeCount++;

//       // Flagged / Suspicious Check
//       const isFlagged = rec.flagged === true || rec.status?.toLowerCase() === 'flagged' || rec.daily_status?.toLowerCase() === 'flagged';
//       if (isFlagged) suspiciousCount++;

//       // Format Location Texts
//       const inLocStatusFormatted = formatLocationStatusStr(rec.in_location_status, rec.in_site, rec.in_address, rec.in_distance);
//       const outLocStatusFormatted = formatLocationStatusStr(rec.out_location_status, rec.out_site, rec.out_address, rec.out_distance);

//       // Status Badges
//       let displayStatus = rec.daily_status || rec.status || 'present';
//       if (isFlagged) displayStatus = 'flagged';
//       else if (isLate) displayStatus = 'late';
//       else if (displayStatus === 'present') displayStatus = 'present';

//       return {
//         _id: rec._id ? String(rec._id) : Math.random().toString(),
//         date: rec.date || '—',
//         in_time: rec.in_time || '—',
//         out_time: rec.out_time || '—',
//         in_latitude: rec.in_latitude || null,
//         in_longitude: rec.in_longitude || null,
//         out_latitude: rec.out_latitude || null,
//         out_longitude: rec.out_longitude || null,
//         in_location_status: inLocStatusFormatted,
//         out_location_status: outLocStatusFormatted,
//         in_status: displayStatus,
//         is_late: isLate,
//         is_out_of_range: isOutOfRange,
//         flagged: isFlagged
//       };
//     });

//     const companyName = employee.company_id?.name || employee.company_id?.companyName || employee.company_name || 'N/A';

//     return res.status(200).json({
//       success: true,
//       data: {
//         employee: {
//           name: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee',
//           emp_code: employee.emp_code || employee.code || 'N/A',
//           department: employee.department || 'N/A',
//           company_name: companyName
//         },
//         period: {
//           start_date: fromDateStr,
//           end_date: toDateStr
//         },
//         summary: {
//           total_present: filteredAttendance.length,
//           late_count: lateCount,
//           out_of_range_punches: outOfRangeCount,
//           suspicious_count: suspiciousCount
//         },
//         records: formattedRecords
//       }
//     });

//   } catch (error) {
//     console.error('Error in getEmployeeDetailedReportData:', error);
//     return res.status(500).json({ success: false, message: error.message || 'Server Error' });
//   }
// };

// // @desc    Download/View Detailed Employee GPS Audit PDF
// // @route   GET /api/super-admin/employee-report-pdf
// const downloadEmployeeDetailedReportPDF = async (req, res) => {
//   try {
//     const employeeId = req.query.employee_id || req.query.employeeId;
//     const fromDateStr = req.query.start_date || req.query.fromDate || req.query.from_date;
//     const toDateStr = req.query.end_date || req.query.toDate || req.query.to_date;
//     const view_mode = req.query.view_mode;

//     if (!employeeId || !fromDateStr || !toDateStr) {
//       return res.status(400).json({ success: false, message: 'Missing parameters.' });
//     }

//     const employee = await Employee.findById(employeeId).populate('company_id').lean();
//     if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

//     const startDate = parseToDateObj(fromDateStr);
//     const endDate = parseToDateObj(toDateStr);

//     if (startDate) startDate.setHours(0, 0, 0, 0);
//     if (endDate) endDate.setHours(23, 59, 59, 999);

//     const attendanceRecords = await Attendance.find({ emp_id: employeeId }).lean();
//     const filteredAttendance = attendanceRecords.filter(record => {
//       if (!record.date) return false;
//       const recDate = parseToDateObj(record.date);
//       return recDate >= startDate && recDate <= endDate;
//     });

//     filteredAttendance.sort((a, b) => {
//       const dA = parseToDateObj(a.date);
//       const dB = parseToDateObj(b.date);
//       return (dB || 0) - (dA || 0);
//     });

//     const doc = new PDFDocument({ margin: 30, size: 'A4' });

//     const empCode = employee.emp_code || employee.code || 'EMP';
//     if (view_mode === 'inline') {
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `inline; filename=GPS_Audit_${empCode}.pdf`);
//     } else {
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=GPS_Audit_${empCode}.pdf`);
//     }

//     doc.pipe(res);

//     // Header
//     doc.fontSize(18).font('Helvetica-Bold').text('Employee GPS & Movement Audit Report', { align: 'center' });
//     doc.moveDown(0.5);
//     doc.fontSize(10).font('Helvetica').text(`Period: ${fromDateStr} to ${toDateStr}`, { align: 'center', color: '#555555' });
//     doc.moveDown(1.5);

//     // Employee Meta Box
//     let y = 75;
//     doc.rect(30, y, 535, 55).fillAndStroke('#f8fafc', '#e2e8f0');
    
//     const empName = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee';
//     const compName = employee.company_id?.name || employee.company_id?.companyName || employee.company_name || 'N/A';

//     doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(empName, 40, y + 10);
//     doc.fontSize(9).font('Helvetica')
//        .text(`Emp Code: ${empCode}`, 40, y + 28)
//        .text(`Department: ${employee.department || 'N/A'}`, 200, y + 28)
//        .text(`Company: ${compName}`, 360, y + 28);

//     y += 70;

//     let lateCount = 0, outOfRangeCount = 0, suspiciousCount = 0;
//     const logs = filteredAttendance.map(rec => {
//       const isLate = rec.is_late === true || rec.daily_status?.toLowerCase() === 'late' || rec.status?.toLowerCase() === 'late';
//       if (isLate) lateCount++;

//       const inIsOut = rec.in_location_status === 'out-of-range' || rec.in_location_status?.toLowerCase().includes('out');
//       const outIsOut = rec.out_location_status === 'out-of-range' || rec.out_location_status?.toLowerCase().includes('out');
//       if (inIsOut || outIsOut) outOfRangeCount++;

//       const isFlagged = rec.flagged === true || rec.status?.toLowerCase() === 'flagged' || rec.daily_status?.toLowerCase() === 'flagged';
//       if (isFlagged) suspiciousCount++;

//       const rawInLocText = formatLocationStatusStr(rec.in_location_status, rec.in_site, rec.in_address, rec.in_distance);
//       const rawOutLocText = formatLocationStatusStr(rec.out_location_status, rec.out_site, rec.out_address, rec.out_distance);

//       let displayStatus = rec.daily_status || rec.status || 'Present';
//       if (isFlagged) displayStatus = 'Flagged';
//       else if (isLate) displayStatus = 'Late';
//       else if (displayStatus === 'present') displayStatus = 'Present';

//       return {
//         date: rec.date,
//         punchIn: rec.in_time || '—',
//         inLocText: sanitizePdfText(rawInLocText),
//         punchOut: rec.out_time || '—',
//         outLocText: sanitizePdfText(rawOutLocText),
//         isOutOfRange: inIsOut || outIsOut,
//         status: displayStatus
//       };
//     });

//     // Summary Widgets
//     const boxWidth = 125;
//     const boxY = y;
    
//     doc.rect(30, boxY, boxWidth, 40).fillAndStroke('#f0fdf4', '#bbf7d0');
//     doc.fillColor('#166534').fontSize(9).font('Helvetica-Bold').text('TOTAL PRESENT', 35, boxY + 8);
//     doc.fontSize(14).text(`${logs.length} Days`, 35, boxY + 22);

//     doc.rect(165, boxY, boxWidth, 40).fillAndStroke('#fffbeb', '#fde68a');
//     doc.fillColor('#b45309').fontSize(9).font('Helvetica-Bold').text('LATE ARRIVALS', 170, boxY + 8);
//     doc.fontSize(14).text(`${lateCount}`, 170, boxY + 22);

//     doc.rect(300, boxY, boxWidth, 40).fillAndStroke('#fef2f2', '#fecaca');
//     doc.fillColor('#b91c1c').fontSize(9).font('Helvetica-Bold').text('OUT OF RANGE', 305, boxY + 8);
//     doc.fontSize(14).text(`${outOfRangeCount}`, 305, boxY + 22);

//     doc.rect(435, boxY, boxWidth + 5, 40).fillAndStroke('#fdf2f8', '#fbcfe8');
//     doc.fillColor('#be185d').fontSize(9).font('Helvetica-Bold').text('SUSPICIOUS (FLAGS)', 440, boxY + 8);
//     doc.fontSize(14).text(`${suspiciousCount}`, 440, boxY + 22);

//     y = boxY + 60;

//     // Strict Column Coordinates and Widths to prevent overlaps
//     const cols = { date: 35, inTime: 95, inLoc: 150, outTime: 295, outLoc: 350, status: 495 };
//     const widths = { date: 55, inTime: 50, inLoc: 135, outTime: 50, outLoc: 135, status: 65 };

//     // Draw Table Header
//     doc.rect(30, y, 535, 20).fill('#1e293b');
//     doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
//     doc.text('DATE', cols.date, y + 6, { width: widths.date });
//     doc.text('IN TIME', cols.inTime, y + 6, { width: widths.inTime });
//     doc.text('IN LOCATION', cols.inLoc, y + 6, { width: widths.inLoc });
//     doc.text('OUT TIME', cols.outTime, y + 6, { width: widths.outTime });
//     doc.text('OUT LOCATION', cols.outLoc, y + 6, { width: widths.outLoc });
//     doc.text('STATUS', cols.status, y + 6, { width: widths.status, align: 'center' });

//     y += 25;

//     if (logs.length === 0) {
//       doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('No attendance records found for this period.', 35, y);
//     } else {
//       logs.forEach(log => {
//         doc.font('Helvetica').fontSize(8);

//         // Calculate dynamic height required for long addresses
//         const inLocHeight = doc.heightOfString(log.inLocText, { width: widths.inLoc });
//         const outLocHeight = doc.heightOfString(log.outLocText, { width: widths.outLoc });
//         const rowHeight = Math.max(inLocHeight, outLocHeight, 14) + 8;

//         // Page break check
//         if (y + rowHeight > 770) {
//           doc.addPage();
//           y = 40;
//           doc.rect(30, y, 535, 20).fill('#1e293b');
//           doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
//           doc.text('DATE', cols.date, y + 6, { width: widths.date });
//           doc.text('IN TIME', cols.inTime, y + 6, { width: widths.inTime });
//           doc.text('IN LOCATION', cols.inLoc, y + 6, { width: widths.inLoc });
//           doc.text('OUT TIME', cols.outTime, y + 6, { width: widths.outTime });
//           doc.text('OUT LOCATION', cols.outLoc, y + 6, { width: widths.outLoc });
//           doc.text('STATUS', cols.status, y + 6, { width: widths.status, align: 'center' });
//           y += 25;
//           doc.font('Helvetica').fontSize(8);
//         }

//         // Render Row Data
//         doc.fillColor('#0f172a').font('Helvetica-Bold').text(log.date, cols.date, y, { width: widths.date });
//         doc.font('Helvetica').text(log.punchIn, cols.inTime, y, { width: widths.inTime });
        
//         doc.fillColor(log.inLocText.includes('On Site') ? '#166534' : log.isOutOfRange ? '#b91c1c' : '#475569');
//         doc.text(log.inLocText, cols.inLoc, y, { width: widths.inLoc });

//         doc.fillColor('#0f172a').text(log.punchOut, cols.outTime, y, { width: widths.outTime });
        
//         doc.fillColor(log.outLocText.includes('On Site') ? '#166534' : log.isOutOfRange ? '#b91c1c' : '#475569');
//         doc.text(log.outLocText, cols.outLoc, y, { width: widths.outLoc });

//         const statusText = String(log.status).charAt(0).toUpperCase() + String(log.status).slice(1);
//         if (statusText.toLowerCase() === 'flagged') doc.fillColor('#b45309').font('Helvetica-Bold');
//         else if (statusText.toLowerCase() === 'late') doc.fillColor('#b91c1c').font('Helvetica-Bold');
//         else doc.fillColor('#166534').font('Helvetica-Bold');
        
//         doc.text(statusText, cols.status, y, { width: widths.status, align: 'center' });

//         // Divider Line
//         doc.moveTo(30, y + rowHeight - 3).lineTo(565, y + rowHeight - 3).strokeColor('#e2e8f0').stroke();
//         y += rowHeight;
//       });
//     }

//     doc.end();
//   } catch (error) {
//     console.error('PDF Error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = {
//   downloadPayrollPDF,
//   downloadPayrollCSV,
//   getEmployeeDetailedReportData,
//   downloadEmployeeDetailedReportPDF
// };






const PDFDocument = require('pdfkit');
const { calculateEmployeePayroll } = require('./payrollController');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const MonthlySettings = require('../models/MonthlySettings');
const Attendance = require('../models/Attendance');

// ════════════════════════════════════════════
// HELPERS FOR LANDSCAPE PAYROLL REPORT
// ════════════════════════════════════════════
const formatINRPlain = (num) => {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString('en-IN');
};

const getCompanyAddress = (company) => {
  if (company.address && company.address.trim() !== '') return company.address;
  return 'Bhopal, Madhya Pradesh, India';
};

// ════════════════════════════════════════════
// HELPERS FOR GPS AUDIT REPORT
// ════════════════════════════════════════════
const parseToDateObj = (dateStr) => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  if (str.includes('/')) {
    const parts = str.split('/').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  } else if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }
  }
  return null;
};

const formatLocationStatusStr = (locStatus, site, address, distance) => {
  const distVal = (distance !== undefined && distance !== null && !isNaN(distance) && distance > 0) ? Math.round(distance) : null;
  const distSuffix = distVal ? ` (${distVal}m)` : '';
  const statusLower = String(locStatus || '').toLowerCase();

  if (site && site !== 'Unknown Location' && site !== 'N/A' && site !== 'Manual Entry') {
    return `• ${site}${distSuffix}`;
  }

  if (statusLower === 'on-site' || statusLower.includes('on site') || statusLower === 'on_site') {
    return `• On Site${distSuffix}`;
  }

  if (statusLower === 'out-of-range' || statusLower.includes('out') || statusLower === 'out_of_range') {
    return `• Out of Range${distSuffix}`;
  }

  if (address && address !== 'N/A' && address !== 'Unknown Location') {
    return `• ${address}${distSuffix}`;
  }

  if (statusLower === 'no-gps') {
    return 'No GPS';
  }

  if (locStatus) {
    return `• ${locStatus}${distSuffix}`;
  }

  return '—';
};

const sanitizePdfText = (str) => {
  if (!str) return '—';
  let cleaned = String(str)
    .replace(/[\u0900-\u097F]/g, '') // Remove Devanagari / Hindi script
    .replace(/[^\x00-\x7F]/g, '')    // Remove non-ASCII corrupt characters
    .replace(/\s+/g, ' ')            // Collapse multiple spaces
    .trim();

  if (!cleaned || cleaned === '•' || cleaned === '()') {
    if (str.includes('On Site')) return '• On Site';
    if (str.includes('Out of Range')) return '• Out of Range';
    if (str.includes('Office') || str.includes('office')) return '• Office';
    return '• Location';
  }
  return cleaned;
};

// ════════════════════════════════════════════
// 1. DOWNLOAD PAYROLL REPORT PDF (LANDSCAPE A4)
// ════════════════════════════════════════════
const downloadPayrollPDF = async (req, res) => {
  try {
    const { company_id, department, month, year } = req.query;

    if (!company_id)
      return res.status(400).json({ success: false, message: 'company_id required' });

    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const company = await Company.findById(company_id);
    if (!company)
      return res.status(404).json({ success: false, message: 'Company not found' });

    const settings = await MonthlySettings.findOne({
      company_id,
      month: currentMonth,
      year: currentYear,
    });

    const filter = { company_id, status: 'approved', role: { $ne: 'super_admin' } };
    if (department && department !== 'all') filter.department = department;

    const employees = await Employee.find(filter).sort({ name: 1 });
    if (employees.length === 0)
      return res.status(404).json({ success: false, message: 'No employees found' });

    const payrollData = [];
    for (const emp of employees) {
      try {
        const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
        if (payroll) {
          payrollData.push(payroll);
        }
      } catch (err) {
        console.error(`Error calculating payroll for employee ${emp._id} (${emp.name}):`, err.message);
      }
    }

    if (payrollData.length === 0) {
      return res.status(404).json({ success: false, message: 'Could not generate payroll data for any employee' });
    }

    const totalSalary = payrollData.reduce((s, p) => s + (p?.monthly_salary || 0), 0);
    const totalEarned = payrollData.reduce((s, p) => s + (p?.earned_salary || p?.net_payable || 0), 0);
    const totalCut = payrollData.reduce((s, p) => s + (p?.total_deduction || 0), 0);
    
    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', {
      month: 'long',
    });
    const companyAddress = getCompanyAddress(company);

    const PAGE_W = 842;
    const PAGE_H = 595;
    const MARGIN = 25;

    const empCount = payrollData.length;

    let rowsPerPage = 28;
    let rowH = 15;
    let cellFS = 8.5;

    if (empCount <= 28) {
      rowsPerPage = 28;
      rowH = 15;
      cellFS = 8.5;
    } else if (empCount <= 64) {
      rowsPerPage = Math.ceil(empCount / 2);
      rowH = 13.2;
      cellFS = 8.0;
    } else {
      rowsPerPage = 28;
      rowH = 14.0;
      cellFS = 8.0;
    }

    const totalPages = Math.ceil(empCount / rowsPerPage) || 1;

    const doc = new PDFDocument({
      size: [PAGE_W, PAGE_H],
      margin: 0,
      autoFirstPage: true,
    });

    const filename = `Payroll_${company.code || 'Company'}_${monthName}_${currentYear}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const colors = {
      primary: '#E8590C',
      dark: '#1A1A2E',
      gray: '#6B7280',
      light: '#F8FAFC',
      success: '#16A34A',
      danger: '#DC2626',
      blue: '#2563EB',
      purple: '#7C3AED',
      amber: '#D97706',
      orange: '#EA580C',
      cyan: '#0891B2',
    };

    const tableLeft = MARGIN;
    const tableWidth = PAGE_W - MARGIN * 2;

    const cols = [
      { key: 'sr',      label: 'Sr',         width: 26,  align: 'left'   },
      { key: 'name',    label: 'Name',       width: 145, align: 'left'   },
      { key: 'present', label: 'Present',    width: 50,  align: 'center' },
      { key: 'late',    label: 'Late',       width: 45,  align: 'center' },
      { key: 'hd',      label: 'HD',         width: 42,  align: 'center' },
      { key: 'leaves',  label: 'Leaves',     width: 48,  align: 'center' },
      { key: 'paidlv',  label: 'Paid Lv',    width: 50,  align: 'center' },
      { key: 'final',   label: 'Final Days', width: 62,  align: 'center' },
      { key: 'pct',     label: '%',          width: 48,  align: 'center' },
      { key: 'salary',  label: 'Salary',     width: 75,  align: 'right'  },
      { key: 'cut',     label: 'Cut',        width: 68,  align: 'right'  },
      { key: 'net',     label: 'Net',        width: 78,  align: 'right'  },
    ];

    const totalColW = cols.reduce((s, c) => s + c.width, 0);
    const scale = tableWidth / totalColW;
    cols.forEach((c) => (c.width = c.width * scale));

    const drawHeader = (pageNum, total) => {
      doc.rect(0, 0, PAGE_W, 5).fill(colors.primary);

      doc
        .fillColor(colors.dark)
        .fontSize(15)
        .font('Helvetica-Bold')
        .text((company.name || 'COMPANY').toUpperCase(), MARGIN, 12, { lineBreak: false });

      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(colors.gray)
        .text(companyAddress, MARGIN, 30, { width: 400, lineBreak: false });

      doc
        .fillColor(colors.primary)
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('PAYROLL REPORT', PAGE_W - 220, 12, { width: 195, align: 'right', lineBreak: false });

      doc
        .fillColor(colors.dark)
        .fontSize(10.5)
        .font('Helvetica-Bold')
        .text(`${monthName} ${currentYear}`, PAGE_W - 220, 28, { width: 195, align: 'right', lineBreak: false });

      doc.roundedRect(PAGE_W - 105, 43, 80, 13, 3).fill(colors.blue);
      doc
        .fillColor('white')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text(`PAGE ${pageNum} OF ${total}`, PAGE_W - 105, 46, { width: 80, align: 'center', lineBreak: false });

      doc.moveTo(MARGIN, 60).lineTo(PAGE_W - MARGIN, 60).strokeColor(colors.primary).lineWidth(1).stroke();
    };

    const drawInfoRow = (y, pageEmployees) => {
      const firstEmp = pageEmployees[0] || {};
      const infoItems = [
        { label: 'Employees: ', value: `${pageEmployees.length} / ${payrollData.length}` },
        { label: 'Total Days: ', value: `${firstEmp.total_working_days || 0}` },
        { label: 'Generated: ', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
      ];

      let infoX = MARGIN;
      infoItems.forEach((item) => {
        doc.fontSize(8.5).fillColor(colors.gray).font('Helvetica').text(item.label, infoX, y, {
          continued: true,
          lineBreak: false,
        });
        doc.fillColor(colors.dark).font('Helvetica-Bold').text(item.value, { lineBreak: false });
        infoX += 240;
      });
    };

    const drawColumnHeader = (y) => {
      const COL_HEADER_H = 20;
      doc.rect(tableLeft, y, tableWidth, COL_HEADER_H).fill(colors.dark);

      let hx = tableLeft;
      const hTextY = y + 5;

      cols.forEach((col) => {
        doc
          .fillColor('white')
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text(col.label, hx + 3, hTextY, {
            width: col.width - 6,
            align: col.align,
            lineBreak: false,
          });
        hx += col.width;
      });
    };

    const drawRows = (pageEmployees, startY, startIdx, rHeight, fSize) => {
      let y = startY;

      pageEmployees.forEach((emp, idx) => {
        const actualIdx = startIdx + idx;

        if (idx % 2 === 0) {
          doc.rect(tableLeft, y, tableWidth, rHeight).fill(colors.light);
        }

        let bgX = tableLeft;
        cols.forEach((c) => {
          if (c.key === 'final') {
            doc.rect(bgX, y, c.width, rHeight).fill('#F5F3FF');
          }
          bgX += c.width;
        });

        const rowData = {
          sr:      `${actualIdx + 1}`,
          name:    emp.name || '-',
          present: `${emp.total_present || 0}`,
          late:    `${emp.late_count || 0}`,
          hd:      `${(emp.half_day_count || 0) + (emp.half_day_leave_count || 0)}`,
          leaves:  `${emp.total_leave_approved || 0}`,
          paidlv:  `${emp.paid_leave_days || 0}`,
          final:   `${emp.final_payable_days || 0}`,
          pct:     `${emp.progress_percent || 0}%`,
          salary:  formatINRPlain(emp.monthly_salary),
          cut:     formatINRPlain(emp.total_deduction),
          net:     formatINRPlain(emp.net_payable),
        };

        let xR = tableLeft;
        const cellY = y + (rHeight - fSize) / 2 - 0.5;

        cols.forEach((col) => {
          const value = rowData[col.key] !== undefined ? rowData[col.key] : '-';
          let textColor = colors.dark;
          let fontStyle = 'Helvetica';

          if (col.key === 'name')    { fontStyle = 'Helvetica-Bold'; }
          if (col.key === 'present') { textColor = colors.success; }
          if (col.key === 'late')    { textColor = (emp.late_count || 0) > 0 ? colors.amber : colors.gray; }
          if (col.key === 'hd')      { textColor = (emp.half_day_count || 0) > 0 ? colors.orange : colors.gray; }
          if (col.key === 'leaves')  { textColor = (emp.total_leave_approved || 0) > 0 ? colors.blue : colors.gray; }
          if (col.key === 'paidlv')  { textColor = (emp.paid_leave_days || 0) > 0 ? colors.cyan : colors.gray; }
          if (col.key === 'final')   { textColor = colors.purple; fontStyle = 'Helvetica-Bold'; }
          if (col.key === 'cut')     { textColor = (emp.total_deduction || 0) > 0 ? colors.danger : colors.gray; }
          if (col.key === 'net')     { textColor = colors.primary; fontStyle = 'Helvetica-Bold'; }
          if (col.key === 'salary')  { fontStyle = 'Helvetica-Bold'; }

          doc
            .fillColor(textColor)
            .fontSize(fSize)
            .font(fontStyle)
            .text(value, xR + 3, cellY, {
              width: col.width - 6,
              align: col.align,
              lineBreak: false,
              ellipsis: true,
            });

          xR += col.width;
        });

        doc
          .moveTo(tableLeft, y + rHeight)
          .lineTo(tableLeft + tableWidth, y + rHeight)
          .strokeColor('#E2E8F0')
          .lineWidth(0.3)
          .stroke();

        y += rHeight;
      });

      return y;
    };

    const drawTotalRow = (y) => {
      const TOTAL_ROW_H = 22;
      doc.rect(tableLeft, y, tableWidth, TOTAL_ROW_H).fill(colors.primary);

      const totalPresent = payrollData.reduce((s, p) => s + (p?.total_present || 0), 0);
      const totalLate    = payrollData.reduce((s, p) => s + (p?.late_count || 0), 0);
      const totalHD      = payrollData.reduce((s, p) => s + ((p?.half_day_count || 0) + (p?.half_day_leave_count || 0)), 0);
      const totalLeaves  = payrollData.reduce((s, p) => s + (p?.total_leave_approved || 0), 0);
      const totalPaidLv  = payrollData.reduce((s, p) => s + (p?.paid_leave_days || 0), 0);

      let xT = tableLeft;
      const totalTextY = y + 6;

      doc.fillColor('white').fontSize(9.5).font('Helvetica-Bold');

      doc.text('GRAND TOTAL', xT + 4, totalTextY, {
        width: cols[0].width + cols[1].width - 8,
        align: 'left',
        lineBreak: false,
      });
      xT += cols[0].width + cols[1].width;

      const totalValues = [
        { val: `${totalPresent}`, idx: 2 },
        { val: `${totalLate}`,    idx: 3 },
        { val: `${totalHD}`,      idx: 4 },
        { val: `${totalLeaves}`,  idx: 5 },
        { val: `${totalPaidLv}`,  idx: 6 },
      ];

      totalValues.forEach(({ val, idx }) => {
        doc.text(val, xT + 3, totalTextY, {
          width: cols[idx].width - 6,
          align: 'center',
          lineBreak: false,
        });
        xT += cols[idx].width;
      });

      xT += cols[7].width + cols[8].width;

      doc.text(formatINRPlain(totalSalary), xT + 3, totalTextY, {
        width: cols[9].width - 6,
        align: 'right',
        lineBreak: false,
      });
      xT += cols[9].width;

      doc.text(formatINRPlain(totalCut), xT + 3, totalTextY, {
        width: cols[10].width - 6,
        align: 'right',
        lineBreak: false,
      });
      xT += cols[10].width;

      doc.text(formatINRPlain(totalEarned), xT + 3, totalTextY, {
        width: cols[11].width - 6,
        align: 'right',
        lineBreak: false,
      });

      return y + TOTAL_ROW_H;
    };

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) {
        doc.addPage({ size: [PAGE_W, PAGE_H], margin: 0 });
      }

      const pageEmployees = payrollData.slice(p * rowsPerPage, (p + 1) * rowsPerPage);

      drawHeader(p + 1, totalPages);
      let y = 68;
      drawInfoRow(y, pageEmployees);
      y += 16;
      drawColumnHeader(y);
      y += 20;
      y = drawRows(pageEmployees, y, p * rowsPerPage, rowH, cellFS);

      if (p === totalPages - 1) {
        y += 4;
        drawTotalRow(y);
      }
    }

    doc.end();
  } catch (error) {
    console.error('downloadPayrollPDF error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'PDF generation failed',
        error: error.message,
      });
    }
  }
};

// ════════════════════════════════════════════
// 2. DOWNLOAD PAYROLL REPORT CSV
// ════════════════════════════════════════════
const downloadPayrollCSV = async (req, res) => {
  try {
    const { company_id, department, month, year } = req.query;

    if (!company_id)
      return res.status(400).json({ success: false, message: 'company_id required' });

    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const company = await Company.findById(company_id);
    if (!company)
      return res.status(404).json({ success: false, message: 'Company not found' });

    const settings = await MonthlySettings.findOne({
      company_id,
      month: currentMonth,
      year: currentYear,
    });

    const filter = { company_id, status: 'approved', role: { $ne: 'super_admin' } };
    if (department && department !== 'all') filter.department = department;

    const employees = await Employee.find(filter).sort({ name: 1 });
    if (employees.length === 0)
      return res.status(404).json({ success: false, message: 'No employees found' });

    const payrollData = [];
    for (const emp of employees) {
      try {
        const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
        if (payroll) {
          payrollData.push(payroll);
        }
      } catch (err) {
        console.error(`Error calculating payroll for employee ${emp._id}:`, err.message);
      }
    }

    if (payrollData.length === 0) {
      return res.status(404).json({ success: false, message: 'Could not generate payroll data' });
    }

    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', {
      month: 'long',
    });

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = [];

    rows.push([`${company.name} - Payroll Report`]);
    rows.push([`${monthName} ${currentYear}`]);
    rows.push([]);

    rows.push([
      'Sr',
      'Name',
      'Present',
      'Late',
      'HD',
      'Leaves',
      'Paid Lv',
      'Carry',
      'Final Days',
      '%',
      'Salary',
      'Cut',
      'Net',
    ]);

    payrollData.forEach((emp, idx) => {
      const totalHD = (emp?.half_day_count || 0) + (emp?.half_day_leave_count || 0);
      const totalLeavesDays = emp?.total_leave_approved || 0;

      rows.push([
        idx + 1,
        emp?.name || '',
        emp?.total_present || 0,
        emp?.late_count || 0,
        totalHD,
        totalLeavesDays,
        emp?.paid_leave_days || 0,
        emp?.leave_closing_balance || 0,
        emp?.final_payable_days || 0,
        `${emp?.progress_percent || 0}%`,
        emp?.monthly_salary || 0,
        emp?.total_deduction || 0,
        emp?.net_payable || 0,
      ]);
    });

    rows.push([]);
    rows.push([
      '',
      'GRAND TOTAL',
      payrollData.reduce((s, p) => s + (p?.total_present || 0), 0),
      payrollData.reduce((s, p) => s + (p?.late_count || 0), 0),
      payrollData.reduce((s, p) => s + ((p?.half_day_count || 0) + (p?.half_day_leave_count || 0)), 0),
      payrollData.reduce((s, p) => s + (p?.total_leave_approved || 0), 0),
      payrollData.reduce((s, p) => s + (p?.paid_leave_days || 0), 0),
      payrollData.reduce((s, p) => s + (p?.leave_closing_balance || 0), 0),
      '',
      '',
      payrollData.reduce((s, p) => s + (p?.monthly_salary || 0), 0),
      payrollData.reduce((s, p) => s + (p?.total_deduction || 0), 0),
      payrollData.reduce((s, p) => s + (p?.net_payable || 0), 0),
    ]);

    const csvContent = rows
      .map(row => row.map(cell => escapeCSV(cell)).join(','))
      .join('\n');

    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    const filename = `Payroll_${company.code || 'Company'}_${monthName}_${currentYear}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvWithBom);

  } catch (error) {
    console.error('downloadPayrollCSV error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'CSV generation failed',
        error: error.message,
      });
    }
  }
};

// ════════════════════════════════════════════
// 3. GET DETAILED EMPLOYEE GPS AUDIT DATA (JSON)
// ════════════════════════════════════════════
const getEmployeeDetailedReportData = async (req, res) => {
  try {
    const employeeId = req.query.employee_id || req.query.employeeId;
    const fromDateStr = req.query.start_date || req.query.fromDate || req.query.from_date;
    const toDateStr = req.query.end_date || req.query.toDate || req.query.to_date;

    if (!employeeId || !fromDateStr || !toDateStr) {
      return res.status(400).json({ success: false, message: 'Missing parameters: employee_id, start_date, end_date.' });
    }

    const employee = await Employee.findById(employeeId).populate('company_id').lean();
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

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

    filteredAttendance.sort((a, b) => {
      const dA = parseToDateObj(a.date);
      const dB = parseToDateObj(b.date);
      return (dB || 0) - (dA || 0);
    });

    let lateCount = 0;
    let outOfRangeCount = 0;
    let suspiciousCount = 0;

    const formattedRecords = filteredAttendance.map(rec => {
      const isLate = rec.is_late === true || 
                     rec.daily_status?.toLowerCase() === 'late' || 
                     rec.status?.toLowerCase() === 'late';
      if (isLate) lateCount++;

      const inIsOut = rec.in_location_status === 'out-of-range' || rec.in_location_status?.toLowerCase().includes('out');
      const outIsOut = rec.out_location_status === 'out-of-range' || rec.out_location_status?.toLowerCase().includes('out');
      const isOutOfRange = inIsOut || outIsOut;
      if (isOutOfRange) outOfRangeCount++;

      const isFlagged = rec.flagged === true || rec.status?.toLowerCase() === 'flagged' || rec.daily_status?.toLowerCase() === 'flagged';
      if (isFlagged) suspiciousCount++;

      const inLocStatusFormatted = formatLocationStatusStr(rec.in_location_status, rec.in_site, rec.in_address, rec.in_distance);
      const outLocStatusFormatted = formatLocationStatusStr(rec.out_location_status, rec.out_site, rec.out_address, rec.out_distance);

      let displayStatus = rec.daily_status || rec.status || 'present';
      if (isFlagged) displayStatus = 'flagged';
      else if (isLate) displayStatus = 'late';
      else if (displayStatus === 'present') displayStatus = 'present';

      return {
        _id: rec._id ? String(rec._id) : Math.random().toString(),
        date: rec.date || '—',
        in_time: rec.in_time || '—',
        out_time: rec.out_time || '—',
        in_latitude: rec.in_latitude || null,
        in_longitude: rec.in_longitude || null,
        out_latitude: rec.out_latitude || null,
        out_longitude: rec.out_longitude || null,
        in_location_status: inLocStatusFormatted,
        out_location_status: outLocStatusFormatted,
        in_status: displayStatus,
        is_late: isLate,
        is_out_of_range: isOutOfRange,
        flagged: isFlagged
      };
    });

    const companyName = employee.company_id?.name || employee.company_id?.companyName || employee.company_name || 'N/A';

    return res.status(200).json({
      success: true,
      data: {
        employee: {
          name: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee',
          emp_code: employee.emp_code || employee.code || 'N/A',
          department: employee.department || 'N/A',
          company_name: companyName
        },
        period: {
          start_date: fromDateStr,
          end_date: toDateStr
        },
        summary: {
          total_present: filteredAttendance.length,
          late_count: lateCount,
          out_of_range_punches: outOfRangeCount,
          suspicious_count: suspiciousCount
        },
        records: formattedRecords
      }
    });

  } catch (error) {
    console.error('Error in getEmployeeDetailedReportData:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// ════════════════════════════════════════════
// 4. DOWNLOAD/VIEW DETAILED GPS AUDIT PDF (PORTRAIT)
// ════════════════════════════════════════════
const downloadEmployeeDetailedReportPDF = async (req, res) => {
  try {
    const employeeId = req.query.employee_id || req.query.employeeId;
    const fromDateStr = req.query.start_date || req.query.fromDate || req.query.from_date;
    const toDateStr = req.query.end_date || req.query.toDate || req.query.to_date;
    const view_mode = req.query.view_mode;

    if (!employeeId || !fromDateStr || !toDateStr) {
      return res.status(400).json({ success: false, message: 'Missing parameters.' });
    }

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

    filteredAttendance.sort((a, b) => {
      const dA = parseToDateObj(a.date);
      const dB = parseToDateObj(b.date);
      return (dB || 0) - (dA || 0);
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    const empCode = employee.emp_code || employee.code || 'EMP';
    if (view_mode === 'inline') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=GPS_Audit_${empCode}.pdf`);
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=GPS_Audit_${empCode}.pdf`);
    }

    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Employee GPS & Movement Audit Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Period: ${fromDateStr} to ${toDateStr}`, { align: 'center', color: '#555555' });
    doc.moveDown(1.5);

    let y = 75;
    doc.rect(30, y, 535, 55).fillAndStroke('#f8fafc', '#e2e8f0');
    
    const empName = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee';
    const compName = employee.company_id?.name || employee.company_id?.companyName || employee.company_name || 'N/A';

    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(empName, 40, y + 10);
    doc.fontSize(9).font('Helvetica')
       .text(`Emp Code: ${empCode}`, 40, y + 28)
       .text(`Department: ${employee.department || 'N/A'}`, 200, y + 28)
       .text(`Company: ${compName}`, 360, y + 28);

    y += 70;

    let lateCount = 0, outOfRangeCount = 0, suspiciousCount = 0;
    const logs = filteredAttendance.map(rec => {
      const isLate = rec.is_late === true || rec.daily_status?.toLowerCase() === 'late' || rec.status?.toLowerCase() === 'late';
      if (isLate) lateCount++;

      const inIsOut = rec.in_location_status === 'out-of-range' || rec.in_location_status?.toLowerCase().includes('out');
      const outIsOut = rec.out_location_status === 'out-of-range' || rec.out_location_status?.toLowerCase().includes('out');
      if (inIsOut || outIsOut) outOfRangeCount++;

      const isFlagged = rec.flagged === true || rec.status?.toLowerCase() === 'flagged' || rec.daily_status?.toLowerCase() === 'flagged';
      if (isFlagged) suspiciousCount++;

      const rawInLocText = formatLocationStatusStr(rec.in_location_status, rec.in_site, rec.in_address, rec.in_distance);
      const rawOutLocText = formatLocationStatusStr(rec.out_location_status, rec.out_site, rec.out_address, rec.out_distance);

      let displayStatus = rec.daily_status || rec.status || 'Present';
      if (isFlagged) displayStatus = 'Flagged';
      else if (isLate) displayStatus = 'Late';
      else if (displayStatus === 'present') displayStatus = 'Present';

      return {
        date: rec.date,
        punchIn: rec.in_time || '—',
        inLocText: sanitizePdfText(rawInLocText),
        punchOut: rec.out_time || '—',
        outLocText: sanitizePdfText(rawOutLocText),
        isOutOfRange: inIsOut || outIsOut,
        status: displayStatus
      };
    });

    const boxWidth = 125;
    const boxY = y;
    
    doc.rect(30, boxY, boxWidth, 40).fillAndStroke('#f0fdf4', '#bbf7d0');
    doc.fillColor('#166534').fontSize(9).font('Helvetica-Bold').text('TOTAL PRESENT', 35, boxY + 8);
    doc.fontSize(14).text(`${logs.length} Days`, 35, boxY + 22);

    doc.rect(165, boxY, boxWidth, 40).fillAndStroke('#fffbeb', '#fde68a');
    doc.fillColor('#b45309').fontSize(9).font('Helvetica-Bold').text('LATE ARRIVALS', 170, boxY + 8);
    doc.fontSize(14).text(`${lateCount}`, 170, boxY + 22);

    doc.rect(300, boxY, boxWidth, 40).fillAndStroke('#fef2f2', '#fecaca');
    doc.fillColor('#b91c1c').fontSize(9).font('Helvetica-Bold').text('OUT OF RANGE', 305, boxY + 8);
    doc.fontSize(14).text(`${outOfRangeCount}`, 305, boxY + 22);

    doc.rect(435, boxY, boxWidth + 5, 40).fillAndStroke('#fdf2f8', '#fbcfe8');
    doc.fillColor('#be185d').fontSize(9).font('Helvetica-Bold').text('SUSPICIOUS (FLAGS)', 440, boxY + 8);
    doc.fontSize(14).text(`${suspiciousCount}`, 440, boxY + 22);

    y = boxY + 60;

    const cols = { date: 35, inTime: 95, inLoc: 150, outTime: 295, outLoc: 350, status: 495 };
    const widths = { date: 55, inTime: 50, inLoc: 135, outTime: 50, outLoc: 135, status: 65 };

    doc.rect(30, y, 535, 20).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('DATE', cols.date, y + 6, { width: widths.date });
    doc.text('IN TIME', cols.inTime, y + 6, { width: widths.inTime });
    doc.text('IN LOCATION', cols.inLoc, y + 6, { width: widths.inLoc });
    doc.text('OUT TIME', cols.outTime, y + 6, { width: widths.outTime });
    doc.text('OUT LOCATION', cols.outLoc, y + 6, { width: widths.outLoc });
    doc.text('STATUS', cols.status, y + 6, { width: widths.status, align: 'center' });

    y += 25;

    if (logs.length === 0) {
      doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('No attendance records found for this period.', 35, y);
    } else {
      logs.forEach(log => {
        doc.font('Helvetica').fontSize(8);

        const inLocHeight = doc.heightOfString(log.inLocText, { width: widths.inLoc });
        const outLocHeight = doc.heightOfString(log.outLocText, { width: widths.outLoc });
        const rowHeight = Math.max(inLocHeight, outLocHeight, 14) + 8;

        if (y + rowHeight > 770) {
          doc.addPage();
          y = 40;
          doc.rect(30, y, 535, 20).fill('#1e293b');
          doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
          doc.text('DATE', cols.date, y + 6, { width: widths.date });
          doc.text('IN TIME', cols.inTime, y + 6, { width: widths.inTime });
          doc.text('IN LOCATION', cols.inLoc, y + 6, { width: widths.inLoc });
          doc.text('OUT TIME', cols.outTime, y + 6, { width: widths.outTime });
          doc.text('OUT LOCATION', cols.outLoc, y + 6, { width: widths.outLoc });
          doc.text('STATUS', cols.status, y + 6, { width: widths.status, align: 'center' });
          y += 25;
          doc.font('Helvetica').fontSize(8);
        }

        doc.fillColor('#0f172a').font('Helvetica-Bold').text(log.date, cols.date, y, { width: widths.date });
        doc.font('Helvetica').text(log.punchIn, cols.inTime, y, { width: widths.inTime });
        
        doc.fillColor(log.inLocText.includes('On Site') ? '#166534' : log.isOutOfRange ? '#b91c1c' : '#475569');
        doc.text(log.inLocText, cols.inLoc, y, { width: widths.inLoc });

        doc.fillColor('#0f172a').text(log.punchOut, cols.outTime, y, { width: widths.outTime });
        
        doc.fillColor(log.outLocText.includes('On Site') ? '#166534' : log.isOutOfRange ? '#b91c1c' : '#475569');
        doc.text(log.outLocText, cols.outLoc, y, { width: widths.outLoc });

        const statusText = String(log.status).charAt(0).toUpperCase() + String(log.status).slice(1);
        if (statusText.toLowerCase() === 'flagged') doc.fillColor('#b45309').font('Helvetica-Bold');
        else if (statusText.toLowerCase() === 'late') doc.fillColor('#b91c1c').font('Helvetica-Bold');
        else doc.fillColor('#166534').font('Helvetica-Bold');
        
        doc.text(statusText, cols.status, y, { width: widths.status, align: 'center' });

        doc.moveTo(30, y + rowHeight - 3).lineTo(565, y + rowHeight - 3).strokeColor('#e2e8f0').stroke();
        y += rowHeight;
      });
    }

    doc.end();
  } catch (error) {
    console.error('PDF Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  downloadPayrollPDF,
  downloadPayrollCSV,
  getEmployeeDetailedReportData,
  downloadEmployeeDetailedReportPDF
};
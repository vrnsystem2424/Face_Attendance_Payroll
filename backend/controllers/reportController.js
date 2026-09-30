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

//     // 🎯 EXACT RESPONSE STRUCTURE REQUIRED BY REDUX SLICE (response.data.data)
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

//       const inLocText = formatLocationStatusStr(rec.in_location_status, rec.in_site, rec.in_address, rec.in_distance);
//       const outLocText = formatLocationStatusStr(rec.out_location_status, rec.out_site, rec.out_address, rec.out_distance);

//       let displayStatus = rec.daily_status || rec.status || 'Present';
//       if (isFlagged) displayStatus = 'Flagged';
//       else if (isLate) displayStatus = 'Late';
//       else if (displayStatus === 'present') displayStatus = 'Present';

//       return {
//         date: rec.date,
//         punchIn: rec.in_time || '—',
//         inLocText,
//         punchOut: rec.out_time || '—',
//         outLocText,
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

//     // Table Headers
//     const cols = { date: 35, inTime: 95, inLoc: 160, outTime: 310, outLoc: 375, status: 520 };
//     doc.rect(30, y, 535, 20).fill('#1e293b');
//     doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
//     doc.text('DATE', cols.date, y + 6);
//     doc.text('IN TIME', cols.inTime, y + 6);
//     doc.text('IN LOCATION', cols.inLoc, y + 6);
//     doc.text('OUT TIME', cols.outTime, y + 6);
//     doc.text('OUT LOCATION', cols.outLoc, y + 6);
//     doc.text('STATUS', cols.status, y + 6);

//     y += 25;
//     doc.font('Helvetica').fontSize(8);

//     if (logs.length === 0) {
//       doc.fillColor('#64748b').text('No attendance records found for this period.', 35, y);
//     } else {
//       logs.forEach(log => {
//         if (y > 770) {
//           doc.addPage();
//           y = 50;
//           doc.rect(30, y, 535, 20).fill('#1e293b');
//           doc.fillColor('#ffffff').font('Helvetica-Bold');
//           doc.text('DATE', cols.date, y + 6);
//           doc.text('IN TIME', cols.inTime, y + 6);
//           doc.text('IN LOCATION', cols.inLoc, y + 6);
//           doc.text('OUT TIME', cols.outTime, y + 6);
//           doc.text('OUT LOCATION', cols.outLoc, y + 6);
//           doc.text('STATUS', cols.status, y + 6);
//           y += 25;
//           doc.font('Helvetica');
//         }

//         doc.fillColor('#0f172a').font('Helvetica-Bold').text(log.date, cols.date, y);
//         doc.font('Helvetica').text(log.punchIn, cols.inTime, y);
        
//         doc.fillColor(log.inLocText.includes('On Site') ? '#166534' : log.isOutOfRange ? '#b91c1c' : '#475569');
//         doc.text(log.inLocText, cols.inLoc, y, { width: 140, height: 20, ellipsis: true });

//         doc.fillColor('#0f172a').text(log.punchOut, cols.outTime, y);
        
//         doc.fillColor(log.outLocText.includes('On Site') ? '#166534' : log.isOutOfRange ? '#b91c1c' : '#475569');
//         doc.text(log.outLocText, cols.outLoc, y, { width: 140, height: 20, ellipsis: true });

//         const statusText = String(log.status).charAt(0).toUpperCase() + String(log.status).slice(1);
//         if (statusText.toLowerCase() === 'flagged') doc.fillColor('#b45309').font('Helvetica-Bold');
//         else if (statusText.toLowerCase() === 'late') doc.fillColor('#b91c1c').font('Helvetica-Bold');
//         else doc.fillColor('#166534').font('Helvetica-Bold');
        
//         doc.text(statusText, cols.status, y);

//         doc.moveTo(30, y + 15).lineTo(565, y + 15).strokeColor('#e2e8f0').stroke();
//         y += 22;
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
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// Helper: Convert mixed date formats ("18/9/2026", "2026-09-01") to standard Date Object
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

// Helper: Format Location Status (e.g. "• On Site (48m)" or Site Name)
const formatLocationStatusStr = (locStatus, site, address, distance) => {
  const distVal = (distance !== undefined && distance !== null && !isNaN(distance) && distance > 0) ? Math.round(distance) : null;
  const distSuffix = distVal ? ` (${distVal}m)` : '';
  const statusLower = String(locStatus || '').toLowerCase();

  // If explicit site or office name exists
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

// Helper: Sanitize text for PDFKit (Removes non-ASCII / Hindi script that corrupts PDF text)
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

// @desc    Download Payroll Report PDF
const downloadPayrollPDF = async (req, res) => {
  try {
    const { company, month } = req.query;
    let query = company ? { company_id: company } : {};
    const employees = await Employee.find(query).populate('company_id').lean();
    
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Payroll_Report_${month || 'All'}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Payroll & Attendance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Month: ${month || 'N/A'}`, { align: 'center' });
    doc.moveDown(2);

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download Payroll Report CSV
const downloadPayrollCSV = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Payroll_Report.csv`);
    res.write('Emp ID,Name,Role\n');
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Detailed Employee GPS Audit Data (JSON)
// @route   GET /api/super-admin/employee-report-data
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
      // Late Check
      const isLate = rec.is_late === true || 
                     rec.daily_status?.toLowerCase() === 'late' || 
                     rec.status?.toLowerCase() === 'late';
      if (isLate) lateCount++;

      // Out of Range Check
      const inIsOut = rec.in_location_status === 'out-of-range' || rec.in_location_status?.toLowerCase().includes('out');
      const outIsOut = rec.out_location_status === 'out-of-range' || rec.out_location_status?.toLowerCase().includes('out');
      const isOutOfRange = inIsOut || outIsOut;
      if (isOutOfRange) outOfRangeCount++;

      // Flagged / Suspicious Check
      const isFlagged = rec.flagged === true || rec.status?.toLowerCase() === 'flagged' || rec.daily_status?.toLowerCase() === 'flagged';
      if (isFlagged) suspiciousCount++;

      // Format Location Texts
      const inLocStatusFormatted = formatLocationStatusStr(rec.in_location_status, rec.in_site, rec.in_address, rec.in_distance);
      const outLocStatusFormatted = formatLocationStatusStr(rec.out_location_status, rec.out_site, rec.out_address, rec.out_distance);

      // Status Badges
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

// @desc    Download/View Detailed Employee GPS Audit PDF
// @route   GET /api/super-admin/employee-report-pdf
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

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('Employee GPS & Movement Audit Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Period: ${fromDateStr} to ${toDateStr}`, { align: 'center', color: '#555555' });
    doc.moveDown(1.5);

    // Employee Meta Box
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

    // Summary Widgets
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

    // Strict Column Coordinates and Widths to prevent overlaps
    const cols = { date: 35, inTime: 95, inLoc: 150, outTime: 295, outLoc: 350, status: 495 };
    const widths = { date: 55, inTime: 50, inLoc: 135, outTime: 50, outLoc: 135, status: 65 };

    // Draw Table Header
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

        // Calculate dynamic height required for long addresses
        const inLocHeight = doc.heightOfString(log.inLocText, { width: widths.inLoc });
        const outLocHeight = doc.heightOfString(log.outLocText, { width: widths.outLoc });
        const rowHeight = Math.max(inLocHeight, outLocHeight, 14) + 8;

        // Page break check
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

        // Render Row Data
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

        // Divider Line
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
// // controllers/reportController.js

// const PDFDocument = require('pdfkit');
// const { calculateEmployeePayroll } = require('./payrollController');
// const Employee = require('../models/Employee');
// const Company = require('../models/Company');
// const MonthlySettings = require('../models/MonthlySettings');

// // ════════════════════════════════════════════
// // HELPER: Format number as Indian currency
// // ════════════════════════════════════════════
// const formatINR = (num) => {
//   if (!num && num !== 0) return '0';
//   return '₹' + Number(num).toLocaleString('en-IN');
// };

// const formatINRPlain = (num) => {
//   if (!num && num !== 0) return '0';
//   return Number(num).toLocaleString('en-IN');
// };

// // ════════════════════════════════════════════
// // DOWNLOAD PAYROLL PDF
// // ════════════════════════════════════════════
// const downloadPayrollPDF = async (req, res) => {
//   try {
//     const { company_id, department, month, year } = req.query;

//     if (!company_id) {
//       return res.status(400).json({ success: false, message: 'company_id required' });
//     }

//     const currentMonth = parseInt(month) || new Date().getMonth() + 1;
//     const currentYear = parseInt(year) || new Date().getFullYear();

//     const company = await Company.findById(company_id);
//     if (!company) {
//       return res.status(404).json({ success: false, message: 'Company not found' });
//     }

//     const settings = await MonthlySettings.findOne({
//       company_id,
//       month: currentMonth,
//       year: currentYear,
//     });

//     const filter = {
//       company_id,
//       status: 'approved',
//       role: { $ne: 'super_admin' },
//     };
//     if (department && department !== 'all') {
//       filter.department = department;
//     }

//     const employees = await Employee.find(filter).sort({ name: 1 });

//     if (employees.length === 0) {
//       return res.status(404).json({ success: false, message: 'No employees found' });
//     }

//     // Calculate payroll
//     const payrollData = [];
//     for (const emp of employees) {
//       const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
//       payrollData.push(payroll);
//     }

//     // Summary
//     const totalSalary = payrollData.reduce((s, p) => s + p.monthly_salary, 0);
//     const totalEarned = payrollData.reduce((s, p) => s + p.earned_salary, 0);
//     const totalDeduction = payrollData.reduce((s, p) => s + p.total_deduction, 0);
//     const totalNet = payrollData.reduce((s, p) => s + p.net_payable, 0);

//     const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' });

//     // ════════════════════════════════════════════
//     // CREATE PDF
//     // ════════════════════════════════════════════
//     const doc = new PDFDocument({
//       size: 'A4',
//       layout: 'landscape',
//       margin: 30,
//       info: {
//         Title: `${company.name} Payroll - ${monthName} ${currentYear}`,
//         Author: 'Attendance System',
//       },
//     });

//     // Set response headers
//     const filename = `Payroll_${company.code}_${monthName}_${currentYear}.pdf`;
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

//     // Pipe PDF to response
//     doc.pipe(res);

//     // ════════════════════════════════════════════
//     // HEADER SECTION
//     // ════════════════════════════════════════════
//     const colors = {
//       primary: '#E8590C',
//       dark: '#1A1A2E',
//       gray: '#6B7280',
//       light: '#F3F4F6',
//       success: '#16A34A',
//       danger: '#DC2626',
//     };

//     // Top orange band
//     doc.rect(0, 0, doc.page.width, 8).fill(colors.primary);

//     // Company name (big)
//     doc.fillColor(colors.dark)
//        .fontSize(22)
//        .font('Helvetica-Bold')
//        .text(company.name.toUpperCase(), 30, 25);

//     // Company address
//     if (company.address) {
//       doc.fontSize(9)
//          .font('Helvetica')
//          .fillColor(colors.gray)
//          .text(company.address, 30, 52);
//     }

//     // Report title (right side)
//     doc.fillColor(colors.primary)
//        .fontSize(14)
//        .font('Helvetica-Bold')
//        .text('PAYROLL REPORT', doc.page.width - 200, 25, { width: 170, align: 'right' });

//     doc.fillColor(colors.dark)
//        .fontSize(11)
//        .font('Helvetica-Bold')
//        .text(`${monthName} ${currentYear}`, doc.page.width - 200, 45, { width: 170, align: 'right' });

//     doc.fontSize(8)
//        .font('Helvetica')
//        .fillColor(colors.gray)
//        .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
//              doc.page.width - 200, 62, { width: 170, align: 'right' });

//     // Separator line
//     doc.moveTo(30, 80).lineTo(doc.page.width - 30, 80).strokeColor(colors.primary).lineWidth(1).stroke();

//     // ════════════════════════════════════════════
//     // INFO ROW (Department + Employees count)
//     // ════════════════════════════════════════════
//     let y = 90;
//     doc.fontSize(9).font('Helvetica').fillColor(colors.gray);
//     doc.text(`Department: `, 30, y, { continued: true })
//        .fillColor(colors.dark).font('Helvetica-Bold').text(department && department !== 'all' ? department : 'All Departments');

//     doc.fillColor(colors.gray).font('Helvetica')
//        .text(`Total Employees: `, 250, y, { continued: true })
//        .fillColor(colors.dark).font('Helvetica-Bold').text(`${payrollData.length}`);

//     doc.fillColor(colors.gray).font('Helvetica')
//        .text(`Working Days: `, 400, y, { continued: true })
//        .fillColor(colors.dark).font('Helvetica-Bold').text(`${payrollData[0]?.working_days || 0}`);

//     doc.fillColor(colors.gray).font('Helvetica')
//        .text(`Required Hours: `, 530, y, { continued: true })
//        .fillColor(colors.dark).font('Helvetica-Bold').text(`${payrollData[0]?.required_hours || 0}h`);

//     y += 25;

//     // ════════════════════════════════════════════
//     // TABLE
//     // ════════════════════════════════════════════
//     const tableTop = y;
//     const tableLeft = 30;
//     const tableWidth = doc.page.width - 60;

//     // Column widths (sum = tableWidth)
//     const cols = {
//       sr: 25,
//       code: 60,
//       name: 110,
//       dept: 75,
//       present: 45,
//       absent: 40,
//       leave: 45,
//       hours: 60,
//       salary: 70,
//       earned: 70,
//       deduct: 65,
//       net: 70,
//     };

//     // Table header bg
//     doc.rect(tableLeft, tableTop, tableWidth, 22).fill(colors.dark);

//     // Header text
//     doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
//     let x = tableLeft + 5;
//     const headerY = tableTop + 7;

//     doc.text('Sr', x, headerY, { width: cols.sr });            x += cols.sr;
//     doc.text('Emp Code', x, headerY, { width: cols.code });    x += cols.code;
//     doc.text('Name', x, headerY, { width: cols.name });        x += cols.name;
//     doc.text('Department', x, headerY, { width: cols.dept });  x += cols.dept;
//     doc.text('Present', x, headerY, { width: cols.present, align: 'center' }); x += cols.present;
//     doc.text('Absent', x, headerY, { width: cols.absent, align: 'center' });   x += cols.absent;
//     doc.text('Leave', x, headerY, { width: cols.leave, align: 'center' });     x += cols.leave;
//     doc.text('Worked Hrs', x, headerY, { width: cols.hours, align: 'center' }); x += cols.hours;
//     doc.text('Salary', x, headerY, { width: cols.salary, align: 'right' });    x += cols.salary;
//     doc.text('Earned', x, headerY, { width: cols.earned, align: 'right' });    x += cols.earned;
//     doc.text('Deduct', x, headerY, { width: cols.deduct, align: 'right' });    x += cols.deduct;
//     doc.text('Net Pay', x, headerY, { width: cols.net, align: 'right' });

//     let rowY = tableTop + 22;

//     // Table rows
//     payrollData.forEach((emp, idx) => {
//       // Check if new page needed
//       if (rowY > doc.page.height - 100) {
//         doc.addPage();
//         rowY = 30;

//         // Re-draw header on new page
//         doc.rect(tableLeft, rowY, tableWidth, 22).fill(colors.dark);
//         doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
//         let xH = tableLeft + 5;
//         const hY = rowY + 7;
//         doc.text('Sr', xH, hY, { width: cols.sr });            xH += cols.sr;
//         doc.text('Emp Code', xH, hY, { width: cols.code });    xH += cols.code;
//         doc.text('Name', xH, hY, { width: cols.name });        xH += cols.name;
//         doc.text('Department', xH, hY, { width: cols.dept });  xH += cols.dept;
//         doc.text('Present', xH, hY, { width: cols.present, align: 'center' }); xH += cols.present;
//         doc.text('Absent', xH, hY, { width: cols.absent, align: 'center' });   xH += cols.absent;
//         doc.text('Leave', xH, hY, { width: cols.leave, align: 'center' });     xH += cols.leave;
//         doc.text('Worked Hrs', xH, hY, { width: cols.hours, align: 'center' }); xH += cols.hours;
//         doc.text('Salary', xH, hY, { width: cols.salary, align: 'right' });    xH += cols.salary;
//         doc.text('Earned', xH, hY, { width: cols.earned, align: 'right' });    xH += cols.earned;
//         doc.text('Deduct', xH, hY, { width: cols.deduct, align: 'right' });    xH += cols.deduct;
//         doc.text('Net Pay', xH, hY, { width: cols.net, align: 'right' });
//         rowY += 22;
//       }

//       // Alternate row color
//       if (idx % 2 === 0) {
//         doc.rect(tableLeft, rowY, tableWidth, 20).fill(colors.light);
//       }

//       // Row text
//       doc.fillColor(colors.dark).fontSize(8).font('Helvetica');
//       let xR = tableLeft + 5;
//       const cellY = rowY + 6;

//       doc.text(`${idx + 1}`, xR, cellY, { width: cols.sr });
//       xR += cols.sr;

//       doc.font('Helvetica-Bold').text(emp.emp_code || '-', xR, cellY, { width: cols.code });
//       xR += cols.code;

//       doc.font('Helvetica').text(emp.name || '-', xR, cellY, { width: cols.name, ellipsis: true });
//       xR += cols.name;

//       doc.fillColor(colors.gray).text(emp.department || '-', xR, cellY, { width: cols.dept, ellipsis: true });
//       xR += cols.dept;

//       doc.fillColor(colors.success).text(`${emp.present_days}`, xR, cellY, { width: cols.present, align: 'center' });
//       xR += cols.present;

//       doc.fillColor(colors.danger).text(`${emp.absent_days}`, xR, cellY, { width: cols.absent, align: 'center' });
//       xR += cols.absent;

//       doc.fillColor(colors.dark).text(`${emp.paid_leave_days + emp.unpaid_leave_days}`, xR, cellY, { width: cols.leave, align: 'center' });
//       xR += cols.leave;

//       doc.text(emp.worked_hours, xR, cellY, { width: cols.hours, align: 'center' });
//       xR += cols.hours;

//       doc.text(formatINRPlain(emp.monthly_salary), xR, cellY, { width: cols.salary, align: 'right' });
//       xR += cols.salary;

//       doc.fillColor(colors.success).text(formatINRPlain(emp.earned_salary), xR, cellY, { width: cols.earned, align: 'right' });
//       xR += cols.earned;

//       doc.fillColor(colors.danger).text(formatINRPlain(emp.total_deduction), xR, cellY, { width: cols.deduct, align: 'right' });
//       xR += cols.deduct;

//       doc.fillColor(colors.dark).font('Helvetica-Bold').text(formatINRPlain(emp.net_payable), xR, cellY, { width: cols.net, align: 'right' });

//       rowY += 20;
//     });

//     // ════════════════════════════════════════════
//     // TOTAL ROW
//     // ════════════════════════════════════════════
//     if (rowY > doc.page.height - 80) {
//       doc.addPage();
//       rowY = 30;
//     }

//     doc.rect(tableLeft, rowY, tableWidth, 24).fill(colors.primary);
//     doc.fillColor('white').fontSize(9).font('Helvetica-Bold');

//     let xT = tableLeft + 5;
//     const totalY = rowY + 8;

//     doc.text('TOTAL', xT, totalY, { width: cols.sr + cols.code + cols.name + cols.dept + cols.present + cols.absent + cols.leave + cols.hours });
//     xT += cols.sr + cols.code + cols.name + cols.dept + cols.present + cols.absent + cols.leave + cols.hours;

//     doc.text(formatINRPlain(totalSalary), xT, totalY, { width: cols.salary, align: 'right' });
//     xT += cols.salary;

//     doc.text(formatINRPlain(totalEarned), xT, totalY, { width: cols.earned, align: 'right' });
//     xT += cols.earned;

//     doc.text(formatINRPlain(totalDeduction), xT, totalY, { width: cols.deduct, align: 'right' });
//     xT += cols.deduct;

//     doc.text(formatINRPlain(totalNet), xT, totalY, { width: cols.net, align: 'right' });

//     rowY += 30;

//     // ════════════════════════════════════════════
//     // SUMMARY BOX
//     // ════════════════════════════════════════════
//     if (rowY > doc.page.height - 120) {
//       doc.addPage();
//       rowY = 30;
//     }

//     rowY += 10;
//     doc.rect(tableLeft, rowY, tableWidth, 70).fillAndStroke(colors.light, colors.gray);

//     doc.fillColor(colors.dark).fontSize(11).font('Helvetica-Bold')
//        .text('PAYROLL SUMMARY', tableLeft + 15, rowY + 12);

//     const sumY = rowY + 35;
//     const sumColW = (tableWidth - 30) / 4;

//     // Total Salary
//     doc.fontSize(9).fillColor(colors.gray).font('Helvetica')
//        .text('Total Salary', tableLeft + 15, sumY);
//     doc.fontSize(13).fillColor(colors.dark).font('Helvetica-Bold')
//        .text(formatINR(totalSalary), tableLeft + 15, sumY + 12);

//     // Total Earned
//     doc.fontSize(9).fillColor(colors.gray).font('Helvetica')
//        .text('Total Earned', tableLeft + 15 + sumColW, sumY);
//     doc.fontSize(13).fillColor(colors.success).font('Helvetica-Bold')
//        .text(formatINR(totalEarned), tableLeft + 15 + sumColW, sumY + 12);

//     // Total Deduction
//     doc.fontSize(9).fillColor(colors.gray).font('Helvetica')
//        .text('Total Deduction', tableLeft + 15 + sumColW * 2, sumY);
//     doc.fontSize(13).fillColor(colors.danger).font('Helvetica-Bold')
//        .text(formatINR(totalDeduction), tableLeft + 15 + sumColW * 2, sumY + 12);

//     // Net Payable
//     doc.fontSize(9).fillColor(colors.gray).font('Helvetica')
//        .text('NET PAYABLE', tableLeft + 15 + sumColW * 3, sumY);
//     doc.fontSize(14).fillColor(colors.primary).font('Helvetica-Bold')
//        .text(formatINR(totalNet), tableLeft + 15 + sumColW * 3, sumY + 12);

//     // ════════════════════════════════════════════
//     // FOOTER
//     // ════════════════════════════════════════════
//     const footerY = doc.page.height - 30;
//     doc.fontSize(7).fillColor(colors.gray).font('Helvetica')
//        .text(`${company.name} • Payroll Report • ${monthName} ${currentYear}`, 30, footerY,
//              { width: doc.page.width - 60, align: 'center' });

//     doc.text(`Generated by Attendance System on ${new Date().toLocaleString('en-IN')}`, 30, footerY + 10,
//              { width: doc.page.width - 60, align: 'center' });

//     // Finalize PDF
//     doc.end();

//   } catch (error) {
//     console.error('downloadPayrollPDF error:', error);
//     if (!res.headersSent) {
//       return res.status(500).json({
//         success: false,
//         message: 'PDF generation failed',
//         error: error.message,
//       });
//     }
//   }
// };

// module.exports = {
//   downloadPayrollPDF,
// };







// controllers/reportController.js

const PDFDocument = require('pdfkit');
const { calculateEmployeePayroll } = require('./payrollController');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const MonthlySettings = require('../models/MonthlySettings');

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════
const formatINR = (num) => {
  if (!num && num !== 0) return '0';
  return 'Rs.' + Number(num).toLocaleString('en-IN');
};

const formatINRPlain = (num) => {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString('en-IN');
};

// ════════════════════════════════════════════
// DOWNLOAD PAYROLL PDF (DUAL METHOD)
// ════════════════════════════════════════════
const downloadPayrollPDF = async (req, res) => {
  try {
    const { company_id, department, month, year, calc_method = 'hours' } = req.query;

    if (!company_id) {
      return res.status(400).json({ success: false, message: 'company_id required' });
    }

    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();
    const method = ['hours', 'days', 'both'].includes(calc_method) ? calc_method : 'hours';

    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const settings = await MonthlySettings.findOne({
      company_id,
      month: currentMonth,
      year: currentYear,
    });

    const filter = {
      company_id,
      status: 'approved',
      role: { $ne: 'super_admin' },
    };
    if (department && department !== 'all') {
      filter.department = department;
    }

    const employees = await Employee.find(filter).sort({ name: 1 });

    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'No employees found' });
    }

    // Calculate payroll
    const payrollData = [];
    for (const emp of employees) {
      const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
      payrollData.push(payroll);
    }

    // ═══ TOTALS based on method ═══
    const totalSalary = payrollData.reduce((s, p) => s + p.monthly_salary, 0);
    const totalEarnedHours = payrollData.reduce((s, p) => s + p.hours_based.earned, 0);
    const totalDeductHours = payrollData.reduce((s, p) => s + p.hours_based.deduction, 0);
    const totalEarnedDays = payrollData.reduce((s, p) => s + p.days_based.earned, 0);
    const totalDeductDays = payrollData.reduce((s, p) => s + p.days_based.deduction, 0);

    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' });

    // ════════════════════════════════════════════
    // CREATE PDF — A4 LANDSCAPE
    // ════════════════════════════════════════════
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 20,
      info: {
        Title: `${company.name} Payroll - ${monthName} ${currentYear}`,
        Author: 'Attendance System',
      },
    });

    const filename = `Payroll_${company.code}_${monthName}_${currentYear}_${method.toUpperCase()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const colors = {
      primary: '#E8590C',
      dark: '#1A1A2E',
      gray: '#6B7280',
      light: '#F3F4F6',
      success: '#16A34A',
      danger: '#DC2626',
      blue: '#2563EB',
      orangeLight: '#FFF3E8',
      blueLight: '#EFF6FF',
    };

    const PAGE_W = doc.page.width;   // ~842 (landscape A4)
    const PAGE_H = doc.page.height;  // ~595

    // ════════════════════════════════════════════
    // HEADER — Compact
    // ════════════════════════════════════════════
    doc.rect(0, 0, PAGE_W, 6).fill(colors.primary);

    doc.fillColor(colors.dark)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(company.name.toUpperCase(), 20, 14);

    if (company.address) {
      doc.fontSize(7.5)
         .font('Helvetica')
         .fillColor(colors.gray)
         .text(company.address, 20, 33, { width: 400 });
    }

    // Right side info
    doc.fillColor(colors.primary)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('PAYROLL REPORT', PAGE_W - 200, 14, { width: 180, align: 'right' });

    doc.fillColor(colors.dark)
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(`${monthName} ${currentYear}`, PAGE_W - 200, 28, { width: 180, align: 'right' });

    // Method badge
    const methodLabel = method === 'hours' ? 'HOURS BASED' : method === 'days' ? 'DAYS BASED' : 'COMPARE';
    const methodColor = method === 'hours' ? colors.primary : method === 'days' ? colors.blue : '#7C3AED';
    
    doc.roundedRect(PAGE_W - 100, 42, 80, 13, 3).fill(methodColor);
    doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
       .text(methodLabel, PAGE_W - 100, 46, { width: 80, align: 'center' });

    // Separator
    doc.moveTo(20, 60).lineTo(PAGE_W - 20, 60).strokeColor(colors.primary).lineWidth(0.8).stroke();

    // ════════════════════════════════════════════
    // INFO ROW — Compact single line
    // ════════════════════════════════════════════
    let y = 67;
    doc.fontSize(8).font('Helvetica').fillColor(colors.gray);
    
    const firstEmp = payrollData[0] || {};
    const infoItems = [
      { label: 'Department: ', value: department && department !== 'all' ? department : 'All' },
      { label: 'Employees: ', value: `${payrollData.length}` },
      { label: 'Working Days: ', value: `${firstEmp.total_working_days || 0}` },
      { label: 'Required Hrs: ', value: `${firstEmp.targeted_hours || 0}h` },
      { label: 'Generated: ', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    ];

    let infoX = 20;
    infoItems.forEach((item) => {
      doc.fillColor(colors.gray).font('Helvetica').text(item.label, infoX, y, { continued: true });
      doc.fillColor(colors.dark).font('Helvetica-Bold').text(item.value);
      infoX += 145;
    });

    y = 85;

    // ════════════════════════════════════════════
    // TABLE — Dynamic columns based on method
    // ════════════════════════════════════════════
    const tableLeft = 20;
    const tableWidth = PAGE_W - 40;

    // ═══ Column definitions based on method ═══
    let cols;
    if (method === 'both') {
      // COMPARE: All columns visible
      cols = [
        { key: 'sr',       label: 'Sr',       width: 22,  align: 'left' },
        { key: 'code',     label: 'Code',     width: 48,  align: 'left' },
        { key: 'name',     label: 'Name',     width: 95,  align: 'left' },
        { key: 'dept',     label: 'Dept',     width: 55,  align: 'left' },
        { key: 'present',  label: 'P',        width: 25,  align: 'center' },
        { key: 'absent',   label: 'A',        width: 25,  align: 'center' },
        { key: 'leave',    label: 'L',        width: 25,  align: 'center' },
        { key: 'hours',    label: 'Worked',   width: 55,  align: 'center' },
        { key: 'salary',   label: 'Salary',   width: 60,  align: 'right' },
        // HOURS group
        { key: 'h_pct',    label: 'H%',       width: 35,  align: 'center', bg: colors.orangeLight, group: 'hours' },
        { key: 'h_deduct', label: 'H-Cut',    width: 55,  align: 'right',  bg: colors.orangeLight, group: 'hours' },
        { key: 'h_net',    label: 'H-Net',    width: 60,  align: 'right',  bg: colors.orangeLight, group: 'hours' },
        // DAYS group
        { key: 'd_pct',    label: 'D%',       width: 35,  align: 'center', bg: colors.blueLight, group: 'days' },
        { key: 'd_deduct', label: 'D-Cut',    width: 55,  align: 'right',  bg: colors.blueLight, group: 'days' },
        { key: 'd_net',    label: 'D-Net',    width: 60,  align: 'right',  bg: colors.blueLight, group: 'days' },
      ];
    } else {
      // SINGLE: Hours OR Days
      const single = method === 'hours' ? 'H' : 'D';
      cols = [
        { key: 'sr',       label: 'Sr',       width: 25,  align: 'left' },
        { key: 'code',     label: 'Code',     width: 60,  align: 'left' },
        { key: 'name',     label: 'Employee', width: 130, align: 'left' },
        { key: 'dept',     label: 'Department', width: 90, align: 'left' },
        { key: 'present',  label: 'Present',  width: 45,  align: 'center' },
        { key: 'absent',   label: 'Absent',   width: 45,  align: 'center' },
        { key: 'leave',    label: 'Leave',    width: 45,  align: 'center' },
        { key: 'hours',    label: 'Worked',   width: 65,  align: 'center' },
        { key: 'pct',      label: `${single}%`, width: 50,  align: 'center' },
        { key: 'salary',   label: 'Salary',   width: 75,  align: 'right' },
        { key: 'earned',   label: 'Earned',   width: 75,  align: 'right' },
        { key: 'deduct',   label: 'Deduct',   width: 70,  align: 'right' },
        { key: 'net',      label: 'Net Pay',  width: 75,  align: 'right' },
      ];
    }

    // Normalize widths to fit tableWidth
    const totalColW = cols.reduce((s, c) => s + c.width, 0);
    const scale = tableWidth / totalColW;
    cols.forEach(c => c.width = c.width * scale);

    // ═══ Calculate available row height ═══
    const headerH = method === 'both' ? 28 : 22;
    const totalRowH = 20;
    const summaryH = 70;
    const footerH = 25;
    const availableH = PAGE_H - y - headerH - totalRowH - summaryH - footerH - 10;
    const rowH = Math.max(12, Math.min(18, Math.floor(availableH / payrollData.length)));
    const cellFontSize = rowH < 14 ? 6.5 : rowH < 16 ? 7 : 7.5;
    const headerFontSize = method === 'both' ? 6.5 : 7.5;

    // ════════════════════════════════════════════
    // DRAW TABLE HEADER
    // ════════════════════════════════════════════
    const drawHeader = (startY) => {
      // Group label row (only for 'both' method)
      if (method === 'both') {
        let groupX = tableLeft;
        cols.forEach(c => {
          if (!c.group) groupX += c.width;
        });

        // HOURS group label
        const hoursCols = cols.filter(c => c.group === 'hours');
        const hoursW = hoursCols.reduce((s, c) => s + c.width, 0);
        doc.rect(groupX, startY, hoursW, 12).fill(colors.primary);
        doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
           .text('HOURS BASED', groupX, startY + 3, { width: hoursW, align: 'center' });
        groupX += hoursW;

        // DAYS group label
        const daysCols = cols.filter(c => c.group === 'days');
        const daysW = daysCols.reduce((s, c) => s + c.width, 0);
        doc.rect(groupX, startY, daysW, 12).fill(colors.blue);
        doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
           .text('DAYS BASED', groupX, startY + 3, { width: daysW, align: 'center' });
      }

      // Main column header row
      const mainHeaderY = method === 'both' ? startY + 12 : startY;
      const mainHeaderH = method === 'both' ? 16 : 22;

      doc.rect(tableLeft, mainHeaderY, tableWidth, mainHeaderH).fill(colors.dark);

      let x = tableLeft;
      const textY = mainHeaderY + (mainHeaderH - cellFontSize) / 2 - 1;

      cols.forEach(col => {
        doc.fillColor('white').fontSize(headerFontSize).font('Helvetica-Bold')
           .text(col.label, x + 2, textY, {
             width: col.width - 4,
             align: col.align,
             lineBreak: false,
           });
        x += col.width;
      });
    };

    drawHeader(y);
    let rowY = y + headerH;

    // ════════════════════════════════════════════
    // DRAW TABLE ROWS
    // ════════════════════════════════════════════
    payrollData.forEach((emp, idx) => {
      // New page check
      if (rowY + rowH > PAGE_H - summaryH - footerH - 30) {
        doc.addPage();
        rowY = 20;
        drawHeader(rowY);
        rowY += headerH;
      }

      // Alternate row bg
      if (idx % 2 === 0) {
        doc.rect(tableLeft, rowY, tableWidth, rowH).fill(colors.light);
      }

      // Group column backgrounds for 'both' method
      if (method === 'both') {
        let bgX = tableLeft;
        cols.forEach(c => {
          if (c.bg) {
            doc.rect(bgX, rowY, c.width, rowH).fill(c.bg);
          }
          bgX += c.width;
        });
      }

      // Get values based on method
      let rowData = {};
      const totalLeave = (emp.paid_leave_days || 0) + (emp.unpaid_leave_days || 0);

      if (method === 'both') {
        rowData = {
          sr: `${idx + 1}`,
          code: emp.emp_code || '-',
          name: emp.name || '-',
          dept: emp.department || '-',
          present: `${emp.total_present || 0}`,
          absent: `${emp.total_absent || 0}`,
          leave: `${totalLeave}`,
          hours: emp.worked_hours || '-',
          salary: formatINRPlain(emp.monthly_salary),
          h_pct: `${emp.hours_based.progress_percent}%`,
          h_deduct: formatINRPlain(emp.hours_based.deduction),
          h_net: formatINRPlain(emp.hours_based.net_payable),
          d_pct: `${emp.days_based.progress_percent}%`,
          d_deduct: formatINRPlain(emp.days_based.deduction),
          d_net: formatINRPlain(emp.days_based.net_payable),
        };
      } else {
        const data = method === 'hours' ? emp.hours_based : emp.days_based;
        rowData = {
          sr: `${idx + 1}`,
          code: emp.emp_code || '-',
          name: emp.name || '-',
          dept: emp.department || '-',
          present: `${emp.total_present || 0}`,
          absent: `${emp.total_absent || 0}`,
          leave: `${totalLeave}`,
          hours: emp.worked_hours || '-',
          pct: `${data.progress_percent}%`,
          salary: formatINRPlain(emp.monthly_salary),
          earned: formatINRPlain(data.earned),
          deduct: formatINRPlain(data.deduction),
          net: formatINRPlain(data.net_payable),
        };
      }

      // Draw cells
      let xR = tableLeft;
      const cellY = rowY + (rowH - cellFontSize) / 2 - 1;

      cols.forEach(col => {
        const value = rowData[col.key] || '-';
        let textColor = colors.dark;
        let fontStyle = 'Helvetica';

        // Style by column
        if (col.key === 'code') fontStyle = 'Helvetica-Bold';
        if (col.key === 'dept') textColor = colors.gray;
        if (col.key === 'present') textColor = colors.success;
        if (col.key === 'absent') textColor = emp.total_absent > 0 ? colors.danger : colors.gray;
        if (col.key === 'h_deduct' || col.key === 'd_deduct' || col.key === 'deduct') {
          textColor = colors.danger;
        }
        if (col.key === 'earned') textColor = colors.success;
        if (col.key === 'h_net' || col.key === 'net') {
          textColor = colors.primary;
          fontStyle = 'Helvetica-Bold';
        }
        if (col.key === 'd_net') {
          textColor = colors.blue;
          fontStyle = 'Helvetica-Bold';
        }
        if (col.key === 'salary') fontStyle = 'Helvetica-Bold';

        doc.fillColor(textColor).fontSize(cellFontSize).font(fontStyle)
           .text(value, xR + 2, cellY, {
             width: col.width - 4,
             align: col.align,
             lineBreak: false,
             ellipsis: true,
           });

        xR += col.width;
      });

      // Row border bottom
      doc.moveTo(tableLeft, rowY + rowH)
         .lineTo(tableLeft + tableWidth, rowY + rowH)
         .strokeColor('#E5E7EB').lineWidth(0.3).stroke();

      rowY += rowH;
    });

    // ════════════════════════════════════════════
    // TOTAL ROW
    // ════════════════════════════════════════════
    if (rowY + totalRowH > PAGE_H - summaryH - footerH - 10) {
      doc.addPage();
      rowY = 20;
    }

    doc.rect(tableLeft, rowY, tableWidth, totalRowH).fill(colors.primary);

    let xT = tableLeft;
    const totalY = rowY + (totalRowH - 9) / 2;

    // "TOTAL" label spans first columns
    if (method === 'both') {
      // Span: sr, code, name, dept, present, absent, leave, hours
      const labelCols = cols.slice(0, 8);
      const labelW = labelCols.reduce((s, c) => s + c.width, 0);
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
         .text('GRAND TOTAL', xT + 5, totalY, { width: labelW - 10, align: 'left' });
      xT += labelW;

      // Salary
      doc.text(formatINRPlain(totalSalary), xT + 2, totalY, {
        width: cols[8].width - 4, align: 'right',
      });
      xT += cols[8].width;

      // Hours group
      doc.fillColor('#FFE4D0').text('-', xT + 2, totalY, { width: cols[9].width - 4, align: 'center' });
      xT += cols[9].width;
      doc.fillColor('white').text(formatINRPlain(totalDeductHours), xT + 2, totalY, { width: cols[10].width - 4, align: 'right' });
      xT += cols[10].width;
      doc.text(formatINRPlain(totalEarnedHours), xT + 2, totalY, { width: cols[11].width - 4, align: 'right' });
      xT += cols[11].width;

      // Days group
      doc.fillColor('#DBEAFE').text('-', xT + 2, totalY, { width: cols[12].width - 4, align: 'center' });
      xT += cols[12].width;
      doc.fillColor('white').text(formatINRPlain(totalDeductDays), xT + 2, totalY, { width: cols[13].width - 4, align: 'right' });
      xT += cols[13].width;
      doc.text(formatINRPlain(totalEarnedDays), xT + 2, totalY, { width: cols[14].width - 4, align: 'right' });
    } else {
      const labelCols = cols.slice(0, 9);
      const labelW = labelCols.reduce((s, c) => s + c.width, 0);
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
         .text('GRAND TOTAL', xT + 5, totalY, { width: labelW - 10, align: 'left' });
      xT += labelW;

      const totalEarned = method === 'hours' ? totalEarnedHours : totalEarnedDays;
      const totalDeduct = method === 'hours' ? totalDeductHours : totalDeductDays;

      doc.text(formatINRPlain(totalSalary), xT + 2, totalY, { width: cols[9].width - 4, align: 'right' });
      xT += cols[9].width;
      doc.text(formatINRPlain(totalEarned), xT + 2, totalY, { width: cols[10].width - 4, align: 'right' });
      xT += cols[10].width;
      doc.text(formatINRPlain(totalDeduct), xT + 2, totalY, { width: cols[11].width - 4, align: 'right' });
      xT += cols[11].width;
      doc.text(formatINRPlain(totalEarned), xT + 2, totalY, { width: cols[12].width - 4, align: 'right' });
    }

    rowY += totalRowH + 8;

    // ════════════════════════════════════════════
    // SUMMARY BOX
    // ════════════════════════════════════════════
    if (rowY + summaryH > PAGE_H - footerH - 10) {
      doc.addPage();
      rowY = 20;
    }

    doc.roundedRect(tableLeft, rowY, tableWidth, summaryH - 5, 4)
       .fillAndStroke(colors.light, '#D1D5DB');

    doc.fillColor(colors.dark).fontSize(10).font('Helvetica-Bold')
       .text('PAYROLL SUMMARY', tableLeft + 12, rowY + 8);

    const sumY = rowY + 28;
    const sumColCount = method === 'both' ? 5 : 4;
    const sumColW = (tableWidth - 24) / sumColCount;

    // Box 1: Total Salary
    doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
       .text('Total Salary', tableLeft + 12, sumY);
    doc.fontSize(12).fillColor(colors.dark).font('Helvetica-Bold')
       .text(formatINR(totalSalary), tableLeft + 12, sumY + 11);

    if (method === 'both') {
      // Box 2: Hours Earned
      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Hours-Based Earned', tableLeft + 12 + sumColW, sumY);
      doc.fontSize(12).fillColor(colors.primary).font('Helvetica-Bold')
         .text(formatINR(totalEarnedHours), tableLeft + 12 + sumColW, sumY + 11);

      // Box 3: Hours Deduction
      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Hours-Based Cut', tableLeft + 12 + sumColW * 2, sumY);
      doc.fontSize(11).fillColor(colors.danger).font('Helvetica-Bold')
         .text(formatINR(totalDeductHours), tableLeft + 12 + sumColW * 2, sumY + 11);

      // Box 4: Days Earned
      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Days-Based Earned', tableLeft + 12 + sumColW * 3, sumY);
      doc.fontSize(12).fillColor(colors.blue).font('Helvetica-Bold')
         .text(formatINR(totalEarnedDays), tableLeft + 12 + sumColW * 3, sumY + 11);

      // Box 5: Days Deduction
      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Days-Based Cut', tableLeft + 12 + sumColW * 4, sumY);
      doc.fontSize(11).fillColor(colors.danger).font('Helvetica-Bold')
         .text(formatINR(totalDeductDays), tableLeft + 12 + sumColW * 4, sumY + 11);

      // Difference note
      const diff = Math.abs(totalEarnedHours - totalEarnedDays);
      const winner = totalEarnedHours > totalEarnedDays ? 'Hours' : 'Days';
      doc.fontSize(7.5).fillColor(colors.gray).font('Helvetica-Oblique')
         .text(`Note: ${winner}-based method pays ${formatINR(diff)} more to employees overall.`,
               tableLeft + 12, sumY + 38, { width: tableWidth - 24 });
    } else {
      const totalEarned = method === 'hours' ? totalEarnedHours : totalEarnedDays;
      const totalDeduct = method === 'hours' ? totalDeductHours : totalDeductDays;

      // Box 2: Total Earned
      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Total Earned', tableLeft + 12 + sumColW, sumY);
      doc.fontSize(13).fillColor(colors.success).font('Helvetica-Bold')
         .text(formatINR(totalEarned), tableLeft + 12 + sumColW, sumY + 11);

      // Box 3: Total Deduction
      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Total Deduction', tableLeft + 12 + sumColW * 2, sumY);
      doc.fontSize(13).fillColor(colors.danger).font('Helvetica-Bold')
         .text(formatINR(totalDeduct), tableLeft + 12 + sumColW * 2, sumY + 11);

      // Box 4: Net Payable
      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('NET PAYABLE', tableLeft + 12 + sumColW * 3, sumY);
      doc.fontSize(14).fillColor(colors.primary).font('Helvetica-Bold')
         .text(formatINR(totalEarned), tableLeft + 12 + sumColW * 3, sumY + 11);
    }

    // ════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════
    const footerY = PAGE_H - 22;
    
    doc.moveTo(20, footerY - 4).lineTo(PAGE_W - 20, footerY - 4)
       .strokeColor('#E5E7EB').lineWidth(0.5).stroke();

    doc.fontSize(7).fillColor(colors.gray).font('Helvetica')
       .text(`${company.name} | Payroll Report | ${monthName} ${currentYear} | Method: ${methodLabel}`,
             20, footerY, { width: PAGE_W - 40, align: 'center' });

    doc.fontSize(6.5).fillColor(colors.gray)
       .text(`Generated by Attendance System on ${new Date().toLocaleString('en-IN')}`,
             20, footerY + 9, { width: PAGE_W - 40, align: 'center' });

    // Finalize
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

module.exports = {
  downloadPayrollPDF,
};
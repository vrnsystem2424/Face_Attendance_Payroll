


// const PDFDocument = require('pdfkit');
// const { calculateEmployeePayroll } = require('./payrollController');
// const Employee = require('../models/Employee');
// const Company = require('../models/Company');
// const MonthlySettings = require('../models/MonthlySettings');

// const formatINR = (num) => {
//   if (!num && num !== 0) return 'Rs.0';
//   return 'Rs.' + Number(num).toLocaleString('en-IN');
// };

// const formatINRPlain = (num) => {
//   if (!num && num !== 0) return '0';
//   return Number(num).toLocaleString('en-IN');
// };

// const getCompanyAddress = (company) => {
//   if (company.address && company.address.trim() !== '') return company.address;
//   return 'Bhopal, Madhya Pradesh, India';
// };

// const downloadPayrollPDF = async (req, res) => {
//   try {
//     const { company_id, department, month, year } = req.query;

//     if (!company_id)
//       return res.status(400).json({ success: false, message: 'company_id required' });

//     const currentMonth = parseInt(month) || new Date().getMonth() + 1;
//     const currentYear = parseInt(year) || new Date().getFullYear();

//     const company = await Company.findById(company_id);
//     if (!company)
//       return res.status(404).json({ success: false, message: 'Company not found' });

//     const settings = await MonthlySettings.findOne({
//       company_id,
//       month: currentMonth,
//       year: currentYear,
//     });

//     const filter = { company_id, status: 'approved', role: { $ne: 'super_admin' } };
//     if (department && department !== 'all') filter.department = department;

//     const employees = await Employee.find(filter).sort({ name: 1 });
//     if (employees.length === 0)
//       return res.status(404).json({ success: false, message: 'No employees found' });

//     const payrollData = [];
//     for (const emp of employees) {
//       const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
//       payrollData.push(payroll);
//     }

//     const totalSalary = payrollData.reduce((s, p) => s + p.monthly_salary, 0);
//     const totalEarned = payrollData.reduce((s, p) => s + p.earned_salary, 0);
//     const totalCut = payrollData.reduce((s, p) => s + p.total_deduction, 0);
//     const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', {
//       month: 'long',
//     });
//     const companyAddress = getCompanyAddress(company);

//     // ════════════════════════════════════════════
//     // 🎯 CUSTOM PAGE SIZE - Sab kuch fit karo
//     // ════════════════════════════════════════════
//     const MARGIN = 20;
//     const empCount = payrollData.length;

//     // Fixed sections height
//     const HEADER_H = 60;
//     const INFO_H = 20;
//     const COL_HEADER_H = 20;
//     const TOTAL_ROW_H = 20;
//     const SUMMARY_H = 55;
//     const FOOTER_H = 25;
//     const GAPS = 15;

//     // Row height - jitne emp utna small
//     let rowH;
//     if (empCount <= 20) rowH = 18;
//     else if (empCount <= 30) rowH = 16;
//     else if (empCount <= 40) rowH = 14;
//     else if (empCount <= 50) rowH = 12;
//     else rowH = 11;

//     // Font sizes based on row height
//     const cellFS = rowH >= 16 ? 8 : rowH >= 14 ? 7.5 : rowH >= 12 ? 7 : 6.5;
//     const headerFS = rowH >= 14 ? 8 : 7;

//     // 🎯 CALCULATE EXACT PAGE HEIGHT
//     const rowsHeight = rowH * empCount;
//     const PAGE_H = MARGIN + HEADER_H + INFO_H + COL_HEADER_H + rowsHeight + TOTAL_ROW_H + GAPS + SUMMARY_H + FOOTER_H + MARGIN;
//     const PAGE_W = 900; // wider for better column fit

//     const doc = new PDFDocument({
//       size: [PAGE_W, PAGE_H],
//       margin: MARGIN,
//       autoFirstPage: true,
//     });

//     const filename = `Payroll_${company.code}_${monthName}_${currentYear}.pdf`;
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//     doc.pipe(res);

//     const colors = {
//       primary: '#E8590C',
//       dark: '#1A1A2E',
//       gray: '#6B7280',
//       light: '#F3F4F6',
//       success: '#16A34A',
//       danger: '#DC2626',
//       blue: '#2563EB',
//       purple: '#7C3AED',
//       amber: '#D97706',
//       orange: '#EA580C',
//       cyan: '#0891B2',
//     };

//     // ════════════════════════════════════════════
//     // HEADER
//     // ════════════════════════════════════════════
//     doc.rect(0, 0, PAGE_W, 5).fill(colors.primary);

//     doc
//       .fillColor(colors.dark)
//       .fontSize(15)
//       .font('Helvetica-Bold')
//       .text(company.name.toUpperCase(), MARGIN, 12);

//     doc
//       .fontSize(8)
//       .font('Helvetica')
//       .fillColor(colors.gray)
//       .text(companyAddress, MARGIN, 32, { width: 400 });

//     doc
//       .fillColor(colors.primary)
//       .fontSize(12)
//       .font('Helvetica-Bold')
//       .text('PAYROLL REPORT', PAGE_W - 220, 12, { width: 200, align: 'right' });

//     doc
//       .fillColor(colors.dark)
//       .fontSize(10)
//       .font('Helvetica-Bold')
//       .text(`${monthName} ${currentYear}`, PAGE_W - 220, 28, { width: 200, align: 'right' });

//     doc.roundedRect(PAGE_W - 100, 43, 80, 13, 3).fill(colors.blue);
//     doc
//       .fillColor('white')
//       .fontSize(7)
//       .font('Helvetica-Bold')
//       .text('DAYS BASED', PAGE_W - 100, 47, { width: 80, align: 'center' });

//     // Divider
//     doc.moveTo(MARGIN, 62).lineTo(PAGE_W - MARGIN, 62).strokeColor(colors.primary).lineWidth(0.8).stroke();

//     // ════════════════════════════════════════════
//     // INFO ROW
//     // ════════════════════════════════════════════
//     let y = 70;
//     const firstEmp = payrollData[0] || {};

//     const infoItems = [
//       { label: 'Employees: ', value: `${payrollData.length}` },
//       { label: 'Working Days: ', value: `${firstEmp.total_working_days || 0}` },
//       {
//         label: 'Generated: ',
//         value: new Date().toLocaleDateString('en-IN', {
//           day: '2-digit',
//           month: 'short',
//           year: 'numeric',
//         }),
//       },
//     ];

//     let infoX = MARGIN;
//     infoItems.forEach((item) => {
//       doc.fontSize(8).fillColor(colors.gray).font('Helvetica').text(item.label, infoX, y, {
//         continued: true,
//       });
//       doc.fillColor(colors.dark).font('Helvetica-Bold').text(item.value);
//       infoX += 260;
//     });

//     y += 18;

//     // ════════════════════════════════════════════
//     // TABLE
//     // ════════════════════════════════════════════
//     const tableLeft = MARGIN;
//     const tableWidth = PAGE_W - MARGIN * 2;

//     const cols = [
//       { key: 'sr',      label: 'Sr',         width: 25,  align: 'left'   },
//       { key: 'name',    label: 'Name',       width: 145, align: 'left'   },
//       { key: 'present', label: 'Present',    width: 55,  align: 'center' },
//       { key: 'absent',  label: 'Absent',     width: 50,  align: 'center' },
//       { key: 'late',    label: 'Late',       width: 45,  align: 'center' },
//       { key: 'hd',      label: 'HD',         width: 40,  align: 'center' },
//       { key: 'leaves',  label: 'Leaves',     width: 50,  align: 'center' },
//       { key: 'paidlv',  label: 'Paid Lv',    width: 55,  align: 'center' },
//       { key: 'final',   label: 'Final Days', width: 65,  align: 'center' },
//       { key: 'pct',     label: '%',          width: 50,  align: 'center' },
//       { key: 'salary',  label: 'Salary',     width: 75,  align: 'right'  },
//       { key: 'cut',     label: 'Cut',        width: 70,  align: 'right'  },
//       { key: 'net',     label: 'Net',        width: 80,  align: 'right'  },
//     ];

//     // Scale to table width
//     const totalColW = cols.reduce((s, c) => s + c.width, 0);
//     const scale = tableWidth / totalColW;
//     cols.forEach((c) => (c.width = c.width * scale));

//     // COLUMN HEADER
//     doc.rect(tableLeft, y, tableWidth, COL_HEADER_H).fill(colors.dark);

//     let hx = tableLeft;
//     const hTextY = y + (COL_HEADER_H - headerFS) / 2 - 1;

//     cols.forEach((col) => {
//       doc
//         .fillColor('white')
//         .fontSize(headerFS)
//         .font('Helvetica-Bold')
//         .text(col.label, hx + 2, hTextY, {
//           width: col.width - 4,
//           align: col.align,
//           lineBreak: false,
//         });
//       hx += col.width;
//     });

//     y += COL_HEADER_H;

//     // ════════════════════════════════════════════
//     // ROWS - NO PAGE BREAK
//     // ════════════════════════════════════════════
//     payrollData.forEach((emp, idx) => {
//       // Alternating background
//       if (idx % 2 === 0) {
//         doc.rect(tableLeft, y, tableWidth, rowH).fill(colors.light);
//       }

//       // Final Days highlight
//       let bgX = tableLeft;
//       cols.forEach((c) => {
//         if (c.key === 'final') {
//           doc.rect(bgX, y, c.width, rowH).fill('#F5F3FF');
//         }
//         bgX += c.width;
//       });

//       // Absent calc
//       const absentDays = Math.max(
//         0,
//         (emp.total_working_days || 0) -
//           (emp.total_present || 0) -
//           (emp.half_day_count || 0) -
//           (emp.full_day_leaves || 0) -
//           (emp.half_day_leave_count || 0) -
//           (emp.sunday_worked || 0)
//       );

//       const rowData = {
//         sr:      `${idx + 1}`,
//         name:    emp.name || '-',
//         present: `${emp.total_present || 0}`,
//         absent:  `${absentDays}`,
//         late:    `${emp.late_count || 0}`,
//         hd:      `${emp.half_day_count || 0}`,
//         leaves:  `${emp.full_day_leaves || 0}`,
//         paidlv:  `${emp.paid_leave_days || 0}`,
//         final:   `${emp.final_payable_days || 0}`,
//         pct:     `${emp.progress_percent || 0}%`,
//         salary:  formatINRPlain(emp.monthly_salary),
//         cut:     formatINRPlain(emp.total_deduction),
//         net:     formatINRPlain(emp.net_payable),
//       };

//       let xR = tableLeft;
//       const cellY = y + (rowH - cellFS) / 2 - 0.5;

//       cols.forEach((col) => {
//         const value = rowData[col.key] !== undefined ? rowData[col.key] : '-';
//         let textColor = colors.dark;
//         let fontStyle = 'Helvetica';

//         if (col.key === 'name')    { fontStyle = 'Helvetica-Bold'; }
//         if (col.key === 'present') { textColor = colors.success; }
//         if (col.key === 'absent')  { textColor = absentDays > 0 ? colors.danger : colors.gray; }
//         if (col.key === 'late')    { textColor = (emp.late_count || 0) > 0 ? colors.amber : colors.gray; }
//         if (col.key === 'hd')      { textColor = (emp.half_day_count || 0) > 0 ? colors.orange : colors.gray; }
//         if (col.key === 'leaves')  { textColor = (emp.full_day_leaves || 0) > 0 ? colors.blue : colors.gray; }
//         if (col.key === 'paidlv')  { textColor = (emp.paid_leave_days || 0) > 0 ? colors.cyan : colors.gray; }
//         if (col.key === 'final')   { textColor = colors.purple; fontStyle = 'Helvetica-Bold'; }
//         if (col.key === 'cut')     { textColor = emp.total_deduction > 0 ? colors.danger : colors.gray; }
//         if (col.key === 'net')     { textColor = colors.primary; fontStyle = 'Helvetica-Bold'; }
//         if (col.key === 'salary')  { fontStyle = 'Helvetica-Bold'; }

//         doc
//           .fillColor(textColor)
//           .fontSize(cellFS)
//           .font(fontStyle)
//           .text(value, xR + 2, cellY, {
//             width: col.width - 4,
//             align: col.align,
//             lineBreak: false,
//             ellipsis: true,
//           });

//         xR += col.width;
//       });

//       // Divider
//       doc
//         .moveTo(tableLeft, y + rowH)
//         .lineTo(tableLeft + tableWidth, y + rowH)
//         .strokeColor('#E5E7EB')
//         .lineWidth(0.3)
//         .stroke();

//       y += rowH;
//     });

//     // ════════════════════════════════════════════
//     // TOTAL ROW
//     // ════════════════════════════════════════════
//     doc.rect(tableLeft, y, tableWidth, TOTAL_ROW_H).fill(colors.primary);

//     const totalPresent = payrollData.reduce((s, p) => s + (p.total_present || 0), 0);
//     const totalAbsent  = payrollData.reduce((s, p) => s + (p.total_absent || 0), 0);
//     const totalLate    = payrollData.reduce((s, p) => s + (p.late_count || 0), 0);
//     const totalHD      = payrollData.reduce((s, p) => s + (p.half_day_count || 0), 0);
//     const totalLeaves  = payrollData.reduce((s, p) => s + (p.full_day_leaves || 0), 0);
//     const totalPaidLv  = payrollData.reduce((s, p) => s + (p.paid_leave_days || 0), 0);

//     let xT = tableLeft;
//     const totalTextY = y + (TOTAL_ROW_H - 9) / 2;

//     doc.fillColor('white').fontSize(9).font('Helvetica-Bold');

//     doc.text('TOTAL', xT + 5, totalTextY, {
//       width: cols[0].width + cols[1].width - 10,
//       align: 'left',
//     });
//     xT += cols[0].width + cols[1].width;

//     const totalValues = [
//       { val: `${totalPresent}`, idx: 2 },
//       { val: `${totalAbsent}`,  idx: 3 },
//       { val: `${totalLate}`,    idx: 4 },
//       { val: `${totalHD}`,      idx: 5 },
//       { val: `${totalLeaves}`,  idx: 6 },
//       { val: `${totalPaidLv}`,  idx: 7 },
//     ];

//     totalValues.forEach(({ val, idx }) => {
//       doc.text(val, xT + 2, totalTextY, {
//         width: cols[idx].width - 4,
//         align: 'center',
//       });
//       xT += cols[idx].width;
//     });

//     xT += cols[8].width + cols[9].width; // skip

//     doc.text(formatINRPlain(totalSalary), xT + 2, totalTextY, {
//       width: cols[10].width - 4,
//       align: 'right',
//     });
//     xT += cols[10].width;

//     doc.text(formatINRPlain(totalCut), xT + 2, totalTextY, {
//       width: cols[11].width - 4,
//       align: 'right',
//     });
//     xT += cols[11].width;

//     doc.text(formatINRPlain(totalEarned), xT + 2, totalTextY, {
//       width: cols[12].width - 4,
//       align: 'right',
//     });

//     y += TOTAL_ROW_H + 10;

//     // ════════════════════════════════════════════
//     // SUMMARY BOX
//     // ════════════════════════════════════════════
//     doc.roundedRect(tableLeft, y, tableWidth, SUMMARY_H - 5, 4).fillAndStroke(colors.light, '#D1D5DB');

//     doc
//       .fillColor(colors.dark)
//       .fontSize(10)
//       .font('Helvetica-Bold')
//       .text('PAYROLL SUMMARY', tableLeft + 12, y + 8);

//     const sumY = y + 24;
//     const sumColW = (tableWidth - 24) / 4;

//     doc.fontSize(8).fillColor(colors.gray).font('Helvetica').text('Total Salary', tableLeft + 12, sumY);
//     doc.fontSize(12).fillColor(colors.dark).font('Helvetica-Bold').text(formatINR(totalSalary), tableLeft + 12, sumY + 11);

//     doc.fontSize(8).fillColor(colors.gray).font('Helvetica').text('Total Earned', tableLeft + 12 + sumColW, sumY);
//     doc.fontSize(12).fillColor(colors.success).font('Helvetica-Bold').text(formatINR(totalEarned), tableLeft + 12 + sumColW, sumY + 11);

//     doc.fontSize(8).fillColor(colors.gray).font('Helvetica').text('Total Cut', tableLeft + 12 + sumColW * 2, sumY);
//     doc.fontSize(12).fillColor(colors.danger).font('Helvetica-Bold').text(formatINR(totalCut), tableLeft + 12 + sumColW * 2, sumY + 11);

//     doc.fontSize(8).fillColor(colors.gray).font('Helvetica').text('NET PAYABLE', tableLeft + 12 + sumColW * 3, sumY);
//     doc.fontSize(13).fillColor(colors.primary).font('Helvetica-Bold').text(formatINR(totalEarned), tableLeft + 12 + sumColW * 3, sumY + 11);

//     y += SUMMARY_H;

//     // ════════════════════════════════════════════
//     // FOOTER
//     // ════════════════════════════════════════════
//     doc
//       .moveTo(MARGIN, y)
//       .lineTo(PAGE_W - MARGIN, y)
//       .strokeColor('#E5E7EB')
//       .lineWidth(0.5)
//       .stroke();

//     doc
//       .fontSize(7)
//       .fillColor(colors.gray)
//       .font('Helvetica')
//       .text(
//         `${company.name} | Payroll Report | ${monthName} ${currentYear} | Days Based`,
//         MARGIN,
//         y + 5,
//         { width: PAGE_W - MARGIN * 2, align: 'center' }
//       );

//     doc
//       .fontSize(6.5)
//       .text(
//         `Generated by Attendance System on ${new Date().toLocaleString('en-IN')}`,
//         MARGIN,
//         y + 14,
//         { width: PAGE_W - MARGIN * 2, align: 'center' }
//       );

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

// module.exports = { downloadPayrollPDF };





const PDFDocument = require('pdfkit');
const { calculateEmployeePayroll } = require('./payrollController');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const MonthlySettings = require('../models/MonthlySettings');

const formatINR = (num) => {
  if (!num && num !== 0) return 'Rs.0';
  return 'Rs.' + Number(num).toLocaleString('en-IN');
};

const formatINRPlain = (num) => {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString('en-IN');
};

const getCompanyAddress = (company) => {
  if (company.address && company.address.trim() !== '') return company.address;
  return 'Bhopal, Madhya Pradesh, India';
};

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
      const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
      payrollData.push(payroll);
    }

    const totalSalary = payrollData.reduce((s, p) => s + p.monthly_salary, 0);
    const totalEarned = payrollData.reduce((s, p) => s + p.earned_salary, 0);
    const totalCut = payrollData.reduce((s, p) => s + p.total_deduction, 0);
    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', {
      month: 'long',
    });
    const companyAddress = getCompanyAddress(company);

    // ════════════════════════════════════════════
    // 🎯 CUSTOM PAGE SIZE - Sab kuch fit karo
    // ════════════════════════════════════════════
    const MARGIN = 20;
    const empCount = payrollData.length;

    const HEADER_H = 60;
    const INFO_H = 20;
    const COL_HEADER_H = 20;
    const TOTAL_ROW_H = 20;
    const SUMMARY_H = 55;
    const FOOTER_H = 25;
    const GAPS = 15;

    let rowH;
    if (empCount <= 20) rowH = 18;
    else if (empCount <= 30) rowH = 16;
    else if (empCount <= 40) rowH = 14;
    else if (empCount <= 50) rowH = 12;
    else rowH = 11;

    const cellFS = rowH >= 16 ? 8 : rowH >= 14 ? 7.5 : rowH >= 12 ? 7 : 6.5;
    const headerFS = rowH >= 14 ? 8 : 7;

    const rowsHeight = rowH * empCount;
    const PAGE_H = MARGIN + HEADER_H + INFO_H + COL_HEADER_H + rowsHeight + TOTAL_ROW_H + GAPS + SUMMARY_H + FOOTER_H + MARGIN;
    const PAGE_W = 900;

    const doc = new PDFDocument({
      size: [PAGE_W, PAGE_H],
      margin: MARGIN,
      autoFirstPage: true,
    });

    const filename = `Payroll_${company.code}_${monthName}_${currentYear}.pdf`;
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
      purple: '#7C3AED',
      amber: '#D97706',
      orange: '#EA580C',
      cyan: '#0891B2',
    };

    // ════════════════════════════════════════════
    // HEADER
    // ════════════════════════════════════════════
    doc.rect(0, 0, PAGE_W, 5).fill(colors.primary);

    doc
      .fillColor(colors.dark)
      .fontSize(15)
      .font('Helvetica-Bold')
      .text(company.name.toUpperCase(), MARGIN, 12);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(colors.gray)
      .text(companyAddress, MARGIN, 32, { width: 400 });

    doc
      .fillColor(colors.primary)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PAYROLL REPORT', PAGE_W - 220, 12, { width: 200, align: 'right' });

    doc
      .fillColor(colors.dark)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`${monthName} ${currentYear}`, PAGE_W - 220, 28, { width: 200, align: 'right' });

    doc.roundedRect(PAGE_W - 100, 43, 80, 13, 3).fill(colors.blue);
    doc
      .fillColor('white')
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('DAYS BASED', PAGE_W - 100, 47, { width: 80, align: 'center' });

    doc.moveTo(MARGIN, 62).lineTo(PAGE_W - MARGIN, 62).strokeColor(colors.primary).lineWidth(0.8).stroke();

    // ════════════════════════════════════════════
    // INFO ROW
    // ════════════════════════════════════════════
    let y = 70;
    const firstEmp = payrollData[0] || {};

    const infoItems = [
      { label: 'Employees: ', value: `${payrollData.length}` },
      { label: 'Total Days: ', value: `${firstEmp.total_working_days || 0}` },
      {
        label: 'Generated: ',
        value: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      },
    ];

    let infoX = MARGIN;
    infoItems.forEach((item) => {
      doc.fontSize(8).fillColor(colors.gray).font('Helvetica').text(item.label, infoX, y, {
        continued: true,
      });
      doc.fillColor(colors.dark).font('Helvetica-Bold').text(item.value);
      infoX += 260;
    });

    y += 18;

    // ════════════════════════════════════════════
    // TABLE - NO ABSENT COLUMN
    // ════════════════════════════════════════════
    const tableLeft = MARGIN;
    const tableWidth = PAGE_W - MARGIN * 2;

    const cols = [
      { key: 'sr',      label: 'Sr',         width: 25,  align: 'left'   },
      { key: 'name',    label: 'Name',       width: 155, align: 'left'   },
      { key: 'present', label: 'Present',    width: 60,  align: 'center' },
      { key: 'late',    label: 'Late',       width: 50,  align: 'center' },
      { key: 'hd',      label: 'HD',         width: 45,  align: 'center' },
      { key: 'leaves',  label: 'Leaves',     width: 55,  align: 'center' },
      { key: 'paidlv',  label: 'Paid Lv',    width: 60,  align: 'center' },
      { key: 'final',   label: 'Final Days', width: 70,  align: 'center' },
      { key: 'pct',     label: '%',          width: 55,  align: 'center' },
      { key: 'salary',  label: 'Salary',     width: 80,  align: 'right'  },
      { key: 'cut',     label: 'Cut',        width: 75,  align: 'right'  },
      { key: 'net',     label: 'Net',        width: 85,  align: 'right'  },
    ];

    const totalColW = cols.reduce((s, c) => s + c.width, 0);
    const scale = tableWidth / totalColW;
    cols.forEach((c) => (c.width = c.width * scale));

    // COLUMN HEADER
    doc.rect(tableLeft, y, tableWidth, COL_HEADER_H).fill(colors.dark);

    let hx = tableLeft;
    const hTextY = y + (COL_HEADER_H - headerFS) / 2 - 1;

    cols.forEach((col) => {
      doc
        .fillColor('white')
        .fontSize(headerFS)
        .font('Helvetica-Bold')
        .text(col.label, hx + 2, hTextY, {
          width: col.width - 4,
          align: col.align,
          lineBreak: false,
        });
      hx += col.width;
    });

    y += COL_HEADER_H;

    // ════════════════════════════════════════════
    // ROWS
    // ════════════════════════════════════════════
    payrollData.forEach((emp, idx) => {
      if (idx % 2 === 0) {
        doc.rect(tableLeft, y, tableWidth, rowH).fill(colors.light);
      }

      // Final Days highlight
      let bgX = tableLeft;
      cols.forEach((c) => {
        if (c.key === 'final') {
          doc.rect(bgX, y, c.width, rowH).fill('#F5F3FF');
        }
        bgX += c.width;
      });

      const rowData = {
        sr:      `${idx + 1}`,
        name:    emp.name || '-',
        present: `${emp.total_present || 0}`,
        late:    `${emp.late_count || 0}`,
        hd:      `${emp.half_day_count || 0}`,
        leaves:  `${emp.full_day_leaves || 0}`,
        paidlv:  `${emp.paid_leave_days || 0}`,
        final:   `${emp.final_payable_days || 0}`,
        pct:     `${emp.progress_percent || 0}%`,
        salary:  formatINRPlain(emp.monthly_salary),
        cut:     formatINRPlain(emp.total_deduction),
        net:     formatINRPlain(emp.net_payable),
      };

      let xR = tableLeft;
      const cellY = y + (rowH - cellFS) / 2 - 0.5;

      cols.forEach((col) => {
        const value = rowData[col.key] !== undefined ? rowData[col.key] : '-';
        let textColor = colors.dark;
        let fontStyle = 'Helvetica';

        if (col.key === 'name')    { fontStyle = 'Helvetica-Bold'; }
        if (col.key === 'present') { textColor = colors.success; }
        if (col.key === 'late')    { textColor = (emp.late_count || 0) > 0 ? colors.amber : colors.gray; }
        if (col.key === 'hd')      { textColor = (emp.half_day_count || 0) > 0 ? colors.orange : colors.gray; }
        if (col.key === 'leaves')  { textColor = (emp.full_day_leaves || 0) > 0 ? colors.blue : colors.gray; }
        if (col.key === 'paidlv')  { textColor = (emp.paid_leave_days || 0) > 0 ? colors.cyan : colors.gray; }
        if (col.key === 'final')   { textColor = colors.purple; fontStyle = 'Helvetica-Bold'; }
        if (col.key === 'cut')     { textColor = emp.total_deduction > 0 ? colors.danger : colors.gray; }
        if (col.key === 'net')     { textColor = colors.primary; fontStyle = 'Helvetica-Bold'; }
        if (col.key === 'salary')  { fontStyle = 'Helvetica-Bold'; }

        doc
          .fillColor(textColor)
          .fontSize(cellFS)
          .font(fontStyle)
          .text(value, xR + 2, cellY, {
            width: col.width - 4,
            align: col.align,
            lineBreak: false,
            ellipsis: true,
          });

        xR += col.width;
      });

      doc
        .moveTo(tableLeft, y + rowH)
        .lineTo(tableLeft + tableWidth, y + rowH)
        .strokeColor('#E5E7EB')
        .lineWidth(0.3)
        .stroke();

      y += rowH;
    });

    // ════════════════════════════════════════════
    // TOTAL ROW
    // ════════════════════════════════════════════
    doc.rect(tableLeft, y, tableWidth, TOTAL_ROW_H).fill(colors.primary);

    const totalPresent = payrollData.reduce((s, p) => s + (p.total_present || 0), 0);
    const totalLate    = payrollData.reduce((s, p) => s + (p.late_count || 0), 0);
    const totalHD      = payrollData.reduce((s, p) => s + (p.half_day_count || 0), 0);
    const totalLeaves  = payrollData.reduce((s, p) => s + (p.full_day_leaves || 0), 0);
    const totalPaidLv  = payrollData.reduce((s, p) => s + (p.paid_leave_days || 0), 0);

    let xT = tableLeft;
    const totalTextY = y + (TOTAL_ROW_H - 9) / 2;

    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');

    // Label - Sr + Name columns
    doc.text('TOTAL', xT + 5, totalTextY, {
      width: cols[0].width + cols[1].width - 10,
      align: 'left',
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
      doc.text(val, xT + 2, totalTextY, {
        width: cols[idx].width - 4,
        align: 'center',
      });
      xT += cols[idx].width;
    });

    // Skip Final Days and %
    xT += cols[7].width + cols[8].width;

    // Salary
    doc.text(formatINRPlain(totalSalary), xT + 2, totalTextY, {
      width: cols[9].width - 4,
      align: 'right',
    });
    xT += cols[9].width;

    // Cut
    doc.text(formatINRPlain(totalCut), xT + 2, totalTextY, {
      width: cols[10].width - 4,
      align: 'right',
    });
    xT += cols[10].width;

    // Net
    doc.text(formatINRPlain(totalEarned), xT + 2, totalTextY, {
      width: cols[11].width - 4,
      align: 'right',
    });

    y += TOTAL_ROW_H + 10;

    // ════════════════════════════════════════════
    // SUMMARY BOX
    // ════════════════════════════════════════════
    doc.roundedRect(tableLeft, y, tableWidth, SUMMARY_H - 5, 4).fillAndStroke(colors.light, '#D1D5DB');

    doc
      .fillColor(colors.dark)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('PAYROLL SUMMARY', tableLeft + 12, y + 8);

    const sumY = y + 24;
    const sumColW = (tableWidth - 24) / 4;

    doc.fontSize(8).fillColor(colors.gray).font('Helvetica').text('Total Salary', tableLeft + 12, sumY);
    doc.fontSize(12).fillColor(colors.dark).font('Helvetica-Bold').text(formatINR(totalSalary), tableLeft + 12, sumY + 11);

    doc.fontSize(8).fillColor(colors.gray).font('Helvetica').text('Total Earned', tableLeft + 12 + sumColW, sumY);
    doc.fontSize(12).fillColor(colors.success).font('Helvetica-Bold').text(formatINR(totalEarned), tableLeft + 12 + sumColW, sumY + 11);

    doc.fontSize(8).fillColor(colors.gray).font('Helvetica').text('Total Cut', tableLeft + 12 + sumColW * 2, sumY);
    doc.fontSize(12).fillColor(colors.danger).font('Helvetica-Bold').text(formatINR(totalCut), tableLeft + 12 + sumColW * 2, sumY + 11);

    doc.fontSize(8).fillColor(colors.gray).font('Helvetica').text('NET PAYABLE', tableLeft + 12 + sumColW * 3, sumY);
    doc.fontSize(13).fillColor(colors.primary).font('Helvetica-Bold').text(formatINR(totalEarned), tableLeft + 12 + sumColW * 3, sumY + 11);

    y += SUMMARY_H;

    // ════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════
    doc
      .moveTo(MARGIN, y)
      .lineTo(PAGE_W - MARGIN, y)
      .strokeColor('#E5E7EB')
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(7)
      .fillColor(colors.gray)
      .font('Helvetica')
      .text(
        `${company.name} | Payroll Report | ${monthName} ${currentYear} | Days Based`,
        MARGIN,
        y + 5,
        { width: PAGE_W - MARGIN * 2, align: 'center' }
      );

    doc
      .fontSize(6.5)
      .text(
        `Generated by Attendance System on ${new Date().toLocaleString('en-IN')}`,
        MARGIN,
        y + 14,
        { width: PAGE_W - MARGIN * 2, align: 'center' }
      );

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

module.exports = { downloadPayrollPDF };
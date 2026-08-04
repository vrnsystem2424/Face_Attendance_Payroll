

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

//     const HEADER_H = 60;
//     const INFO_H = 20;
//     const COL_HEADER_H = 20;
//     const TOTAL_ROW_H = 20;
//     const SUMMARY_H = 55;
//     const FOOTER_H = 25;
//     const GAPS = 15;

//     let rowH;
//     if (empCount <= 20) rowH = 18;
//     else if (empCount <= 30) rowH = 16;
//     else if (empCount <= 40) rowH = 14;
//     else if (empCount <= 50) rowH = 12;
//     else rowH = 11;

//     const cellFS = rowH >= 16 ? 8 : rowH >= 14 ? 7.5 : rowH >= 12 ? 7 : 6.5;
//     const headerFS = rowH >= 14 ? 8 : 7;

//     const rowsHeight = rowH * empCount;
//     const PAGE_H = MARGIN + HEADER_H + INFO_H + COL_HEADER_H + rowsHeight + TOTAL_ROW_H + GAPS + SUMMARY_H + FOOTER_H + MARGIN;
//     const PAGE_W = 900;

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

//     doc.moveTo(MARGIN, 62).lineTo(PAGE_W - MARGIN, 62).strokeColor(colors.primary).lineWidth(0.8).stroke();

//     // ════════════════════════════════════════════
//     // INFO ROW
//     // ════════════════════════════════════════════
//     let y = 70;
//     const firstEmp = payrollData[0] || {};

//     const infoItems = [
//       { label: 'Employees: ', value: `${payrollData.length}` },
//       { label: 'Total Days: ', value: `${firstEmp.total_working_days || 0}` },
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
//     // TABLE - NO ABSENT COLUMN
//     // ════════════════════════════════════════════
//     const tableLeft = MARGIN;
//     const tableWidth = PAGE_W - MARGIN * 2;

//     const cols = [
//       { key: 'sr',      label: 'Sr',         width: 25,  align: 'left'   },
//       { key: 'name',    label: 'Name',       width: 155, align: 'left'   },
//       { key: 'present', label: 'Present',    width: 60,  align: 'center' },
//       { key: 'late',    label: 'Late',       width: 50,  align: 'center' },
//       { key: 'hd',      label: 'HD',         width: 45,  align: 'center' },
//       { key: 'leaves',  label: 'Leaves',     width: 55,  align: 'center' },
//       { key: 'paidlv',  label: 'Paid Lv',    width: 60,  align: 'center' },
//       { key: 'final',   label: 'Final Days', width: 70,  align: 'center' },
//       { key: 'pct',     label: '%',          width: 55,  align: 'center' },
//       { key: 'salary',  label: 'Salary',     width: 80,  align: 'right'  },
//       { key: 'cut',     label: 'Cut',        width: 75,  align: 'right'  },
//       { key: 'net',     label: 'Net',        width: 85,  align: 'right'  },
//     ];

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
//     // ROWS
//     // ════════════════════════════════════════════
//     payrollData.forEach((emp, idx) => {
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

//       const rowData = {
//         sr:      `${idx + 1}`,
//         name:    emp.name || '-',
//         present: `${emp.total_present || 0}`,
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
//     const totalLate    = payrollData.reduce((s, p) => s + (p.late_count || 0), 0);
//     const totalHD      = payrollData.reduce((s, p) => s + (p.half_day_count || 0), 0);
//     const totalLeaves  = payrollData.reduce((s, p) => s + (p.full_day_leaves || 0), 0);
//     const totalPaidLv  = payrollData.reduce((s, p) => s + (p.paid_leave_days || 0), 0);

//     let xT = tableLeft;
//     const totalTextY = y + (TOTAL_ROW_H - 9) / 2;

//     doc.fillColor('white').fontSize(9).font('Helvetica-Bold');

//     // Label - Sr + Name columns
//     doc.text('TOTAL', xT + 5, totalTextY, {
//       width: cols[0].width + cols[1].width - 10,
//       align: 'left',
//     });
//     xT += cols[0].width + cols[1].width;

//     const totalValues = [
//       { val: `${totalPresent}`, idx: 2 },
//       { val: `${totalLate}`,    idx: 3 },
//       { val: `${totalHD}`,      idx: 4 },
//       { val: `${totalLeaves}`,  idx: 5 },
//       { val: `${totalPaidLv}`,  idx: 6 },
//     ];

//     totalValues.forEach(({ val, idx }) => {
//       doc.text(val, xT + 2, totalTextY, {
//         width: cols[idx].width - 4,
//         align: 'center',
//       });
//       xT += cols[idx].width;
//     });

//     // Skip Final Days and %
//     xT += cols[7].width + cols[8].width;

//     // Salary
//     doc.text(formatINRPlain(totalSalary), xT + 2, totalTextY, {
//       width: cols[9].width - 4,
//       align: 'right',
//     });
//     xT += cols[9].width;

//     // Cut
//     doc.text(formatINRPlain(totalCut), xT + 2, totalTextY, {
//       width: cols[10].width - 4,
//       align: 'right',
//     });
//     xT += cols[10].width;

//     // Net
//     doc.text(formatINRPlain(totalEarned), xT + 2, totalTextY, {
//       width: cols[11].width - 4,
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





//////////////////


const PDFDocument = require('pdfkit');
const { calculateEmployeePayroll } = require('./payrollController');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const MonthlySettings = require('../models/MonthlySettings');

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
    // 🎯 A4 LANDSCAPE - Exactly 2 pages
    // ════════════════════════════════════════════
    const PAGE_W = 842;
    const PAGE_H = 595;
    const MARGIN = 25;

    const empCount = payrollData.length;

    // Split into 2 pages
    const employeesPerPage = Math.ceil(empCount / 2);

    // Section heights
    const HEADER_H = 62;
    const INFO_H = 22;
    const COL_HEADER_H = 24;
    const TOTAL_ROW_H = 24;

    // Available space for rows
    // Page 1: full space for rows
    // Page 2: space for rows + total row
    const availableHeightP1 = PAGE_H - MARGIN - HEADER_H - INFO_H - COL_HEADER_H - MARGIN;
    const availableHeightP2 = PAGE_H - MARGIN - HEADER_H - INFO_H - COL_HEADER_H - TOTAL_ROW_H - 8 - MARGIN;

    // Use smaller available height to fit both
    const availableHeight = Math.min(availableHeightP1, availableHeightP2 + TOTAL_ROW_H + 8);
    
    // Row height calculation
    let rowH = Math.floor(availableHeightP2 / employeesPerPage);
    rowH = Math.min(Math.max(rowH, 14), 22);

    // Font sizes
    const cellFS = rowH >= 20 ? 9.5 : rowH >= 17 ? 9 : 8.5;
    const headerFS = 9.5;

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

    // Table columns
    const tableLeft = MARGIN;
    const tableWidth = PAGE_W - MARGIN * 2;

    const cols = [
      { key: 'sr',      label: 'Sr',         width: 28,  align: 'left'   },
      { key: 'name',    label: 'Name',       width: 140, align: 'left'   },
      { key: 'present', label: 'Present',    width: 55,  align: 'center' },
      { key: 'late',    label: 'Late',       width: 48,  align: 'center' },
      { key: 'hd',      label: 'HD',         width: 45,  align: 'center' },
      { key: 'leaves',  label: 'Leaves',     width: 52,  align: 'center' },
      { key: 'paidlv',  label: 'Paid Lv',    width: 55,  align: 'center' },
      { key: 'final',   label: 'Final Days', width: 68,  align: 'center' },
      { key: 'pct',     label: '%',          width: 52,  align: 'center' },
      { key: 'salary',  label: 'Salary',     width: 75,  align: 'right'  },
      { key: 'cut',     label: 'Cut',        width: 70,  align: 'right'  },
      { key: 'net',     label: 'Net',        width: 80,  align: 'right'  },
    ];

    const totalColW = cols.reduce((s, c) => s + c.width, 0);
    const scale = tableWidth / totalColW;
    cols.forEach((c) => (c.width = c.width * scale));

    // ════════════════════════════════════════════
    // DRAW HEADER
    // ════════════════════════════════════════════
    const drawHeader = (pageNum, totalPages) => {
      doc.rect(0, 0, PAGE_W, 5).fill(colors.primary);

      doc
        .fillColor(colors.dark)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(company.name.toUpperCase(), MARGIN, 13);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(colors.gray)
        .text(companyAddress, MARGIN, 33, { width: 400 });

      doc
        .fillColor(colors.primary)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('PAYROLL REPORT', PAGE_W - 220, 13, { width: 200, align: 'right' });

      doc
        .fillColor(colors.dark)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`${monthName} ${currentYear}`, PAGE_W - 220, 30, { width: 200, align: 'right' });

      doc.roundedRect(PAGE_W - 100, 46, 80, 13, 3).fill(colors.blue);
      doc
        .fillColor('white')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`PAGE ${pageNum} OF ${totalPages}`, PAGE_W - 100, 50, { width: 80, align: 'center' });

      doc.moveTo(MARGIN, 63).lineTo(PAGE_W - MARGIN, 63).strokeColor(colors.primary).lineWidth(1).stroke();
    };

    // ════════════════════════════════════════════
    // INFO ROW
    // ════════════════════════════════════════════
    const drawInfoRow = (y, pageEmployees) => {
      const firstEmp = pageEmployees[0] || {};
      const infoItems = [
        { label: 'Employees: ', value: `${pageEmployees.length} / ${payrollData.length}` },
        { label: 'Total Days: ', value: `${firstEmp.total_working_days || 0}` },
        { label: 'Generated: ', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
      ];

      let infoX = MARGIN;
      infoItems.forEach((item) => {
        doc.fontSize(9.5).fillColor(colors.gray).font('Helvetica').text(item.label, infoX, y, {
          continued: true,
        });
        doc.fillColor(colors.dark).font('Helvetica-Bold').text(item.value);
        infoX += 240;
      });
    };

    // ════════════════════════════════════════════
    // COLUMN HEADER
    // ════════════════════════════════════════════
    const drawColumnHeader = (y) => {
      doc.rect(tableLeft, y, tableWidth, COL_HEADER_H).fill(colors.dark);

      let hx = tableLeft;
      const hTextY = y + (COL_HEADER_H - headerFS) / 2 - 1;

      cols.forEach((col) => {
        doc
          .fillColor('white')
          .fontSize(headerFS)
          .font('Helvetica-Bold')
          .text(col.label, hx + 3, hTextY, {
            width: col.width - 6,
            align: col.align,
            lineBreak: false,
          });
        hx += col.width;
      });
    };

    // ════════════════════════════════════════════
    // EMPLOYEE ROWS
    // ════════════════════════════════════════════
    const drawRows = (pageEmployees, startY, startIdx) => {
      let y = startY;

      pageEmployees.forEach((emp, idx) => {
        const actualIdx = startIdx + idx;

        if (idx % 2 === 0) {
          doc.rect(tableLeft, y, tableWidth, rowH).fill(colors.light);
        }

        let bgX = tableLeft;
        cols.forEach((c) => {
          if (c.key === 'final') {
            doc.rect(bgX, y, c.width, rowH).fill('#F5F3FF');
          }
          bgX += c.width;
        });

        const rowData = {
          sr:      `${actualIdx + 1}`,
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
            .text(value, xR + 3, cellY, {
              width: col.width - 6,
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
          .lineWidth(0.4)
          .stroke();

        y += rowH;
      });

      return y;
    };

    // ════════════════════════════════════════════
    // TOTAL ROW
    // ════════════════════════════════════════════
    const drawTotalRow = (y) => {
      doc.rect(tableLeft, y, tableWidth, TOTAL_ROW_H).fill(colors.primary);

      const totalPresent = payrollData.reduce((s, p) => s + (p.total_present || 0), 0);
      const totalLate    = payrollData.reduce((s, p) => s + (p.late_count || 0), 0);
      const totalHD      = payrollData.reduce((s, p) => s + (p.half_day_count || 0), 0);
      const totalLeaves  = payrollData.reduce((s, p) => s + (p.full_day_leaves || 0), 0);
      const totalPaidLv  = payrollData.reduce((s, p) => s + (p.paid_leave_days || 0), 0);

      let xT = tableLeft;
      const totalTextY = y + (TOTAL_ROW_H - 10.5) / 2;

      doc.fillColor('white').fontSize(10.5).font('Helvetica-Bold');

      doc.text('GRAND TOTAL', xT + 6, totalTextY, {
        width: cols[0].width + cols[1].width - 12,
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
        doc.text(val, xT + 3, totalTextY, {
          width: cols[idx].width - 6,
          align: 'center',
        });
        xT += cols[idx].width;
      });

      xT += cols[7].width + cols[8].width;

      doc.text(formatINRPlain(totalSalary), xT + 3, totalTextY, {
        width: cols[9].width - 6,
        align: 'right',
      });
      xT += cols[9].width;

      doc.text(formatINRPlain(totalCut), xT + 3, totalTextY, {
        width: cols[10].width - 6,
        align: 'right',
      });
      xT += cols[10].width;

      doc.text(formatINRPlain(totalEarned), xT + 3, totalTextY, {
        width: cols[11].width - 6,
        align: 'right',
      });

      return y + TOTAL_ROW_H;
    };

    // ════════════════════════════════════════════
    // 🎯 SPLIT INTO 2 PAGES
    // ════════════════════════════════════════════
    const page1Employees = payrollData.slice(0, employeesPerPage);
    const page2Employees = payrollData.slice(employeesPerPage);
    const totalPages = page2Employees.length > 0 ? 2 : 1;

    // ═══════════════════════════════════
    // PAGE 1
    // ═══════════════════════════════════
    drawHeader(1, totalPages);
    let y = 72;
    drawInfoRow(y, page1Employees);
    y += INFO_H;
    drawColumnHeader(y);
    y += COL_HEADER_H;
    y = drawRows(page1Employees, y, 0);

    // Only 1 page - add total row at end
    if (page2Employees.length === 0) {
      y += 8;
      drawTotalRow(y);
    }

    // ═══════════════════════════════════
    // PAGE 2
    // ═══════════════════════════════════
    if (page2Employees.length > 0) {
      doc.addPage({ size: [PAGE_W, PAGE_H], margin: MARGIN });
      drawHeader(2, totalPages);
      y = 72;
      drawInfoRow(y, page2Employees);
      y += INFO_H;
      drawColumnHeader(y);
      y += COL_HEADER_H;
      y = drawRows(page2Employees, y, employeesPerPage);

      // Total row on last page
      y += 8;
      drawTotalRow(y);
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
// 🆕 DOWNLOAD CSV (for Google Sheets)
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
      const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
      payrollData.push(payroll);
    }

    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', {
      month: 'long',
    });

    // ════════════════════════════════════════
    // Build CSV
    // ════════════════════════════════════════
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = [];

    // Title Info
    rows.push([`${company.name} - Payroll Report`]);
    rows.push([`${monthName} ${currentYear}`]);
    rows.push([]); // Empty row

    // 🎯 Column Headers (Same as table - 13 columns)
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

    // Data Rows
    payrollData.forEach((emp, idx) => {
      // Combined HD (attendance + half day leaves)
      const totalHD = (emp.half_day_count || 0) + (emp.half_day_leave_count || 0);
      
      // Total leaves in days (full + half day equivalents)
      const totalLeavesDays = emp.total_leave_approved || 0;

      rows.push([
        idx + 1,
        emp.name || '',
        emp.total_present || 0,
        emp.late_count || 0,
        totalHD,
        totalLeavesDays,
        emp.paid_leave_days || 0,
        emp.leave_closing_balance || 0,
        emp.final_payable_days || 0,
        `${emp.progress_percent || 0}%`,
        emp.monthly_salary || 0,
        emp.total_deduction || 0,
        emp.net_payable || 0,
      ]);
    });

    // Grand Total Row
    rows.push([]); // Empty row
    rows.push([
      '',
      'GRAND TOTAL',
      payrollData.reduce((s, p) => s + (p.total_present || 0), 0),
      payrollData.reduce((s, p) => s + (p.late_count || 0), 0),
      payrollData.reduce((s, p) => s + ((p.half_day_count || 0) + (p.half_day_leave_count || 0)), 0),
      payrollData.reduce((s, p) => s + (p.total_leave_approved || 0), 0),
      payrollData.reduce((s, p) => s + (p.paid_leave_days || 0), 0),
      payrollData.reduce((s, p) => s + (p.leave_closing_balance || 0), 0),
      '',
      '',
      payrollData.reduce((s, p) => s + (p.monthly_salary || 0), 0),
      payrollData.reduce((s, p) => s + (p.total_deduction || 0), 0),
      payrollData.reduce((s, p) => s + (p.net_payable || 0), 0),
    ]);

    // Convert to CSV
    const csvContent = rows
      .map(row => row.map(cell => escapeCSV(cell)).join(','))
      .join('\n');

    // BOM for UTF-8
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    const filename = `Payroll_${company.code}_${monthName}_${currentYear}.csv`;
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

module.exports = { downloadPayrollPDF, downloadPayrollCSV };

module.exports = { downloadPayrollPDF, downloadPayrollCSV };


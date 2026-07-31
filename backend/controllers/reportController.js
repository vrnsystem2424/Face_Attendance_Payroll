





// // // controllers/reportController.js

// // const PDFDocument = require('pdfkit');
// // const { calculateEmployeePayroll } = require('./payrollController');
// // const Employee = require('../models/Employee');
// // const Company = require('../models/Company');
// // const MonthlySettings = require('../models/MonthlySettings');

// // // ════════════════════════════════════════════
// // // HELPERS
// // // ════════════════════════════════════════════
// // const formatINR = (num) => {
// //   if (!num && num !== 0) return '0';
// //   return 'Rs.' + Number(num).toLocaleString('en-IN');
// // };

// // const formatINRPlain = (num) => {
// //   if (!num && num !== 0) return '0';
// //   return Number(num).toLocaleString('en-IN');
// // };

// // // ════════════════════════════════════════════
// // // DOWNLOAD PAYROLL PDF (DUAL METHOD)
// // // ════════════════════════════════════════════
// // const downloadPayrollPDF = async (req, res) => {
// //   try {
// //     const { company_id, department, month, year, calc_method = 'hours' } = req.query;

// //     if (!company_id) {
// //       return res.status(400).json({ success: false, message: 'company_id required' });
// //     }

// //     const currentMonth = parseInt(month) || new Date().getMonth() + 1;
// //     const currentYear = parseInt(year) || new Date().getFullYear();
// //     const method = ['hours', 'days', 'both'].includes(calc_method) ? calc_method : 'hours';

// //     const company = await Company.findById(company_id);
// //     if (!company) {
// //       return res.status(404).json({ success: false, message: 'Company not found' });
// //     }

// //     const settings = await MonthlySettings.findOne({
// //       company_id,
// //       month: currentMonth,
// //       year: currentYear,
// //     });

// //     const filter = {
// //       company_id,
// //       status: 'approved',
// //       role: { $ne: 'super_admin' },
// //     };
// //     if (department && department !== 'all') {
// //       filter.department = department;
// //     }

// //     const employees = await Employee.find(filter).sort({ name: 1 });

// //     if (employees.length === 0) {
// //       return res.status(404).json({ success: false, message: 'No employees found' });
// //     }

// //     // Calculate payroll
// //     const payrollData = [];
// //     for (const emp of employees) {
// //       const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
// //       payrollData.push(payroll);
// //     }

// //     // ═══ TOTALS based on method ═══
// //     const totalSalary = payrollData.reduce((s, p) => s + p.monthly_salary, 0);
// //     const totalEarnedHours = payrollData.reduce((s, p) => s + p.hours_based.earned, 0);
// //     const totalDeductHours = payrollData.reduce((s, p) => s + p.hours_based.deduction, 0);
// //     const totalEarnedDays = payrollData.reduce((s, p) => s + p.days_based.earned, 0);
// //     const totalDeductDays = payrollData.reduce((s, p) => s + p.days_based.deduction, 0);

// //     const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' });

// //     // ════════════════════════════════════════════
// //     // CREATE PDF — A4 LANDSCAPE
// //     // ════════════════════════════════════════════
// //     const doc = new PDFDocument({
// //       size: 'A4',
// //       layout: 'landscape',
// //       margin: 20,
// //       info: {
// //         Title: `${company.name} Payroll - ${monthName} ${currentYear}`,
// //         Author: 'Attendance System',
// //       },
// //     });

// //     const filename = `Payroll_${company.code}_${monthName}_${currentYear}_${method.toUpperCase()}.pdf`;
// //     res.setHeader('Content-Type', 'application/pdf');
// //     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
// //     doc.pipe(res);

// //     const colors = {
// //       primary: '#E8590C',
// //       dark: '#1A1A2E',
// //       gray: '#6B7280',
// //       light: '#F3F4F6',
// //       success: '#16A34A',
// //       danger: '#DC2626',
// //       blue: '#2563EB',
// //       orangeLight: '#FFF3E8',
// //       blueLight: '#EFF6FF',
// //     };

// //     const PAGE_W = doc.page.width;   // ~842 (landscape A4)
// //     const PAGE_H = doc.page.height;  // ~595

// //     // ════════════════════════════════════════════
// //     // HEADER — Compact
// //     // ════════════════════════════════════════════
// //     doc.rect(0, 0, PAGE_W, 6).fill(colors.primary);

// //     doc.fillColor(colors.dark)
// //        .fontSize(16)
// //        .font('Helvetica-Bold')
// //        .text(company.name.toUpperCase(), 20, 14);

// //     if (company.address) {
// //       doc.fontSize(7.5)
// //          .font('Helvetica')
// //          .fillColor(colors.gray)
// //          .text(company.address, 20, 33, { width: 400 });
// //     }

// //     // Right side info
// //     doc.fillColor(colors.primary)
// //        .fontSize(11)
// //        .font('Helvetica-Bold')
// //        .text('PAYROLL REPORT', PAGE_W - 200, 14, { width: 180, align: 'right' });

// //     doc.fillColor(colors.dark)
// //        .fontSize(9)
// //        .font('Helvetica-Bold')
// //        .text(`${monthName} ${currentYear}`, PAGE_W - 200, 28, { width: 180, align: 'right' });

// //     // Method badge
// //     const methodLabel = method === 'hours' ? 'HOURS BASED' : method === 'days' ? 'DAYS BASED' : 'COMPARE';
// //     const methodColor = method === 'hours' ? colors.primary : method === 'days' ? colors.blue : '#7C3AED';
    
// //     doc.roundedRect(PAGE_W - 100, 42, 80, 13, 3).fill(methodColor);
// //     doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
// //        .text(methodLabel, PAGE_W - 100, 46, { width: 80, align: 'center' });

// //     // Separator
// //     doc.moveTo(20, 60).lineTo(PAGE_W - 20, 60).strokeColor(colors.primary).lineWidth(0.8).stroke();

// //     // ════════════════════════════════════════════
// //     // INFO ROW — Compact single line
// //     // ════════════════════════════════════════════
// //     let y = 67;
// //     doc.fontSize(8).font('Helvetica').fillColor(colors.gray);
    
// //     const firstEmp = payrollData[0] || {};
// //     const infoItems = [
// //       { label: 'Department: ', value: department && department !== 'all' ? department : 'All' },
// //       { label: 'Employees: ', value: `${payrollData.length}` },
// //       { label: 'Working Days: ', value: `${firstEmp.total_working_days || 0}` },
// //       { label: 'Required Hrs: ', value: `${firstEmp.targeted_hours || 0}h` },
// //       { label: 'Generated: ', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
// //     ];

// //     let infoX = 20;
// //     infoItems.forEach((item) => {
// //       doc.fillColor(colors.gray).font('Helvetica').text(item.label, infoX, y, { continued: true });
// //       doc.fillColor(colors.dark).font('Helvetica-Bold').text(item.value);
// //       infoX += 145;
// //     });

// //     y = 85;

// //     // ════════════════════════════════════════════
// //     // TABLE — Dynamic columns based on method
// //     // ════════════════════════════════════════════
// //     const tableLeft = 20;
// //     const tableWidth = PAGE_W - 40;

// //     // ═══ Column definitions based on method ═══
// //     let cols;
// //     if (method === 'both') {
// //       // COMPARE: All columns visible
// //       cols = [
// //         { key: 'sr',       label: 'Sr',       width: 22,  align: 'left' },
// //         { key: 'code',     label: 'Code',     width: 48,  align: 'left' },
// //         { key: 'name',     label: 'Name',     width: 95,  align: 'left' },
// //         { key: 'dept',     label: 'Dept',     width: 55,  align: 'left' },
// //         { key: 'present',  label: 'P',        width: 25,  align: 'center' },
// //         { key: 'absent',   label: 'A',        width: 25,  align: 'center' },
// //         { key: 'leave',    label: 'L',        width: 25,  align: 'center' },
// //         { key: 'hours',    label: 'Worked',   width: 55,  align: 'center' },
// //         { key: 'salary',   label: 'Salary',   width: 60,  align: 'right' },
// //         // HOURS group
// //         { key: 'h_pct',    label: 'H%',       width: 35,  align: 'center', bg: colors.orangeLight, group: 'hours' },
// //         { key: 'h_deduct', label: 'H-Cut',    width: 55,  align: 'right',  bg: colors.orangeLight, group: 'hours' },
// //         { key: 'h_net',    label: 'H-Net',    width: 60,  align: 'right',  bg: colors.orangeLight, group: 'hours' },
// //         // DAYS group
// //         { key: 'd_pct',    label: 'D%',       width: 35,  align: 'center', bg: colors.blueLight, group: 'days' },
// //         { key: 'd_deduct', label: 'D-Cut',    width: 55,  align: 'right',  bg: colors.blueLight, group: 'days' },
// //         { key: 'd_net',    label: 'D-Net',    width: 60,  align: 'right',  bg: colors.blueLight, group: 'days' },
// //       ];
// //     } else {
// //       // SINGLE: Hours OR Days
// //       const single = method === 'hours' ? 'H' : 'D';
// //       cols = [
// //         { key: 'sr',       label: 'Sr',       width: 25,  align: 'left' },
// //         { key: 'code',     label: 'Code',     width: 60,  align: 'left' },
// //         { key: 'name',     label: 'Employee', width: 130, align: 'left' },
// //         { key: 'dept',     label: 'Department', width: 90, align: 'left' },
// //         { key: 'present',  label: 'Present',  width: 45,  align: 'center' },
// //         { key: 'absent',   label: 'Absent',   width: 45,  align: 'center' },
// //         { key: 'leave',    label: 'Leave',    width: 45,  align: 'center' },
// //         { key: 'hours',    label: 'Worked',   width: 65,  align: 'center' },
// //         { key: 'pct',      label: `${single}%`, width: 50,  align: 'center' },
// //         { key: 'salary',   label: 'Salary',   width: 75,  align: 'right' },
// //         { key: 'earned',   label: 'Earned',   width: 75,  align: 'right' },
// //         { key: 'deduct',   label: 'Deduct',   width: 70,  align: 'right' },
// //         { key: 'net',      label: 'Net Pay',  width: 75,  align: 'right' },
// //       ];
// //     }

// //     // Normalize widths to fit tableWidth
// //     const totalColW = cols.reduce((s, c) => s + c.width, 0);
// //     const scale = tableWidth / totalColW;
// //     cols.forEach(c => c.width = c.width * scale);

// //     // ═══ Calculate available row height ═══
// //     const headerH = method === 'both' ? 28 : 22;
// //     const totalRowH = 20;
// //     const summaryH = 70;
// //     const footerH = 25;
// //     const availableH = PAGE_H - y - headerH - totalRowH - summaryH - footerH - 10;
// //     const rowH = Math.max(12, Math.min(18, Math.floor(availableH / payrollData.length)));
// //     const cellFontSize = rowH < 14 ? 6.5 : rowH < 16 ? 7 : 7.5;
// //     const headerFontSize = method === 'both' ? 6.5 : 7.5;

// //     // ════════════════════════════════════════════
// //     // DRAW TABLE HEADER
// //     // ════════════════════════════════════════════
// //     const drawHeader = (startY) => {
// //       // Group label row (only for 'both' method)
// //       if (method === 'both') {
// //         let groupX = tableLeft;
// //         cols.forEach(c => {
// //           if (!c.group) groupX += c.width;
// //         });

// //         // HOURS group label
// //         const hoursCols = cols.filter(c => c.group === 'hours');
// //         const hoursW = hoursCols.reduce((s, c) => s + c.width, 0);
// //         doc.rect(groupX, startY, hoursW, 12).fill(colors.primary);
// //         doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
// //            .text('HOURS BASED', groupX, startY + 3, { width: hoursW, align: 'center' });
// //         groupX += hoursW;

// //         // DAYS group label
// //         const daysCols = cols.filter(c => c.group === 'days');
// //         const daysW = daysCols.reduce((s, c) => s + c.width, 0);
// //         doc.rect(groupX, startY, daysW, 12).fill(colors.blue);
// //         doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
// //            .text('DAYS BASED', groupX, startY + 3, { width: daysW, align: 'center' });
// //       }

// //       // Main column header row
// //       const mainHeaderY = method === 'both' ? startY + 12 : startY;
// //       const mainHeaderH = method === 'both' ? 16 : 22;

// //       doc.rect(tableLeft, mainHeaderY, tableWidth, mainHeaderH).fill(colors.dark);

// //       let x = tableLeft;
// //       const textY = mainHeaderY + (mainHeaderH - cellFontSize) / 2 - 1;

// //       cols.forEach(col => {
// //         doc.fillColor('white').fontSize(headerFontSize).font('Helvetica-Bold')
// //            .text(col.label, x + 2, textY, {
// //              width: col.width - 4,
// //              align: col.align,
// //              lineBreak: false,
// //            });
// //         x += col.width;
// //       });
// //     };

// //     drawHeader(y);
// //     let rowY = y + headerH;

// //     // ════════════════════════════════════════════
// //     // DRAW TABLE ROWS
// //     // ════════════════════════════════════════════
// //     payrollData.forEach((emp, idx) => {
// //       // New page check
// //       if (rowY + rowH > PAGE_H - summaryH - footerH - 30) {
// //         doc.addPage();
// //         rowY = 20;
// //         drawHeader(rowY);
// //         rowY += headerH;
// //       }

// //       // Alternate row bg
// //       if (idx % 2 === 0) {
// //         doc.rect(tableLeft, rowY, tableWidth, rowH).fill(colors.light);
// //       }

// //       // Group column backgrounds for 'both' method
// //       if (method === 'both') {
// //         let bgX = tableLeft;
// //         cols.forEach(c => {
// //           if (c.bg) {
// //             doc.rect(bgX, rowY, c.width, rowH).fill(c.bg);
// //           }
// //           bgX += c.width;
// //         });
// //       }

// //       // Get values based on method
// //       let rowData = {};
// //       const totalLeave = (emp.paid_leave_days || 0) + (emp.unpaid_leave_days || 0);

// //       if (method === 'both') {
// //         rowData = {
// //           sr: `${idx + 1}`,
// //           code: emp.emp_code || '-',
// //           name: emp.name || '-',
// //           dept: emp.department || '-',
// //           present: `${emp.total_present || 0}`,
// //           absent: `${emp.total_absent || 0}`,
// //           leave: `${totalLeave}`,
// //           hours: emp.worked_hours || '-',
// //           salary: formatINRPlain(emp.monthly_salary),
// //           h_pct: `${emp.hours_based.progress_percent}%`,
// //           h_deduct: formatINRPlain(emp.hours_based.deduction),
// //           h_net: formatINRPlain(emp.hours_based.net_payable),
// //           d_pct: `${emp.days_based.progress_percent}%`,
// //           d_deduct: formatINRPlain(emp.days_based.deduction),
// //           d_net: formatINRPlain(emp.days_based.net_payable),
// //         };
// //       } else {
// //         const data = method === 'hours' ? emp.hours_based : emp.days_based;
// //         rowData = {
// //           sr: `${idx + 1}`,
// //           code: emp.emp_code || '-',
// //           name: emp.name || '-',
// //           dept: emp.department || '-',
// //           present: `${emp.total_present || 0}`,
// //           absent: `${emp.total_absent || 0}`,
// //           leave: `${totalLeave}`,
// //           hours: emp.worked_hours || '-',
// //           pct: `${data.progress_percent}%`,
// //           salary: formatINRPlain(emp.monthly_salary),
// //           earned: formatINRPlain(data.earned),
// //           deduct: formatINRPlain(data.deduction),
// //           net: formatINRPlain(data.net_payable),
// //         };
// //       }

// //       // Draw cells
// //       let xR = tableLeft;
// //       const cellY = rowY + (rowH - cellFontSize) / 2 - 1;

// //       cols.forEach(col => {
// //         const value = rowData[col.key] || '-';
// //         let textColor = colors.dark;
// //         let fontStyle = 'Helvetica';

// //         // Style by column
// //         if (col.key === 'code') fontStyle = 'Helvetica-Bold';
// //         if (col.key === 'dept') textColor = colors.gray;
// //         if (col.key === 'present') textColor = colors.success;
// //         if (col.key === 'absent') textColor = emp.total_absent > 0 ? colors.danger : colors.gray;
// //         if (col.key === 'h_deduct' || col.key === 'd_deduct' || col.key === 'deduct') {
// //           textColor = colors.danger;
// //         }
// //         if (col.key === 'earned') textColor = colors.success;
// //         if (col.key === 'h_net' || col.key === 'net') {
// //           textColor = colors.primary;
// //           fontStyle = 'Helvetica-Bold';
// //         }
// //         if (col.key === 'd_net') {
// //           textColor = colors.blue;
// //           fontStyle = 'Helvetica-Bold';
// //         }
// //         if (col.key === 'salary') fontStyle = 'Helvetica-Bold';

// //         doc.fillColor(textColor).fontSize(cellFontSize).font(fontStyle)
// //            .text(value, xR + 2, cellY, {
// //              width: col.width - 4,
// //              align: col.align,
// //              lineBreak: false,
// //              ellipsis: true,
// //            });

// //         xR += col.width;
// //       });

// //       // Row border bottom
// //       doc.moveTo(tableLeft, rowY + rowH)
// //          .lineTo(tableLeft + tableWidth, rowY + rowH)
// //          .strokeColor('#E5E7EB').lineWidth(0.3).stroke();

// //       rowY += rowH;
// //     });

// //     // ════════════════════════════════════════════
// //     // TOTAL ROW
// //     // ════════════════════════════════════════════
// //     if (rowY + totalRowH > PAGE_H - summaryH - footerH - 10) {
// //       doc.addPage();
// //       rowY = 20;
// //     }

// //     doc.rect(tableLeft, rowY, tableWidth, totalRowH).fill(colors.primary);

// //     let xT = tableLeft;
// //     const totalY = rowY + (totalRowH - 9) / 2;

// //     // "TOTAL" label spans first columns
// //     if (method === 'both') {
// //       // Span: sr, code, name, dept, present, absent, leave, hours
// //       const labelCols = cols.slice(0, 8);
// //       const labelW = labelCols.reduce((s, c) => s + c.width, 0);
// //       doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
// //          .text('GRAND TOTAL', xT + 5, totalY, { width: labelW - 10, align: 'left' });
// //       xT += labelW;

// //       // Salary
// //       doc.text(formatINRPlain(totalSalary), xT + 2, totalY, {
// //         width: cols[8].width - 4, align: 'right',
// //       });
// //       xT += cols[8].width;

// //       // Hours group
// //       doc.fillColor('#FFE4D0').text('-', xT + 2, totalY, { width: cols[9].width - 4, align: 'center' });
// //       xT += cols[9].width;
// //       doc.fillColor('white').text(formatINRPlain(totalDeductHours), xT + 2, totalY, { width: cols[10].width - 4, align: 'right' });
// //       xT += cols[10].width;
// //       doc.text(formatINRPlain(totalEarnedHours), xT + 2, totalY, { width: cols[11].width - 4, align: 'right' });
// //       xT += cols[11].width;

// //       // Days group
// //       doc.fillColor('#DBEAFE').text('-', xT + 2, totalY, { width: cols[12].width - 4, align: 'center' });
// //       xT += cols[12].width;
// //       doc.fillColor('white').text(formatINRPlain(totalDeductDays), xT + 2, totalY, { width: cols[13].width - 4, align: 'right' });
// //       xT += cols[13].width;
// //       doc.text(formatINRPlain(totalEarnedDays), xT + 2, totalY, { width: cols[14].width - 4, align: 'right' });
// //     } else {
// //       const labelCols = cols.slice(0, 9);
// //       const labelW = labelCols.reduce((s, c) => s + c.width, 0);
// //       doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
// //          .text('GRAND TOTAL', xT + 5, totalY, { width: labelW - 10, align: 'left' });
// //       xT += labelW;

// //       const totalEarned = method === 'hours' ? totalEarnedHours : totalEarnedDays;
// //       const totalDeduct = method === 'hours' ? totalDeductHours : totalDeductDays;

// //       doc.text(formatINRPlain(totalSalary), xT + 2, totalY, { width: cols[9].width - 4, align: 'right' });
// //       xT += cols[9].width;
// //       doc.text(formatINRPlain(totalEarned), xT + 2, totalY, { width: cols[10].width - 4, align: 'right' });
// //       xT += cols[10].width;
// //       doc.text(formatINRPlain(totalDeduct), xT + 2, totalY, { width: cols[11].width - 4, align: 'right' });
// //       xT += cols[11].width;
// //       doc.text(formatINRPlain(totalEarned), xT + 2, totalY, { width: cols[12].width - 4, align: 'right' });
// //     }

// //     rowY += totalRowH + 8;

// //     // ════════════════════════════════════════════
// //     // SUMMARY BOX
// //     // ════════════════════════════════════════════
// //     if (rowY + summaryH > PAGE_H - footerH - 10) {
// //       doc.addPage();
// //       rowY = 20;
// //     }

// //     doc.roundedRect(tableLeft, rowY, tableWidth, summaryH - 5, 4)
// //        .fillAndStroke(colors.light, '#D1D5DB');

// //     doc.fillColor(colors.dark).fontSize(10).font('Helvetica-Bold')
// //        .text('PAYROLL SUMMARY', tableLeft + 12, rowY + 8);

// //     const sumY = rowY + 28;
// //     const sumColCount = method === 'both' ? 5 : 4;
// //     const sumColW = (tableWidth - 24) / sumColCount;

// //     // Box 1: Total Salary
// //     doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
// //        .text('Total Salary', tableLeft + 12, sumY);
// //     doc.fontSize(12).fillColor(colors.dark).font('Helvetica-Bold')
// //        .text(formatINR(totalSalary), tableLeft + 12, sumY + 11);

// //     if (method === 'both') {
// //       // Box 2: Hours Earned
// //       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
// //          .text('Hours-Based Earned', tableLeft + 12 + sumColW, sumY);
// //       doc.fontSize(12).fillColor(colors.primary).font('Helvetica-Bold')
// //          .text(formatINR(totalEarnedHours), tableLeft + 12 + sumColW, sumY + 11);

// //       // Box 3: Hours Deduction
// //       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
// //          .text('Hours-Based Cut', tableLeft + 12 + sumColW * 2, sumY);
// //       doc.fontSize(11).fillColor(colors.danger).font('Helvetica-Bold')
// //          .text(formatINR(totalDeductHours), tableLeft + 12 + sumColW * 2, sumY + 11);

// //       // Box 4: Days Earned
// //       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
// //          .text('Days-Based Earned', tableLeft + 12 + sumColW * 3, sumY);
// //       doc.fontSize(12).fillColor(colors.blue).font('Helvetica-Bold')
// //          .text(formatINR(totalEarnedDays), tableLeft + 12 + sumColW * 3, sumY + 11);

// //       // Box 5: Days Deduction
// //       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
// //          .text('Days-Based Cut', tableLeft + 12 + sumColW * 4, sumY);
// //       doc.fontSize(11).fillColor(colors.danger).font('Helvetica-Bold')
// //          .text(formatINR(totalDeductDays), tableLeft + 12 + sumColW * 4, sumY + 11);

// //       // Difference note
// //       const diff = Math.abs(totalEarnedHours - totalEarnedDays);
// //       const winner = totalEarnedHours > totalEarnedDays ? 'Hours' : 'Days';
// //       doc.fontSize(7.5).fillColor(colors.gray).font('Helvetica-Oblique')
// //          .text(`Note: ${winner}-based method pays ${formatINR(diff)} more to employees overall.`,
// //                tableLeft + 12, sumY + 38, { width: tableWidth - 24 });
// //     } else {
// //       const totalEarned = method === 'hours' ? totalEarnedHours : totalEarnedDays;
// //       const totalDeduct = method === 'hours' ? totalDeductHours : totalDeductDays;

// //       // Box 2: Total Earned
// //       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
// //          .text('Total Earned', tableLeft + 12 + sumColW, sumY);
// //       doc.fontSize(13).fillColor(colors.success).font('Helvetica-Bold')
// //          .text(formatINR(totalEarned), tableLeft + 12 + sumColW, sumY + 11);

// //       // Box 3: Total Deduction
// //       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
// //          .text('Total Deduction', tableLeft + 12 + sumColW * 2, sumY);
// //       doc.fontSize(13).fillColor(colors.danger).font('Helvetica-Bold')
// //          .text(formatINR(totalDeduct), tableLeft + 12 + sumColW * 2, sumY + 11);

// //       // Box 4: Net Payable
// //       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
// //          .text('NET PAYABLE', tableLeft + 12 + sumColW * 3, sumY);
// //       doc.fontSize(14).fillColor(colors.primary).font('Helvetica-Bold')
// //          .text(formatINR(totalEarned), tableLeft + 12 + sumColW * 3, sumY + 11);
// //     }

// //     // ════════════════════════════════════════════
// //     // FOOTER
// //     // ════════════════════════════════════════════
// //     const footerY = PAGE_H - 22;
    
// //     doc.moveTo(20, footerY - 4).lineTo(PAGE_W - 20, footerY - 4)
// //        .strokeColor('#E5E7EB').lineWidth(0.5).stroke();

// //     doc.fontSize(7).fillColor(colors.gray).font('Helvetica')
// //        .text(`${company.name} | Payroll Report | ${monthName} ${currentYear} | Method: ${methodLabel}`,
// //              20, footerY, { width: PAGE_W - 40, align: 'center' });

// //     doc.fontSize(6.5).fillColor(colors.gray)
// //        .text(`Generated by Attendance System on ${new Date().toLocaleString('en-IN')}`,
// //              20, footerY + 9, { width: PAGE_W - 40, align: 'center' });

// //     // Finalize
// //     doc.end();

// //   } catch (error) {
// //     console.error('downloadPayrollPDF error:', error);
// //     if (!res.headersSent) {
// //       return res.status(500).json({
// //         success: false,
// //         message: 'PDF generation failed',
// //         error: error.message,
// //       });
// //     }
// //   }
// // };

// // module.exports = {
// //   downloadPayrollPDF,
// // };





// // controllers/reportController.js

// const PDFDocument = require('pdfkit');
// const { calculateEmployeePayroll } = require('./payrollController');
// const Employee = require('../models/Employee');
// const Company = require('../models/Company');
// const MonthlySettings = require('../models/MonthlySettings');

// // ════════════════════════════════════════════
// // HELPERS
// // ════════════════════════════════════════════
// const formatINR = (num) => {
//   if (!num && num !== 0) return '0';
//   return 'Rs.' + Number(num).toLocaleString('en-IN');
// };

// const formatINRPlain = (num) => {
//   if (!num && num !== 0) return '0';
//   return Number(num).toLocaleString('en-IN');
// };

// // 🆕 Get proper company address (Bhopal, India as fallback)
// const getCompanyAddress = (company) => {
//   if (company.address && company.address.trim() !== '') {
//     return company.address;
//   }
//   // Default address if company address not set
//   return 'Bhopal, Madhya Pradesh, India';
// };

// // ════════════════════════════════════════════
// // DOWNLOAD PAYROLL PDF (DEFAULT: DAYS BASED)
// // ════════════════════════════════════════════
// const downloadPayrollPDF = async (req, res) => {
//   try {
//     const { company_id, department, month, year, calc_method = 'days' } = req.query;
//     // 🆕 Default changed from 'hours' to 'days'

//     if (!company_id) {
//       return res.status(400).json({ success: false, message: 'company_id required' });
//     }

//     const currentMonth = parseInt(month) || new Date().getMonth() + 1;
//     const currentYear = parseInt(year) || new Date().getFullYear();
//     const method = ['hours', 'days', 'both'].includes(calc_method) ? calc_method : 'days';
//     // 🆕 Default 'days'

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

//     // ═══ TOTALS based on method ═══
//     const totalSalary = payrollData.reduce((s, p) => s + p.monthly_salary, 0);
//     const totalEarnedHours = payrollData.reduce((s, p) => s + p.hours_based.earned, 0);
//     const totalDeductHours = payrollData.reduce((s, p) => s + p.hours_based.deduction, 0);
//     const totalEarnedDays = payrollData.reduce((s, p) => s + p.days_based.earned, 0);
//     const totalDeductDays = payrollData.reduce((s, p) => s + p.days_based.deduction, 0);

//     const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' });

//     // 🆕 Get proper address
//     const companyAddress = getCompanyAddress(company);

//     // ════════════════════════════════════════════
//     // CREATE PDF — A4 LANDSCAPE
//     // ════════════════════════════════════════════
//     const doc = new PDFDocument({
//       size: 'A4',
//       layout: 'landscape',
//       margin: 20,
//       info: {
//         Title: `${company.name} Payroll - ${monthName} ${currentYear}`,
//         Author: 'Attendance System',
//       },
//     });

//     const filename = `Payroll_${company.code}_${monthName}_${currentYear}_${method.toUpperCase()}.pdf`;
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
//       orangeLight: '#FFF3E8',
//       blueLight: '#EFF6FF',
//     };

//     const PAGE_W = doc.page.width;
//     const PAGE_H = doc.page.height;

//     // ════════════════════════════════════════════
//     // HEADER — Compact
//     // ════════════════════════════════════════════
//     doc.rect(0, 0, PAGE_W, 6).fill(colors.primary);

//     doc.fillColor(colors.dark)
//        .fontSize(16)
//        .font('Helvetica-Bold')
//        .text(company.name.toUpperCase(), 20, 14);

//     // 🆕 Use proper address (Bhopal, India as fallback)
//     doc.fontSize(7.5)
//        .font('Helvetica')
//        .fillColor(colors.gray)
//        .text(companyAddress, 20, 33, { width: 400 });

//     // Right side info
//     doc.fillColor(colors.primary)
//        .fontSize(11)
//        .font('Helvetica-Bold')
//        .text('PAYROLL REPORT', PAGE_W - 200, 14, { width: 180, align: 'right' });

//     doc.fillColor(colors.dark)
//        .fontSize(9)
//        .font('Helvetica-Bold')
//        .text(`${monthName} ${currentYear}`, PAGE_W - 200, 28, { width: 180, align: 'right' });

//     // Method badge
//     const methodLabel = method === 'hours' ? 'HOURS BASED' : method === 'days' ? 'DAYS BASED' : 'COMPARE';
//     const methodColor = method === 'hours' ? colors.primary : method === 'days' ? colors.blue : '#7C3AED';
    
//     doc.roundedRect(PAGE_W - 100, 42, 80, 13, 3).fill(methodColor);
//     doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
//        .text(methodLabel, PAGE_W - 100, 46, { width: 80, align: 'center' });

//     // Separator
//     doc.moveTo(20, 60).lineTo(PAGE_W - 20, 60).strokeColor(colors.primary).lineWidth(0.8).stroke();

//     // ════════════════════════════════════════════
//     // INFO ROW — Compact single line
//     // ════════════════════════════════════════════
//     let y = 67;
//     doc.fontSize(8).font('Helvetica').fillColor(colors.gray);
    
//     const firstEmp = payrollData[0] || {};
//     const infoItems = [
//       { label: 'Department: ', value: department && department !== 'all' ? department : 'All' },
//       { label: 'Employees: ', value: `${payrollData.length}` },
//       { label: 'Working Days: ', value: `${firstEmp.total_working_days || 0}` },
//       { label: 'Required Hrs: ', value: `${firstEmp.targeted_hours || 0}h` },
//       { label: 'Generated: ', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
//     ];

//     let infoX = 20;
//     infoItems.forEach((item) => {
//       doc.fillColor(colors.gray).font('Helvetica').text(item.label, infoX, y, { continued: true });
//       doc.fillColor(colors.dark).font('Helvetica-Bold').text(item.value);
//       infoX += 145;
//     });

//     y = 85;

//     // ════════════════════════════════════════════
//     // TABLE — Dynamic columns based on method
//     // ════════════════════════════════════════════
//     const tableLeft = 20;
//     const tableWidth = PAGE_W - 40;

//     let cols;
//     if (method === 'both') {
//       cols = [
//         { key: 'sr',       label: 'Sr',       width: 22,  align: 'left' },
//         { key: 'code',     label: 'Code',     width: 48,  align: 'left' },
//         { key: 'name',     label: 'Name',     width: 95,  align: 'left' },
//         { key: 'dept',     label: 'Dept',     width: 55,  align: 'left' },
//         { key: 'present',  label: 'P',        width: 25,  align: 'center' },
//         { key: 'absent',   label: 'A',        width: 25,  align: 'center' },
//         { key: 'leave',    label: 'L',        width: 25,  align: 'center' },
//         { key: 'hours',    label: 'Worked',   width: 55,  align: 'center' },
//         { key: 'salary',   label: 'Salary',   width: 60,  align: 'right' },
//         { key: 'h_pct',    label: 'H%',       width: 35,  align: 'center', bg: colors.orangeLight, group: 'hours' },
//         { key: 'h_deduct', label: 'H-Cut',    width: 55,  align: 'right',  bg: colors.orangeLight, group: 'hours' },
//         { key: 'h_net',    label: 'H-Net',    width: 60,  align: 'right',  bg: colors.orangeLight, group: 'hours' },
//         { key: 'd_pct',    label: 'D%',       width: 35,  align: 'center', bg: colors.blueLight, group: 'days' },
//         { key: 'd_deduct', label: 'D-Cut',    width: 55,  align: 'right',  bg: colors.blueLight, group: 'days' },
//         { key: 'd_net',    label: 'D-Net',    width: 60,  align: 'right',  bg: colors.blueLight, group: 'days' },
//       ];
//     } else {
//       const single = method === 'hours' ? 'H' : 'D';
//       cols = [
//         { key: 'sr',       label: 'Sr',       width: 25,  align: 'left' },
//         { key: 'code',     label: 'Code',     width: 60,  align: 'left' },
//         { key: 'name',     label: 'Employee', width: 130, align: 'left' },
//         { key: 'dept',     label: 'Department', width: 90, align: 'left' },
//         { key: 'present',  label: 'Present',  width: 45,  align: 'center' },
//         { key: 'absent',   label: 'Absent',   width: 45,  align: 'center' },
//         { key: 'leave',    label: 'Leave',    width: 45,  align: 'center' },
//         { key: 'hours',    label: 'Worked',   width: 65,  align: 'center' },
//         { key: 'pct',      label: `${single}%`, width: 50,  align: 'center' },
//         { key: 'salary',   label: 'Salary',   width: 75,  align: 'right' },
//         { key: 'earned',   label: 'Earned',   width: 75,  align: 'right' },
//         { key: 'deduct',   label: 'Deduct',   width: 70,  align: 'right' },
//         { key: 'net',      label: 'Net Pay',  width: 75,  align: 'right' },
//       ];
//     }

//     const totalColW = cols.reduce((s, c) => s + c.width, 0);
//     const scale = tableWidth / totalColW;
//     cols.forEach(c => c.width = c.width * scale);

//     const headerH = method === 'both' ? 28 : 22;
//     const totalRowH = 20;
//     const summaryH = 70;
//     const footerH = 25;
//     const availableH = PAGE_H - y - headerH - totalRowH - summaryH - footerH - 10;
//     const rowH = Math.max(12, Math.min(18, Math.floor(availableH / payrollData.length)));
//     const cellFontSize = rowH < 14 ? 6.5 : rowH < 16 ? 7 : 7.5;
//     const headerFontSize = method === 'both' ? 6.5 : 7.5;

//     // ════════════════════════════════════════════
//     // DRAW TABLE HEADER
//     // ════════════════════════════════════════════
//     const drawHeader = (startY) => {
//       if (method === 'both') {
//         let groupX = tableLeft;
//         cols.forEach(c => {
//           if (!c.group) groupX += c.width;
//         });

//         const hoursCols = cols.filter(c => c.group === 'hours');
//         const hoursW = hoursCols.reduce((s, c) => s + c.width, 0);
//         doc.rect(groupX, startY, hoursW, 12).fill(colors.primary);
//         doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
//            .text('HOURS BASED', groupX, startY + 3, { width: hoursW, align: 'center' });
//         groupX += hoursW;

//         const daysCols = cols.filter(c => c.group === 'days');
//         const daysW = daysCols.reduce((s, c) => s + c.width, 0);
//         doc.rect(groupX, startY, daysW, 12).fill(colors.blue);
//         doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
//            .text('DAYS BASED', groupX, startY + 3, { width: daysW, align: 'center' });
//       }

//       const mainHeaderY = method === 'both' ? startY + 12 : startY;
//       const mainHeaderH = method === 'both' ? 16 : 22;

//       doc.rect(tableLeft, mainHeaderY, tableWidth, mainHeaderH).fill(colors.dark);

//       let x = tableLeft;
//       const textY = mainHeaderY + (mainHeaderH - cellFontSize) / 2 - 1;

//       cols.forEach(col => {
//         doc.fillColor('white').fontSize(headerFontSize).font('Helvetica-Bold')
//            .text(col.label, x + 2, textY, {
//              width: col.width - 4,
//              align: col.align,
//              lineBreak: false,
//            });
//         x += col.width;
//       });
//     };

//     drawHeader(y);
//     let rowY = y + headerH;

//     // ════════════════════════════════════════════
//     // DRAW TABLE ROWS
//     // ════════════════════════════════════════════
//     payrollData.forEach((emp, idx) => {
//       if (rowY + rowH > PAGE_H - summaryH - footerH - 30) {
//         doc.addPage();
//         rowY = 20;
//         drawHeader(rowY);
//         rowY += headerH;
//       }

//       if (idx % 2 === 0) {
//         doc.rect(tableLeft, rowY, tableWidth, rowH).fill(colors.light);
//       }

//       if (method === 'both') {
//         let bgX = tableLeft;
//         cols.forEach(c => {
//           if (c.bg) {
//             doc.rect(bgX, rowY, c.width, rowH).fill(c.bg);
//           }
//           bgX += c.width;
//         });
//       }

//       let rowData = {};
//       const totalLeave = (emp.paid_leave_days || 0) + (emp.unpaid_leave_days || 0);

//       if (method === 'both') {
//         rowData = {
//           sr: `${idx + 1}`,
//           code: emp.emp_code || '-',
//           name: emp.name || '-',
//           dept: emp.department || '-',
//           present: `${emp.total_present || 0}`,
//           absent: `${emp.total_absent || 0}`,
//           leave: `${totalLeave}`,
//           hours: emp.worked_hours || '-',
//           salary: formatINRPlain(emp.monthly_salary),
//           h_pct: `${emp.hours_based.progress_percent}%`,
//           h_deduct: formatINRPlain(emp.hours_based.deduction),
//           h_net: formatINRPlain(emp.hours_based.net_payable),
//           d_pct: `${emp.days_based.progress_percent}%`,
//           d_deduct: formatINRPlain(emp.days_based.deduction),
//           d_net: formatINRPlain(emp.days_based.net_payable),
//         };
//       } else {
//         const data = method === 'hours' ? emp.hours_based : emp.days_based;
//         rowData = {
//           sr: `${idx + 1}`,
//           code: emp.emp_code || '-',
//           name: emp.name || '-',
//           dept: emp.department || '-',
//           present: `${emp.total_present || 0}`,
//           absent: `${emp.total_absent || 0}`,
//           leave: `${totalLeave}`,
//           hours: emp.worked_hours || '-',
//           pct: `${data.progress_percent}%`,
//           salary: formatINRPlain(emp.monthly_salary),
//           earned: formatINRPlain(data.earned),
//           deduct: formatINRPlain(data.deduction),
//           net: formatINRPlain(data.net_payable),
//         };
//       }

//       let xR = tableLeft;
//       const cellY = rowY + (rowH - cellFontSize) / 2 - 1;

//       cols.forEach(col => {
//         const value = rowData[col.key] || '-';
//         let textColor = colors.dark;
//         let fontStyle = 'Helvetica';

//         if (col.key === 'code') fontStyle = 'Helvetica-Bold';
//         if (col.key === 'dept') textColor = colors.gray;
//         if (col.key === 'present') textColor = colors.success;
//         if (col.key === 'absent') textColor = emp.total_absent > 0 ? colors.danger : colors.gray;
//         if (col.key === 'h_deduct' || col.key === 'd_deduct' || col.key === 'deduct') {
//           textColor = colors.danger;
//         }
//         if (col.key === 'earned') textColor = colors.success;
//         if (col.key === 'h_net' || col.key === 'net') {
//           textColor = colors.primary;
//           fontStyle = 'Helvetica-Bold';
//         }
//         if (col.key === 'd_net') {
//           textColor = colors.blue;
//           fontStyle = 'Helvetica-Bold';
//         }
//         if (col.key === 'salary') fontStyle = 'Helvetica-Bold';

//         doc.fillColor(textColor).fontSize(cellFontSize).font(fontStyle)
//            .text(value, xR + 2, cellY, {
//              width: col.width - 4,
//              align: col.align,
//              lineBreak: false,
//              ellipsis: true,
//            });

//         xR += col.width;
//       });

//       doc.moveTo(tableLeft, rowY + rowH)
//          .lineTo(tableLeft + tableWidth, rowY + rowH)
//          .strokeColor('#E5E7EB').lineWidth(0.3).stroke();

//       rowY += rowH;
//     });

//     // ════════════════════════════════════════════
//     // TOTAL ROW
//     // ════════════════════════════════════════════
//     if (rowY + totalRowH > PAGE_H - summaryH - footerH - 10) {
//       doc.addPage();
//       rowY = 20;
//     }

//     doc.rect(tableLeft, rowY, tableWidth, totalRowH).fill(colors.primary);

//     let xT = tableLeft;
//     const totalY = rowY + (totalRowH - 9) / 2;

//     if (method === 'both') {
//       const labelCols = cols.slice(0, 8);
//       const labelW = labelCols.reduce((s, c) => s + c.width, 0);
//       doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
//          .text('GRAND TOTAL', xT + 5, totalY, { width: labelW - 10, align: 'left' });
//       xT += labelW;

//       doc.text(formatINRPlain(totalSalary), xT + 2, totalY, {
//         width: cols[8].width - 4, align: 'right',
//       });
//       xT += cols[8].width;

//       doc.fillColor('#FFE4D0').text('-', xT + 2, totalY, { width: cols[9].width - 4, align: 'center' });
//       xT += cols[9].width;
//       doc.fillColor('white').text(formatINRPlain(totalDeductHours), xT + 2, totalY, { width: cols[10].width - 4, align: 'right' });
//       xT += cols[10].width;
//       doc.text(formatINRPlain(totalEarnedHours), xT + 2, totalY, { width: cols[11].width - 4, align: 'right' });
//       xT += cols[11].width;

//       doc.fillColor('#DBEAFE').text('-', xT + 2, totalY, { width: cols[12].width - 4, align: 'center' });
//       xT += cols[12].width;
//       doc.fillColor('white').text(formatINRPlain(totalDeductDays), xT + 2, totalY, { width: cols[13].width - 4, align: 'right' });
//       xT += cols[13].width;
//       doc.text(formatINRPlain(totalEarnedDays), xT + 2, totalY, { width: cols[14].width - 4, align: 'right' });
//     } else {
//       const labelCols = cols.slice(0, 9);
//       const labelW = labelCols.reduce((s, c) => s + c.width, 0);
//       doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
//          .text('GRAND TOTAL', xT + 5, totalY, { width: labelW - 10, align: 'left' });
//       xT += labelW;

//       const totalEarned = method === 'hours' ? totalEarnedHours : totalEarnedDays;
//       const totalDeduct = method === 'hours' ? totalDeductHours : totalDeductDays;

//       doc.text(formatINRPlain(totalSalary), xT + 2, totalY, { width: cols[9].width - 4, align: 'right' });
//       xT += cols[9].width;
//       doc.text(formatINRPlain(totalEarned), xT + 2, totalY, { width: cols[10].width - 4, align: 'right' });
//       xT += cols[10].width;
//       doc.text(formatINRPlain(totalDeduct), xT + 2, totalY, { width: cols[11].width - 4, align: 'right' });
//       xT += cols[11].width;
//       doc.text(formatINRPlain(totalEarned), xT + 2, totalY, { width: cols[12].width - 4, align: 'right' });
//     }

//     rowY += totalRowH + 8;

//     // ════════════════════════════════════════════
//     // SUMMARY BOX
//     // ════════════════════════════════════════════
//     if (rowY + summaryH > PAGE_H - footerH - 10) {
//       doc.addPage();
//       rowY = 20;
//     }

//     doc.roundedRect(tableLeft, rowY, tableWidth, summaryH - 5, 4)
//        .fillAndStroke(colors.light, '#D1D5DB');

//     doc.fillColor(colors.dark).fontSize(10).font('Helvetica-Bold')
//        .text('PAYROLL SUMMARY', tableLeft + 12, rowY + 8);

//     const sumY = rowY + 28;
//     const sumColCount = method === 'both' ? 5 : 4;
//     const sumColW = (tableWidth - 24) / sumColCount;

//     doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
//        .text('Total Salary', tableLeft + 12, sumY);
//     doc.fontSize(12).fillColor(colors.dark).font('Helvetica-Bold')
//        .text(formatINR(totalSalary), tableLeft + 12, sumY + 11);

//     if (method === 'both') {
//       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
//          .text('Hours-Based Earned', tableLeft + 12 + sumColW, sumY);
//       doc.fontSize(12).fillColor(colors.primary).font('Helvetica-Bold')
//          .text(formatINR(totalEarnedHours), tableLeft + 12 + sumColW, sumY + 11);

//       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
//          .text('Hours-Based Cut', tableLeft + 12 + sumColW * 2, sumY);
//       doc.fontSize(11).fillColor(colors.danger).font('Helvetica-Bold')
//          .text(formatINR(totalDeductHours), tableLeft + 12 + sumColW * 2, sumY + 11);

//       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
//          .text('Days-Based Earned', tableLeft + 12 + sumColW * 3, sumY);
//       doc.fontSize(12).fillColor(colors.blue).font('Helvetica-Bold')
//          .text(formatINR(totalEarnedDays), tableLeft + 12 + sumColW * 3, sumY + 11);

//       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
//          .text('Days-Based Cut', tableLeft + 12 + sumColW * 4, sumY);
//       doc.fontSize(11).fillColor(colors.danger).font('Helvetica-Bold')
//          .text(formatINR(totalDeductDays), tableLeft + 12 + sumColW * 4, sumY + 11);

//       const diff = Math.abs(totalEarnedHours - totalEarnedDays);
//       const winner = totalEarnedHours > totalEarnedDays ? 'Hours' : 'Days';
//       doc.fontSize(7.5).fillColor(colors.gray).font('Helvetica-Oblique')
//          .text(`Note: ${winner}-based method pays ${formatINR(diff)} more to employees overall.`,
//                tableLeft + 12, sumY + 38, { width: tableWidth - 24 });
//     } else {
//       const totalEarned = method === 'hours' ? totalEarnedHours : totalEarnedDays;
//       const totalDeduct = method === 'hours' ? totalDeductHours : totalDeductDays;

//       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
//          .text('Total Earned', tableLeft + 12 + sumColW, sumY);
//       doc.fontSize(13).fillColor(colors.success).font('Helvetica-Bold')
//          .text(formatINR(totalEarned), tableLeft + 12 + sumColW, sumY + 11);

//       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
//          .text('Total Deduction', tableLeft + 12 + sumColW * 2, sumY);
//       doc.fontSize(13).fillColor(colors.danger).font('Helvetica-Bold')
//          .text(formatINR(totalDeduct), tableLeft + 12 + sumColW * 2, sumY + 11);

//       doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
//          .text('NET PAYABLE', tableLeft + 12 + sumColW * 3, sumY);
//       doc.fontSize(14).fillColor(colors.primary).font('Helvetica-Bold')
//          .text(formatINR(totalEarned), tableLeft + 12 + sumColW * 3, sumY + 11);
//     }

//     // ════════════════════════════════════════════
//     // FOOTER
//     // ════════════════════════════════════════════
//     const footerY = PAGE_H - 22;
    
//     doc.moveTo(20, footerY - 4).lineTo(PAGE_W - 20, footerY - 4)
//        .strokeColor('#E5E7EB').lineWidth(0.5).stroke();

//     doc.fontSize(7).fillColor(colors.gray).font('Helvetica')
//        .text(`${company.name} | Payroll Report | ${monthName} ${currentYear} | Method: ${methodLabel}`,
//              20, footerY, { width: PAGE_W - 40, align: 'center' });

//     doc.fontSize(6.5).fillColor(colors.gray)
//        .text(`Generated by Attendance System on ${new Date().toLocaleString('en-IN')}`,
//              20, footerY + 9, { width: PAGE_W - 40, align: 'center' });

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

const getCompanyAddress = (company) => {
  if (company.address && company.address.trim() !== '') {
    return company.address;
  }
  return 'Bhopal, Madhya Pradesh, India';
};

// ════════════════════════════════════════════
// DOWNLOAD PAYROLL PDF (DEFAULT: DAYS BASED)
// ════════════════════════════════════════════
const downloadPayrollPDF = async (req, res) => {
  try {
    const { company_id, department, month, year, calc_method = 'days' } = req.query;

    if (!company_id) {
      return res.status(400).json({ success: false, message: 'company_id required' });
    }

    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();
    const method = ['hours', 'days', 'both'].includes(calc_method) ? calc_method : 'days';

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

    const payrollData = [];
    for (const emp of employees) {
      const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
      payrollData.push(payroll);
    }

    // ═══ TOTALS ═══
    const totalSalary = payrollData.reduce((s, p) => s + p.monthly_salary, 0);
    const totalEarnedHours = payrollData.reduce((s, p) => s + p.hours_based.earned, 0);
    const totalDeductHours = payrollData.reduce((s, p) => s + p.hours_based.deduction, 0);
    const totalEarnedDays = payrollData.reduce((s, p) => s + p.days_based.earned, 0);
    const totalDeductDays = payrollData.reduce((s, p) => s + p.days_based.deduction, 0);

    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' });
    const companyAddress = getCompanyAddress(company);

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
      purple: '#7C3AED',
      orangeLight: '#FFF3E8',
      blueLight: '#EFF6FF',
      purpleLight: '#F5F3FF',
    };

    const PAGE_W = doc.page.width;
    const PAGE_H = doc.page.height;

    // ════════════════════════════════════════════
    // HEADER
    // ════════════════════════════════════════════
    doc.rect(0, 0, PAGE_W, 6).fill(colors.primary);

    doc.fillColor(colors.dark)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(company.name.toUpperCase(), 20, 14);

    doc.fontSize(7.5)
       .font('Helvetica')
       .fillColor(colors.gray)
       .text(companyAddress, 20, 33, { width: 400 });

    doc.fillColor(colors.primary)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('PAYROLL REPORT', PAGE_W - 200, 14, { width: 180, align: 'right' });

    doc.fillColor(colors.dark)
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(`${monthName} ${currentYear}`, PAGE_W - 200, 28, { width: 180, align: 'right' });

    const methodLabel = method === 'hours' ? 'HOURS BASED' : method === 'days' ? 'DAYS BASED' : 'COMPARE';
    const methodColor = method === 'hours' ? colors.primary : method === 'days' ? colors.blue : colors.purple;
    
    doc.roundedRect(PAGE_W - 100, 42, 80, 13, 3).fill(methodColor);
    doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
       .text(methodLabel, PAGE_W - 100, 46, { width: 80, align: 'center' });

    doc.moveTo(20, 60).lineTo(PAGE_W - 20, 60).strokeColor(colors.primary).lineWidth(0.8).stroke();

    // ════════════════════════════════════════════
    // 🆕 INFO ROW - Required Hrs REMOVED
    // ════════════════════════════════════════════
    let y = 67;
    doc.fontSize(8).font('Helvetica').fillColor(colors.gray);
    
    const firstEmp = payrollData[0] || {};
    const infoItems = [
      { label: 'Department: ', value: department && department !== 'all' ? department : 'All' },
      { label: 'Employees: ', value: `${payrollData.length}` },
      { label: 'Working Days: ', value: `${firstEmp.total_working_days || 0}` },
      { label: 'Generated: ', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    ];

    let infoX = 20;
    infoItems.forEach((item) => {
      doc.fillColor(colors.gray).font('Helvetica').text(item.label, infoX, y, { continued: true });
      doc.fillColor(colors.dark).font('Helvetica-Bold').text(item.value);
      infoX += 180;
    });

    y = 85;

    // ════════════════════════════════════════════
    // 🆕 TABLE COLUMNS - Code, Dept, Worked REMOVED
    // ════════════════════════════════════════════
    const tableLeft = 20;
    const tableWidth = PAGE_W - 40;

    let cols;
    if (method === 'both') {
      cols = [
        { key: 'sr',       label: 'Sr',       width: 25,  align: 'left' },
        { key: 'name',     label: 'Name',     width: 130, align: 'left' },
        { key: 'present',  label: 'P',        width: 30,  align: 'center' },
        { key: 'absent',   label: 'A',        width: 30,  align: 'center' },
        { key: 'leave',    label: 'L',        width: 30,  align: 'center' },
        { key: 'carry',    label: 'C→',       width: 35,  align: 'center', bg: colors.purpleLight },
        { key: 'salary',   label: 'Salary',   width: 75,  align: 'right' },
        { key: 'h_pct',    label: 'H%',       width: 40,  align: 'center', bg: colors.orangeLight, group: 'hours' },
        { key: 'h_deduct', label: 'H-Cut',    width: 65,  align: 'right',  bg: colors.orangeLight, group: 'hours' },
        { key: 'h_net',    label: 'H-Net',    width: 75,  align: 'right',  bg: colors.orangeLight, group: 'hours' },
        { key: 'd_pct',    label: 'D%',       width: 40,  align: 'center', bg: colors.blueLight, group: 'days' },
        { key: 'd_deduct', label: 'D-Cut',    width: 65,  align: 'right',  bg: colors.blueLight, group: 'days' },
        { key: 'd_net',    label: 'D-Net',    width: 75,  align: 'right',  bg: colors.blueLight, group: 'days' },
      ];
    } else {
      const single = method === 'hours' ? 'H' : 'D';
      cols = [
        { key: 'sr',       label: 'Sr',        width: 30,  align: 'left' },
        { key: 'name',     label: 'Employee',  width: 180, align: 'left' },
        { key: 'present',  label: 'Present',   width: 60,  align: 'center' },
        { key: 'absent',   label: 'Absent',    width: 60,  align: 'center' },
        { key: 'leave',    label: 'Leave',     width: 60,  align: 'center' },
        { key: 'carry',    label: 'Carry→',    width: 60,  align: 'center', bg: colors.purpleLight },
        { key: 'pct',      label: `${single}%`, width: 60,  align: 'center' },
        { key: 'salary',   label: 'Salary',    width: 90,  align: 'right' },
        { key: 'earned',   label: 'Earned',    width: 90,  align: 'right' },
        { key: 'deduct',   label: 'Deduct',    width: 85,  align: 'right' },
        { key: 'net',      label: 'Net Pay',   width: 95,  align: 'right' },
      ];
    }

    const totalColW = cols.reduce((s, c) => s + c.width, 0);
    const scale = tableWidth / totalColW;
    cols.forEach(c => c.width = c.width * scale);

    const headerH = method === 'both' ? 28 : 22;
    const totalRowH = 20;
    const summaryH = 70;
    const footerH = 25;
    const availableH = PAGE_H - y - headerH - totalRowH - summaryH - footerH - 10;
    const rowH = Math.max(12, Math.min(20, Math.floor(availableH / payrollData.length)));
    const cellFontSize = rowH < 14 ? 7 : rowH < 16 ? 7.5 : 8;
    const headerFontSize = method === 'both' ? 7 : 8;

    // ════════════════════════════════════════════
    // DRAW TABLE HEADER
    // ════════════════════════════════════════════
    const drawHeader = (startY) => {
      if (method === 'both') {
        let groupX = tableLeft;
        cols.forEach(c => {
          if (!c.group) groupX += c.width;
        });

        const hoursCols = cols.filter(c => c.group === 'hours');
        const hoursW = hoursCols.reduce((s, c) => s + c.width, 0);
        doc.rect(groupX, startY, hoursW, 12).fill(colors.primary);
        doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
           .text('HOURS BASED', groupX, startY + 3, { width: hoursW, align: 'center' });
        groupX += hoursW;

        const daysCols = cols.filter(c => c.group === 'days');
        const daysW = daysCols.reduce((s, c) => s + c.width, 0);
        doc.rect(groupX, startY, daysW, 12).fill(colors.blue);
        doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
           .text('DAYS BASED', groupX, startY + 3, { width: daysW, align: 'center' });
      }

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
      if (rowY + rowH > PAGE_H - summaryH - footerH - 30) {
        doc.addPage();
        rowY = 20;
        drawHeader(rowY);
        rowY += headerH;
      }

      if (idx % 2 === 0) {
        doc.rect(tableLeft, rowY, tableWidth, rowH).fill(colors.light);
      }

      // Background for special columns
      let bgX = tableLeft;
      cols.forEach(c => {
        if (c.bg) {
          doc.rect(bgX, rowY, c.width, rowH).fill(c.bg);
        }
        bgX += c.width;
      });

      const totalLeave = emp.total_leave_approved || 0;
      const carryForward = emp.leave_closing_balance || 0;

      let rowData = {};

      if (method === 'both') {
        rowData = {
          sr: `${idx + 1}`,
          name: emp.name || '-',
          present: `${emp.total_present || 0}`,
          absent: `${emp.total_absent || 0}`,
          leave: `${totalLeave}`,
          carry: `${carryForward}`,
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
          name: emp.name || '-',
          present: `${emp.total_present || 0}`,
          absent: `${emp.total_absent || 0}`,
          leave: `${totalLeave}`,
          carry: `${carryForward}`,
          pct: `${data.progress_percent}%`,
          salary: formatINRPlain(emp.monthly_salary),
          earned: formatINRPlain(data.earned),
          deduct: formatINRPlain(data.deduction),
          net: formatINRPlain(data.net_payable),
        };
      }

      let xR = tableLeft;
      const cellY = rowY + (rowH - cellFontSize) / 2 - 1;

      cols.forEach(col => {
        const value = rowData[col.key] || '-';
        let textColor = colors.dark;
        let fontStyle = 'Helvetica';

        if (col.key === 'name') fontStyle = 'Helvetica-Bold';
        if (col.key === 'present') textColor = colors.success;
        if (col.key === 'absent') textColor = emp.total_absent > 0 ? colors.danger : colors.gray;
        if (col.key === 'leave') textColor = totalLeave > 0 ? colors.blue : colors.gray;
        if (col.key === 'carry') {
          textColor = carryForward > 0 ? colors.purple : colors.gray;
          fontStyle = 'Helvetica-Bold';
        }
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

    const totalPresent = payrollData.reduce((s, p) => s + (p.total_present || 0), 0);
    const totalAbsent = payrollData.reduce((s, p) => s + (p.total_absent || 0), 0);
    const totalLeaves = payrollData.reduce((s, p) => s + (p.total_leave_approved || 0), 0);
    const totalCarry = payrollData.reduce((s, p) => s + (p.leave_closing_balance || 0), 0);

    if (method === 'both') {
      // Sr + Name = 2 cols
      const labelCols = cols.slice(0, 2);
      const labelW = labelCols.reduce((s, c) => s + c.width, 0);
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
         .text('GRAND TOTAL', xT + 5, totalY, { width: labelW - 10, align: 'left' });
      xT += labelW;

      // Present
      doc.text(`${totalPresent}`, xT + 2, totalY, { width: cols[2].width - 4, align: 'center' });
      xT += cols[2].width;

      // Absent
      doc.text(`${totalAbsent}`, xT + 2, totalY, { width: cols[3].width - 4, align: 'center' });
      xT += cols[3].width;

      // Leave
      doc.text(`${totalLeaves}`, xT + 2, totalY, { width: cols[4].width - 4, align: 'center' });
      xT += cols[4].width;

      // Carry
      doc.text(`${totalCarry}`, xT + 2, totalY, { width: cols[5].width - 4, align: 'center' });
      xT += cols[5].width;

      // Salary
      doc.text(formatINRPlain(totalSalary), xT + 2, totalY, {
        width: cols[6].width - 4, align: 'right',
      });
      xT += cols[6].width;

      // Hours group
      xT += cols[7].width; // H%
      doc.text(formatINRPlain(totalDeductHours), xT + 2, totalY, { width: cols[8].width - 4, align: 'right' });
      xT += cols[8].width;
      doc.text(formatINRPlain(totalEarnedHours), xT + 2, totalY, { width: cols[9].width - 4, align: 'right' });
      xT += cols[9].width;

      // Days group
      xT += cols[10].width; // D%
      doc.text(formatINRPlain(totalDeductDays), xT + 2, totalY, { width: cols[11].width - 4, align: 'right' });
      xT += cols[11].width;
      doc.text(formatINRPlain(totalEarnedDays), xT + 2, totalY, { width: cols[12].width - 4, align: 'right' });
    } else {
      // Sr + Name = 2 cols
      const labelCols = cols.slice(0, 2);
      const labelW = labelCols.reduce((s, c) => s + c.width, 0);
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
         .text('GRAND TOTAL', xT + 5, totalY, { width: labelW - 10, align: 'left' });
      xT += labelW;

      // Present
      doc.text(`${totalPresent}`, xT + 2, totalY, { width: cols[2].width - 4, align: 'center' });
      xT += cols[2].width;

      // Absent
      doc.text(`${totalAbsent}`, xT + 2, totalY, { width: cols[3].width - 4, align: 'center' });
      xT += cols[3].width;

      // Leave
      doc.text(`${totalLeaves}`, xT + 2, totalY, { width: cols[4].width - 4, align: 'center' });
      xT += cols[4].width;

      // Carry
      doc.text(`${totalCarry}`, xT + 2, totalY, { width: cols[5].width - 4, align: 'center' });
      xT += cols[5].width;

      // % (skip)
      xT += cols[6].width;

      const totalEarned = method === 'hours' ? totalEarnedHours : totalEarnedDays;
      const totalDeduct = method === 'hours' ? totalDeductHours : totalDeductDays;

      // Salary
      doc.text(formatINRPlain(totalSalary), xT + 2, totalY, { width: cols[7].width - 4, align: 'right' });
      xT += cols[7].width;

      // Earned
      doc.text(formatINRPlain(totalEarned), xT + 2, totalY, { width: cols[8].width - 4, align: 'right' });
      xT += cols[8].width;

      // Deduct
      doc.text(formatINRPlain(totalDeduct), xT + 2, totalY, { width: cols[9].width - 4, align: 'right' });
      xT += cols[9].width;

      // Net
      doc.text(formatINRPlain(totalEarned), xT + 2, totalY, { width: cols[10].width - 4, align: 'right' });
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

    doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
       .text('Total Salary', tableLeft + 12, sumY);
    doc.fontSize(12).fillColor(colors.dark).font('Helvetica-Bold')
       .text(formatINR(totalSalary), tableLeft + 12, sumY + 11);

    if (method === 'both') {
      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Hours-Based Earned', tableLeft + 12 + sumColW, sumY);
      doc.fontSize(12).fillColor(colors.primary).font('Helvetica-Bold')
         .text(formatINR(totalEarnedHours), tableLeft + 12 + sumColW, sumY + 11);

      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Hours-Based Cut', tableLeft + 12 + sumColW * 2, sumY);
      doc.fontSize(11).fillColor(colors.danger).font('Helvetica-Bold')
         .text(formatINR(totalDeductHours), tableLeft + 12 + sumColW * 2, sumY + 11);

      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Days-Based Earned', tableLeft + 12 + sumColW * 3, sumY);
      doc.fontSize(12).fillColor(colors.blue).font('Helvetica-Bold')
         .text(formatINR(totalEarnedDays), tableLeft + 12 + sumColW * 3, sumY + 11);

      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Days-Based Cut', tableLeft + 12 + sumColW * 4, sumY);
      doc.fontSize(11).fillColor(colors.danger).font('Helvetica-Bold')
         .text(formatINR(totalDeductDays), tableLeft + 12 + sumColW * 4, sumY + 11);

      const diff = Math.abs(totalEarnedHours - totalEarnedDays);
      const winner = totalEarnedHours > totalEarnedDays ? 'Hours' : 'Days';
      doc.fontSize(7.5).fillColor(colors.gray).font('Helvetica-Oblique')
         .text(`Note: ${winner}-based method pays ${formatINR(diff)} more to employees overall.`,
               tableLeft + 12, sumY + 38, { width: tableWidth - 24 });
    } else {
      const totalEarned = method === 'hours' ? totalEarnedHours : totalEarnedDays;
      const totalDeduct = method === 'hours' ? totalDeductHours : totalDeductDays;

      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Total Earned', tableLeft + 12 + sumColW, sumY);
      doc.fontSize(13).fillColor(colors.success).font('Helvetica-Bold')
         .text(formatINR(totalEarned), tableLeft + 12 + sumColW, sumY + 11);

      doc.fontSize(8).fillColor(colors.gray).font('Helvetica')
         .text('Total Deduction', tableLeft + 12 + sumColW * 2, sumY);
      doc.fontSize(13).fillColor(colors.danger).font('Helvetica-Bold')
         .text(formatINR(totalDeduct), tableLeft + 12 + sumColW * 2, sumY + 11);

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

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
    // 🎯 A4 LANDSCAPE DIMENSIONS
    // ════════════════════════════════════════════
    const PAGE_W = 842;
    const PAGE_H = 595;
    const MARGIN = 25;

    const empCount = payrollData.length;

    // ════════════════════════════════════════════
    // 🆕 DYNAMIC ROW & PAGE SCALING
    // ════════════════════════════════════════════
    let rowsPerPage = 28;
    let rowH = 15;
    let cellFS = 8.5;

    if (empCount <= 28) {
      rowsPerPage = 28;
      rowH = 15;
      cellFS = 8.5;
    } else if (empCount <= 64) {
      // Exactly 2 pages for up to 64 employees (e.g. RCC with 63)
      rowsPerPage = Math.ceil(empCount / 2);
      rowH = 13.2;
      cellFS = 8.0;
    } else {
      rowsPerPage = 28;
      rowH = 14.0;
      cellFS = 8.0;
    }

    const totalPages = Math.ceil(empCount / rowsPerPage);

    // 🔒 Set margin: 0 to DISABLE PDFKit internal auto-pagebreak bug
    const doc = new PDFDocument({
      size: [PAGE_W, PAGE_H],
      margin: 0,
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
        .text(company.name.toUpperCase(), MARGIN, 12, { lineBreak: false });

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
          if (col.key === 'cut')     { textColor = emp.total_deduction > 0 ? colors.danger : colors.gray; }
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

      const totalPresent = payrollData.reduce((s, p) => s + (p.total_present || 0), 0);
      const totalLate    = payrollData.reduce((s, p) => s + (p.late_count || 0), 0);
      const totalHD      = payrollData.reduce((s, p) => s + ((p.half_day_count || 0) + (p.half_day_leave_count || 0)), 0);
      const totalLeaves  = payrollData.reduce((s, p) => s + (p.total_leave_approved || 0), 0);
      const totalPaidLv  = payrollData.reduce((s, p) => s + (p.paid_leave_days || 0), 0);

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

    // ════════════════════════════════════════════
    // 🎯 CLEAN LOOP OVER PAGES
    // ════════════════════════════════════════════
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
// DOWNLOAD CSV (for Google Sheets)
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
      const totalHD = (emp.half_day_count || 0) + (emp.half_day_leave_count || 0);
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

    rows.push([]);
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

    const csvContent = rows
      .map(row => row.map(cell => escapeCSV(cell)).join(','))
      .join('\n');

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
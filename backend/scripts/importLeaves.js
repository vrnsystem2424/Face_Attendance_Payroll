// backend/scripts/importLeaves.js

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

// ════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════
const CSV_FILE = 'leaves_vrn.csv';
const CSV_FILE_PATH = path.join(__dirname, '../data/', CSV_FILE);

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════

// "13/10/2025" → "13/10/2025" (keep same format)
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const y = parseInt(parts[2]);
  return `${d}/${m}/${y}`;
};

// Map leave type to enum
const mapLeaveType = (typeStr) => {
  if (!typeStr) return 'casual';
  const lower = typeStr.toLowerCase();
  if (lower.includes('sick') || lower.includes('illness') || lower.includes('injury')) return 'sick';
  if (lower.includes('emergency')) return 'emergency';
  if (lower.includes('personal') || lower.includes('casual')) return 'casual';
  return 'other';
};

// Detect half day
const detectHalfDay = (shiftStr) => {
  if (!shiftStr) return { isHalfDay: false, period: '' };
  const lower = shiftStr.toLowerCase();
  if (lower.includes('before lunch') || lower.includes('first half')) {
    return { isHalfDay: true, period: 'first' };
  }
  if (lower.includes('after lunch') || lower.includes('second half')) {
    return { isHalfDay: true, period: 'second' };
  }
  return { isHalfDay: false, period: '' };
};

// Map status
const mapStatus = (statusStr) => {
  if (!statusStr) return 'pending';
  const lower = statusStr.toLowerCase();
  if (lower.includes('approved')) return 'approved';
  if (lower.includes('rejected')) return 'rejected';
  return 'pending';
};

// ════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════
const importLeaves = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`❌ CSV not found: ${CSV_FILE_PATH}`);
      console.log(`💡 Place "${CSV_FILE}" in backend/data/`);
      process.exit(1);
    }

    console.log(`📂 Reading: ${CSV_FILE}\n`);

    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 Total rows: ${rows.length}\n`);

    // Cache employees
    const employees = await Employee.find({});
    const empMap = {};
    employees.forEach(e => {
      empMap[e.emp_code] = e;
    });

    console.log(`👥 Employees in DB: ${employees.length}\n`);

    console.log('═══════════════════════════════════════');
    console.log('  IMPORTING LEAVES');
    console.log('═══════════════════════════════════════\n');

    let created = 0;
    let skipped = 0;
    let notFound = 0;
    let failed = 0;
    const notFoundList = new Set();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const empCode = row['EMPCODE']?.trim() || row['Emp Code']?.trim();
      const name = row['NAME']?.trim();
      const department = row['DEPARTMENT']?.trim() || '';
      const dateFrom = row['DATEFROM']?.trim();
      const dateTo = row['DATETO']?.trim();
      const shift = row['SHIFT']?.trim() || '';
      const typeOfLeave = row['TYPEOFLEAVE']?.trim() || '';
      const reason = row['REASON']?.trim() || 'Imported from old system';
      const approvedDaysStr = row['APPROVED']?.trim() || row['APPROVEDDAYS']?.trim() || '1';
      const approvalManager = row['APPROVALMANAGER']?.trim() || '';
      const status = row['STATUS']?.trim() || 'Approved';
      const leaveGrantedStr = row['Leave Granted']?.trim() || row['LeaveGranted']?.trim() || '1';

      if (!empCode || !dateFrom) {
        console.log(`⚠️  [${i + 1}] SKIPPED: Missing data`);
        skipped++;
        continue;
      }

      const employee = empMap[empCode];
      if (!employee) {
        notFound++;
        notFoundList.add(`${empCode} (${name})`);
        continue;
      }

      const fromDate = normalizeDate(dateFrom);
      const toDate = normalizeDate(dateTo) || fromDate;

      if (!fromDate) {
        console.log(`⚠️  [${i + 1}] Invalid date: ${dateFrom}`);
        skipped++;
        continue;
      }

      const leaveDays = parseFloat(leaveGrantedStr) || parseFloat(approvedDaysStr) || 1;
      const { isHalfDay, period } = detectHalfDay(shift);
      const statusMapped = mapStatus(status);

      try {
        // Check duplicate
        const existing = await Leave.findOne({
          emp_id: employee._id,
          from_date: fromDate,
          to_date: toDate,
        });

        if (existing) {
          console.log(`⏭️  [${i + 1}] EXISTS: ${employee.name} ${fromDate} → ${toDate}`);
          skipped++;
          continue;
        }

        const leaveData = {
          emp_id: employee._id,
          emp_code: employee.emp_code,
          name: employee.name,
          company_id: employee.company_id,
          department: employee.department || department,
          from_date: fromDate,
          to_date: toDate,
          shift: 'General',
          leave_type: mapLeaveType(typeOfLeave),
          is_half_day: isHalfDay,
          half_day_period: period,
          leave_days: leaveDays,
          applied_days: leaveDays,
          approved_days: statusMapped === 'approved' ? leaveDays : 0,
          paid_days: statusMapped === 'approved' ? leaveDays : 0,
          unpaid_days: 0,
          balance_before: 0,
          balance_after: 0,
          reason: reason,
          status: statusMapped,
          manager_name: approvalManager,
          manager_remark: statusMapped === 'approved' ? 'Approved (imported)' : '',
          admin_remark: 'Imported from old system',
          manager_action_date: new Date(),
        };

        const newLeave = await Leave.create(leaveData);

        console.log(`✅ [${i + 1}] CREATED: ${employee.name} | ${fromDate} → ${toDate} | ${leaveDays} day(s) | ${statusMapped}`);
        created++;
      } catch (err) {
        console.log(`❌ [${i + 1}] FAILED: ${empCode} — ${err.message}`);
        failed++;
      }
    }

    // SUMMARY
    console.log('\n═══════════════════════════════════════');
    console.log('  📊 IMPORT SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Created:        ${created}`);
    console.log(`⏭️  Skipped:        ${skipped}`);
    console.log(`❌ Not found:      ${notFound}`);
    console.log(`⚠️  Failed:         ${failed}`);
    console.log(`📊 Total rows:     ${rows.length}`);
    console.log('═══════════════════════════════════════\n');

    if (notFoundList.size > 0) {
      console.log('⚠️  EMPLOYEES NOT FOUND:');
      Array.from(notFoundList).forEach((e, i) => {
        console.log(`   ${i + 1}. ${e}`);
      });
      console.log('');
    }

    console.log('📋 NEXT: Check Super Admin → Payroll → VRN → May 2026\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
};

importLeaves();
// backend/scripts/importAttendance.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');

const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// ════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════
const CSV_FILE = 'Attendance_RCC.csv';
const CSV_FILE_PATH = path.join(__dirname, '../data/', CSV_FILE);

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════

// Flexible column getter — tries multiple possible column names
const getCol = (row, ...possibleNames) => {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') {
      return String(row[name]).trim();
    }
  }
  return '';
};

// "01/05/2026 09:07:14" → { date: "1/5/2026", time24: "09:07:14" }
const parseTimestamp = (timestampStr) => {
  if (!timestampStr) return null;
  const parts = timestampStr.trim().split(/\s+/);
  if (parts.length < 2) return null;

  const [datePart, timePart] = parts;
  const dateParts = datePart.split(/[\/\-]/);
  if (dateParts.length !== 3) return null;

  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const year = parseInt(dateParts[2]);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  return {
    date: `${day}/${month}/${year}`,
    time24: timePart,
  };
};

// "09:07:14" → "09:07 AM"
const formatTime12 = (time24Str) => {
  if (!time24Str || time24Str.trim() === '') return null;

  const parts = time24Str.trim().split(':');
  if (parts.length < 2) return null;

  let hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);

  if (isNaN(hours) || isNaN(minutes)) return null;

  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

// ════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════
const importAttendance = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

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

    // ════════════════════════════════════════
    // DEBUG: Show CSV structure
    // ════════════════════════════════════════
    if (rows.length > 0) {
      console.log('═══════════════════════════════════════');
      console.log('  🔍 CSV DEBUG INFO');
      console.log('═══════════════════════════════════════');
      console.log('Columns found:', Object.keys(rows[0]));
      console.log('\nFirst row sample:');
      console.log(JSON.stringify(rows[0], null, 2));
      console.log('═══════════════════════════════════════\n');
    }

    // ════════════════════════════════════════
    // STEP 1: Group by emp_code + date
    // ════════════════════════════════════════
    console.log('═══════════════════════════════════════');
    console.log('  STEP 1: PROCESSING ROWS');
    console.log('═══════════════════════════════════════\n');

    const groupedRecords = {};
    let skippedNoEmpCode = 0;
    let skippedNoTimestamp = 0;
    let skippedInvalidTimestamp = 0;

    for (const row of rows) {
      // Flexible column matching — try multiple variations
      const empCode = getCol(row,
        'Emp Code', 'EmpCode', 'emp_code', 'Employee Code',
        'EmployeeCode', 'EmployeeID', 'Employee ID', 'ID'
      );

      const timestamp = getCol(row,
        'Timestamp', 'TimeStamp', 'Date Time', 'DateTime',
        'Date_Time', 'Punch Time', 'PunchTime', 'Date'
      );

      const checkInTime = getCol(row,
        'CheckInTime', 'Check In Time', 'CheckIn Time', 'Check-In Time',
        'InTime', 'In Time', 'Check In', 'CheckIn'
      );

      const checkOutTime = getCol(row,
        'CheckOut Time', 'CheckOutTime', 'Check Out Time', 'Check-Out Time',
        'OutTime', 'Out Time', 'Check Out', 'CheckOut', 'CheckOut Time '
      );

      const location = getCol(row, 'Location', 'Site', 'Branch', 'Office');

      if (!empCode) {
        skippedNoEmpCode++;
        continue;
      }

      if (!timestamp) {
        skippedNoTimestamp++;
        continue;
      }

      const parsed = parseTimestamp(timestamp);
      if (!parsed) {
        skippedInvalidTimestamp++;
        if (skippedInvalidTimestamp <= 3) {
          console.log(`⚠️  Invalid timestamp: "${timestamp}" for ${empCode}`);
        }
        continue;
      }

      const key = `${empCode}_${parsed.date}`;

      if (!groupedRecords[key]) {
        groupedRecords[key] = {
          emp_code: empCode,
          date: parsed.date,
          location,
          checkIns: [],
          checkOuts: [],
        };
      }

      if (checkInTime) {
        const time12 = formatTime12(checkInTime);
        if (time12) groupedRecords[key].checkIns.push(time12);
      }

      if (checkOutTime) {
        const time12 = formatTime12(checkOutTime);
        if (time12) groupedRecords[key].checkOuts.push(time12);
      }
    }

    console.log(`\n📊 Skipped (no emp code):       ${skippedNoEmpCode}`);
    console.log(`📊 Skipped (no timestamp):      ${skippedNoTimestamp}`);
    console.log(`📊 Skipped (invalid timestamp): ${skippedInvalidTimestamp}`);
    console.log(`📊 Unique records to process:   ${Object.keys(groupedRecords).length}\n`);

    if (Object.keys(groupedRecords).length === 0) {
      console.log('❌ No valid records found!');
      console.log('💡 Check the CSV DEBUG INFO above and match column names.');
      process.exit(1);
    }

    // ════════════════════════════════════════
    // STEP 2: Cache employees
    // ════════════════════════════════════════
    const employees = await Employee.find({});
    const empMap = {};
    employees.forEach(e => {
      empMap[e.emp_code] = e;
    });

    console.log(`👥 Employees in DB: ${employees.length}\n`);

    // ════════════════════════════════════════
    // STEP 3: Insert/Update attendance
    // ════════════════════════════════════════
    console.log('═══════════════════════════════════════');
    console.log('  STEP 2: IMPORTING ATTENDANCE');
    console.log('═══════════════════════════════════════\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    const notFoundList = new Set();

    const sortedKeys = Object.keys(groupedRecords).sort();

    for (const key of sortedKeys) {
      const record = groupedRecords[key];
      const employee = empMap[record.emp_code];

      if (!employee) {
        notFound++;
        notFoundList.add(record.emp_code);
        continue;
      }

      const inTime = record.checkIns.length > 0
        ? record.checkIns.sort()[0]
        : null;

      const outTime = record.checkOuts.length > 0
        ? record.checkOuts.sort().reverse()[0]
        : null;

      if (!inTime && !outTime) {
        skipped++;
        continue;
      }

      try {
        let attendance = await Attendance.findOne({
          emp_id: employee._id,
          date: record.date,
        });

        if (attendance) {
          let changed = false;
          if (inTime && !attendance.in_time) {
            attendance.in_time = inTime;
            changed = true;
          }
          if (outTime && !attendance.out_time) {
            attendance.out_time = outTime;
            changed = true;
          }
          if (changed) {
            await attendance.save();
            console.log(`🔄 UPDATED: ${employee.name} | ${record.date} | IN: ${attendance.in_time || '—'} | OUT: ${attendance.out_time || '—'}`);
            updated++;
          } else {
            skipped++;
          }
        } else {
          await Attendance.create({
            emp_id: employee._id,
            emp_code: employee.emp_code,
            name: employee.name,
            company_id: employee.company_id,
            department: employee.department,
            date: record.date,
            in_time: inTime,
            out_time: outTime,
            in_latitude: 0,
            in_longitude: 0,
            in_location_status: 'imported',
            in_site: record.location,
            in_distance: 0,
            out_latitude: 0,
            out_longitude: 0,
            out_location_status: 'imported',
            out_site: record.location,
            out_distance: 0,
            status: 'present',
            confidence: 100,
          });

          console.log(`✅ CREATED: ${employee.name} | ${record.date} | IN: ${inTime || '—'} | OUT: ${outTime || '—'}`);
          created++;
        }
      } catch (err) {
        console.log(`❌ ERROR: ${record.emp_code} ${record.date} — ${err.message}`);
        skipped++;
      }
    }

    // ════════════════════════════════════════
    // SUMMARY
    // ════════════════════════════════════════
    console.log('\n═══════════════════════════════════════');
    console.log('  📊 IMPORT SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Created:        ${created}`);
    console.log(`🔄 Updated:        ${updated}`);
    console.log(`⏭️  Skipped:        ${skipped}`);
    console.log(`❌ Not found:      ${notFound}`);
    console.log(`📊 Total rows:     ${rows.length}`);
    console.log(`📊 Unique records: ${Object.keys(groupedRecords).length}`);
    console.log('═══════════════════════════════════════\n');

    if (notFoundList.size > 0) {
      console.log('⚠️  EMP CODES NOT FOUND IN DB:');
      Array.from(notFoundList).forEach((code, i) => {
        console.log(`   ${i + 1}. ${code}`);
      });
      console.log('');
    }

    console.log('📋 NEXT: Run leave import → node scripts/importLeaves.js\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
};

importAttendance();
// backend/scripts/generateTestAttendance.js

require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// ════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════
const COMPANY_CODE = 'VRN';      // Which company
const MONTH = 5;                  // May
const YEAR = 2026;
const SKIP_SUNDAYS = true;        // Skip Sundays

// Random IN/OUT times to simulate real data
const IN_TIMES = ['09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM', '10:00 AM'];
const OUT_TIMES = ['06:00 PM', '06:15 PM', '06:30 PM', '06:45 PM', '07:00 PM'];

// Random absent days per employee (0-5 days)
const MAX_ABSENT_DAYS = 5;

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getDayName = (date) => {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
};

// ════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════
const generateTestAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get all employees of this company
    const Company = require('../models/Company');
    const company = await Company.findOne({ code: COMPANY_CODE });

    if (!company) {
      console.error(`❌ Company "${COMPANY_CODE}" not found`);
      process.exit(1);
    }

    const employees = await Employee.find({
      company_id: company._id,
      status: 'approved',
      role: 'employee',
    });

    console.log(`📊 Found ${employees.length} employees in ${company.name}\n`);

    // Get all dates in the month
    const daysInMonth = new Date(YEAR, MONTH, 0).getDate();
    const allDates = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(YEAR, MONTH - 1, d);
      const dayName = getDayName(date);

      if (SKIP_SUNDAYS && dayName === 'Sunday') continue;

      allDates.push(`${d}/${MONTH}/${YEAR}`);
    }

    console.log(`📅 Generating attendance for ${allDates.length} working days\n`);
    console.log('═══════════════════════════════════════');
    console.log('  GENERATING TEST ATTENDANCE');
    console.log('═══════════════════════════════════════\n');

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const employee of employees) {
      // Randomly pick absent days for this employee
      const absentCount = Math.floor(Math.random() * (MAX_ABSENT_DAYS + 1));
      const absentDateIndices = new Set();

      while (absentDateIndices.size < absentCount) {
        absentDateIndices.add(Math.floor(Math.random() * allDates.length));
      }

      let empCreated = 0;
      let empAbsent = 0;

      for (let i = 0; i < allDates.length; i++) {
        const dateStr = allDates[i];

        // Skip if this is an absent day
        if (absentDateIndices.has(i)) {
          empAbsent++;
          continue;
        }

        // Check if attendance already exists
        const existing = await Attendance.findOne({
          emp_id: employee._id,
          date: dateStr,
        });

        if (existing) {
          totalSkipped++;
          continue;
        }

        // Create attendance with random times
        const inTime = randomItem(IN_TIMES);
        const outTime = randomItem(OUT_TIMES);

        await Attendance.create({
          emp_id: employee._id,
          emp_code: employee.emp_code,
          name: employee.name,
          company_id: employee.company_id,
          department: employee.department,
          date: dateStr,
          in_time: inTime,
          out_time: outTime,
          in_latitude: 0,
          in_longitude: 0,
          in_location_status: 'imported',
          in_site: 'Office',
          in_distance: 0,
          out_latitude: 0,
          out_longitude: 0,
          out_location_status: 'imported',
          out_site: 'Office',
          out_distance: 0,
          status: 'present',
          confidence: 100,
        });

        empCreated++;
        totalCreated++;
      }

      console.log(`✅ ${employee.name.padEnd(25)} | Created: ${empCreated} | Absent: ${empAbsent}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  📊 SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Total Created: ${totalCreated}`);
    console.log(`⏭️  Total Skipped: ${totalSkipped}`);
    console.log(`👥 Employees: ${employees.length}`);
    console.log(`📅 Days: ${allDates.length}`);
    console.log('═══════════════════════════════════════\n');

    console.log('📋 NEXT STEPS:');
    console.log('1. ✅ Test attendance data generated');
    console.log('2. 💰 Open Super Admin → Payroll → VRN → May 2026');
    console.log('3. 📊 Verify calculations\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

generateTestAttendance();
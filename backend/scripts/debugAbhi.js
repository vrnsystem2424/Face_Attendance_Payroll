require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Change this to whichever employee you want to check
    const empCode = 'RCC-AJ1929';  // Ajay dey
    
    const emp = await Employee.findOne({ emp_code: empCode });
    if (!emp) {
      console.log('❌ Employee not found');
      process.exit(1);
    }

    console.log(`👤 Employee: ${emp.name} (${emp.emp_code})`);
    console.log(`   Joined: ${new Date(emp.createdAt).toLocaleDateString('en-IN')}\n`);

    // Get July 2026 attendance
    const attendances = await Attendance.find({
      emp_id: emp._id,
      date: { $regex: '/7/2026$' }
    }).sort({ date: 1 });

    const attendedDates = new Set(attendances.map(a => a.date));

    // Get approved leaves
    const leaves = await Leave.find({
      emp_id: emp._id,
      status: 'approved',
    });

    const leaveDateSet = new Set();
    leaves.forEach(l => {
      const [fd, fm, fy] = l.from_date.split('/').map(Number);
      const [td, tm, ty] = l.to_date.split('/').map(Number);
      if (fm !== 7 || fy !== 2026) return;
      
      const fromDate = new Date(fy, fm - 1, fd);
      const toDate = new Date(ty, tm - 1, td);
      const current = new Date(fromDate);
      while (current <= toDate) {
        leaveDateSet.add(`${current.getDate()}/${current.getMonth() + 1}/${current.getFullYear()}`);
        current.setDate(current.getDate() + 1);
      }
    });

    console.log('═══════════════════════════════════════');
    console.log('📅 JULY 2026 - DAY BY DAY');
    console.log('═══════════════════════════════════════');

    const today = new Date();
    const daysInMonth = 31;
    const isCurrentMonth = today.getMonth() + 1 === 7 && today.getFullYear() === 2026;
    const todayDate = today.getDate();

    let presentCount = 0;
    let sundayCount = 0;
    let holidayCount = 0;
    let leaveCount = 0;
    let absentCount = 0;
    let futureCount = 0;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${d}/7/2026`;
      const date = new Date(2026, 6, d);
      const dayName = dayNames[date.getDay()];
      const isSunday = date.getDay() === 0;
      const isFuture = isCurrentMonth && d > todayDate;
      const isPresent = attendedDates.has(dateStr);
      const isLeave = leaveDateSet.has(dateStr);

      let status = '';
      let icon = '';

      if (isFuture) {
        status = 'FUTURE';
        icon = '⏸️';
        futureCount++;
      } else if (isSunday) {
        status = 'SUNDAY (Off)';
        icon = '🟣';
        sundayCount++;
      } else if (isPresent) {
        status = 'PRESENT';
        icon = '✅';
        presentCount++;
      } else if (isLeave) {
        status = 'LEAVE';
        icon = '📋';
        leaveCount++;
      } else {
        status = 'ABSENT ❌';
        icon = '🔴';
        absentCount++;
      }

      console.log(`${d.toString().padStart(2)}/7 ${dayName} ${icon} ${status}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Present:  ${presentCount}`);
    console.log(`📋 Leaves:   ${leaveCount}`);
    console.log(`🟣 Sundays:  ${sundayCount}`);
    console.log(`🎉 Holidays: ${holidayCount}`);
    console.log(`❌ Absent:   ${absentCount}`);
    console.log(`⏸️  Future:   ${futureCount}`);
    console.log(`───────────────────────`);
    console.log(`Total:      ${presentCount + leaveCount + sundayCount + holidayCount + absentCount + futureCount}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

debug();
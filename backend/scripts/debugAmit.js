const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const MonthlySettings = require('../models/MonthlySettings');
const { calculateEmployeePayroll } = require('../controllers/payrollController');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI;
const EMP_CODE = 'VRN-AM8988';
const MONTH = 7;
const YEAR = 2026;

const getDayName = (dateStr) => {
  const [d, m, y] = dateStr.split('/').map(Number);
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(y, m-1, d).getDay()];
};

const debug = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    const emp = await Employee.findOne({ emp_code: EMP_CODE });
    if (!emp) { console.log('❌ Not found'); process.exit(1); }

    const balance = await LeaveBalance.findOne({ emp_id: emp._id });
    const leaves = await Leave.find({ emp_id: emp._id, status: 'approved' }).sort({ from_date: 1 });

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`👤 ${emp.name} (${emp.emp_code})`);
    console.log(`💰 Salary: ₹${emp.monthly_salary}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // ─── BALANCE ───
    console.log('💰 LEAVE BALANCE:');
    console.log(`   Current: ${balance?.current_balance || 0}`);
    console.log(`   Total Credited: ${balance?.total_credited || 0}`);
    console.log(`   Total Used: ${balance?.total_used || 0}\n`);

    // ─── LEAVES ───
    console.log(`📋 APPROVED LEAVES for July 2026:`);
    const julyLeaves = leaves.filter(l => {
      const [d, m, y] = l.from_date.split('/').map(Number);
      return m === 7 && y === 2026;
    });
    
    if (julyLeaves.length === 0) console.log('   None\n');
    else {
      julyLeaves.forEach((l, i) => {
        console.log(`   ${i+1}. ${l.from_date} → ${l.to_date} | ${l.is_half_day ? 'HALF' : 'FULL'} | Days: ${l.leave_days || l.approved_days}`);
      });
      console.log('');
    }

    // ─── ATTENDANCE (Full Detail) ───
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📆 JULY 2026 ATTENDANCE (Day-by-day):`);
    console.log('═══════════════════════════════════════════════════════════\n');

    const dates = [];
    for (let d = 1; d <= 31; d++) dates.push(`${d}/${MONTH}/${YEAR}`);

    const attRecords = await Attendance.find({ emp_id: emp._id, date: { $in: dates } });

    let sundayCount = 0, sundayWorked = 0;
    let weekdayCount = 0, weekdayPresent = 0;
    let absentDays = 0;
    const sundays = [];
    const absentDates = [];
    const workedSundays = [];

    for (let d = 1; d <= 31; d++) {
      const dateStr = `${d}/${MONTH}/${YEAR}`;
      const dayName = getDayName(dateStr);
      const isSunday = dayName === 'Sunday';
      const att = attRecords.find(a => a.date === dateStr);
      const hasAtt = att && att.in_time;

      if (isSunday) {
        sundayCount++;
        sundays.push(dateStr);
        if (hasAtt) {
          sundayWorked++;
          workedSundays.push(dateStr);
        }
      } else {
        weekdayCount++;
        if (hasAtt) {
          weekdayPresent++;
        } else {
          // Check if leave
          const isLeave = julyLeaves.some(l => {
            const [fd] = l.from_date.split('/').map(Number);
            return fd === d;
          });
          if (!isLeave) {
            absentDays++;
            absentDates.push(dateStr);
          }
        }
      }

      const marker = isSunday ? '🌞' : '📆';
      const status = hasAtt ? `IN: ${att.in_time} | OUT: ${att.out_time || '-'}` : '❌ ABSENT';
      console.log(`   ${marker} ${dateStr.padEnd(10)} ${dayName.padEnd(10)}: ${status}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Total Sundays: ${sundayCount} (${sundays.join(', ')})`);
    console.log(`   Sundays Worked: ${sundayWorked} (${workedSundays.join(', ') || 'none'})`);
    console.log(`   Total Weekdays: ${weekdayCount}`);
    console.log(`   Weekday Present: ${weekdayPresent}`);
    console.log(`   Weekday Absent (no leave): ${absentDays} (${absentDates.join(', ') || 'none'})`);
    console.log(`   Total Approved Leaves: ${julyLeaves.length}`);
    console.log('');

    // ─── PAYROLL CALC ───
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💼 PAYROLL CALCULATION:');
    console.log('═══════════════════════════════════════════════════════════');

    const settings = await MonthlySettings.findOne({ 
      company_id: emp.company_id, 
      month: MONTH, 
      year: YEAR 
    });

    const payroll = await calculateEmployeePayroll(emp, MONTH, YEAR, settings);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 EXPECTED vs ACTUAL:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`   Salary: ₹${emp.monthly_salary}`);
    console.log(`   Total Days: 31`);
    console.log(`   Per Day: ₹${(emp.monthly_salary/31).toFixed(2)}\n`);
    
    console.log(`   ACTUAL Payroll Output:`);
    console.log(`      Present: ${payroll.total_present}`);
    console.log(`      Sunday Worked: ${payroll.sunday_worked}`);
    console.log(`      Weekly Off: ${payroll.weekly_off_paid}`);
    console.log(`      Paid Leave: ${payroll.paid_leave_days}`);
    console.log(`      Final Days: ${payroll.final_payable_days}`);
    console.log(`      Earned: ₹${payroll.earned_salary}`);
    console.log(`      Cut: ₹${payroll.total_deduction}`);
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

debug();
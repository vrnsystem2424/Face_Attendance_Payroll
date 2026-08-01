// backend/scripts/debugPragya.js
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
const EMP_CODE = 'VRN-PR4074';
const MONTH = 7;
const YEAR = 2026;

const debug = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    const emp = await Employee.findOne({ emp_code: EMP_CODE });
    if (!emp) { console.log('❌ Not found'); process.exit(1); }

    const balance = await LeaveBalance.findOne({ emp_id: emp._id });
    const leaves = await Leave.find({ emp_id: emp._id }).sort({ from_date: 1 });

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`👤 ${emp.name} (${emp.emp_code})`);
    console.log(`💰 Salary: ₹${emp.monthly_salary}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // ─── BALANCE ───
    console.log('💰 LEAVE BALANCE:');
    console.log(`   Current: ${balance?.current_balance || 0}`);
    console.log(`   Total Credited: ${balance?.total_credited || 0}`);
    console.log(`   Total Used: ${balance?.total_used || 0}\n`);

    console.log('📅 BALANCE HISTORY:');
    balance?.history.forEach((h, i) => {
      console.log(`\n   [${i + 1}] ${h.month}/${h.year}`);
      console.log(`       Opening: ${h.opening_balance} | Credited: +${h.credited} | Used: -${h.used} | Closing: ${h.closing_balance}`);
      console.log(`       Payroll Finalized: ${h.payroll_finalized || false}`);
      if (h.leaves_log?.length > 0) {
        console.log(`       Logs (${h.leaves_log.length}):`);
        h.leaves_log.forEach((log, j) => {
          const type = log.is_adjustment ? '🔧 ADJ' : log.is_payroll_deduction ? '💼 PAY' : '📋 LV';
          console.log(`         ${j + 1}. [${type}] ${log.from_date} → ${log.to_date} | Appr:${log.approved_days} | Paid:${log.paid_days} | Unpaid:${log.unpaid_days}`);
        });
      }
    });

    // ─── LEAVES ───
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`📋 ALL LEAVES (${leaves.length}):`);
    console.log('═══════════════════════════════════════════════════════════\n');

    leaves.forEach((l, i) => {
      console.log(`   [${i + 1}] ${l.from_date} → ${l.to_date}`);
      console.log(`       Status: ${l.status} | Half Day: ${l.is_half_day || false}`);
      console.log(`       Leave Days: ${l.leave_days} | Approved Days: ${l.approved_days}`);
      console.log(`       Reason: ${l.reason?.substring(0, 60) || '-'}`);
      console.log('');
    });

    // Filter for month
    const monthLeaves = leaves.filter(l => {
      if (l.status !== 'approved') return false;
      const [d, m, y] = l.from_date.split('/').map(Number);
      return m === MONTH && y === YEAR;
    });

    let halfCount = 0, fullCount = 0;
    monthLeaves.forEach(l => {
      if (l.is_half_day) halfCount++;
      else fullCount += Number(l.leave_days || l.approved_days || 1);
    });

    console.log(`   🎯 Month ${MONTH}/${YEAR} Approved Leaves:`);
    console.log(`      Half Days: ${halfCount}`);
    console.log(`      Full Days: ${fullCount}`);
    console.log(`      Total Days: ${fullCount + (halfCount * 0.5)}`);

    // ─── ATTENDANCE ───
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`📆 ${MONTH}/${YEAR} ATTENDANCE:`);
    console.log('═══════════════════════════════════════════════════════════');

    const dates = [];
    const daysInMonth = new Date(YEAR, MONTH, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) dates.push(`${d}/${MONTH}/${YEAR}`);

    const att = await Attendance.find({ emp_id: emp._id, date: { $in: dates } });
    
    // Sort by date properly
    att.sort((a, b) => {
      const [da] = a.date.split('/').map(Number);
      const [db] = b.date.split('/').map(Number);
      return da - db;
    });

    console.log(`   Total records: ${att.length}\n`);
    att.forEach(a => {
      if (a.in_time) {
        console.log(`   ${a.date.padEnd(10)}: IN ${(a.in_time || '-').padEnd(10)} OUT ${(a.out_time || '-').padEnd(10)} ${a.in_location_status || '-'}`);
      }
    });

    // ─── PAYROLL CALCULATION ───
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`💼 PAYROLL CALCULATION (${MONTH}/${YEAR}):`);
    console.log('═══════════════════════════════════════════════════════════\n');

    const settings = await MonthlySettings.findOne({ 
      company_id: emp.company_id, 
      month: MONTH, 
      year: YEAR 
    });

    const payroll = await calculateEmployeePayroll(emp, MONTH, YEAR, settings);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 FINAL PAYROLL RESULT:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Working Days:      ${payroll.total_working_days}`);
    console.log(`   Total Checkins:    ${payroll.total_checkins}`);
    console.log(`   Present:           ${payroll.total_present}`);
    console.log(`   Absent:            ${payroll.total_absent}`);
    console.log(`   Late:              ${payroll.late_count} (deduction: -${payroll.late_leave_deduction}d)`);
    console.log(`   Half Day (attend): ${payroll.half_day_count} (value: +${payroll.half_day_value}d)`);
    console.log(`   Full Leaves:       ${payroll.full_day_leaves}`);
    console.log(`   Half Leaves:       ${payroll.half_day_leave_count}`);
    console.log(`   ─────────────────────────────`);
    console.log(`   Available Balance: ${payroll.leave_available}`);
    console.log(`   Paid Leaves:       ${payroll.paid_leave_days}`);
    console.log(`   Unpaid Leaves:     ${payroll.unpaid_leave_days}`);
    console.log(`   Carry Forward:     ${payroll.leave_closing_balance}`);
    console.log(`   ─────────────────────────────`);
    console.log(`   FINAL DAYS:        ${payroll.final_payable_days}`);
    console.log(`   Percentage:        ${payroll.progress_percent}%`);
    console.log(`   Earned Salary:     ₹${payroll.earned_salary}`);
    console.log(`   Cut:               ₹${payroll.total_deduction}`);
    console.log(`   Net Payable:       ₹${payroll.net_payable}`);
    console.log('\n═══════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

debug();
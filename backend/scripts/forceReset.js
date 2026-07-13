require('dotenv').config();
const mongoose = require('mongoose');
const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');

const forceReset = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // STEP 1: Delete ALL leave balances
    console.log('🗑️  Deleting all old leave balances...');
    const deleted = await LeaveBalance.deleteMany({});
    console.log(`   Deleted: ${deleted.deletedCount} records\n`);

    // STEP 2: Get all employees
    const employees = await Employee.find({
      status: 'approved',
      role: { $in: ['employee', 'manager'] },
    });

    console.log(`👥 Processing ${employees.length} employees\n`);

    // 🎯 SYSTEM START DATE - Only credit from THIS month onwards
    const now = new Date();
    const SYSTEM_START_MONTH = now.getMonth() + 1;  // 7 (July)
    const SYSTEM_START_YEAR = now.getFullYear();    // 2026

    console.log(`🚀 System Start: ${SYSTEM_START_MONTH}/${SYSTEM_START_YEAR}\n`);
    console.log('═══════════════════════════════════════\n');

    for (const emp of employees) {
      const joinDate = new Date(emp.createdAt);
      const joinMonth = joinDate.getMonth() + 1;
      const joinYear = joinDate.getFullYear();

      // 🆕 START FROM MAX(joining month, system start month)
      // Agar June me joined but system July se start = July se hi start
      let startMonth = SYSTEM_START_MONTH;
      let startYear = SYSTEM_START_YEAR;

      // Agar employee future me join hua (impossible but safe check)
      if (joinYear > startYear || (joinYear === startYear && joinMonth > startMonth)) {
        startMonth = joinMonth;
        startYear = joinYear;
      }

      let m = startMonth;
      let y = startYear;

      let balance = 0;
      let totalCredited = 0;
      let totalUsed = 0;
      const history = [];

      // Get approved leaves (only from system start onwards)
      const approvedLeaves = await Leave.find({
        emp_id: emp._id,
        status: 'approved',
      });

      // Loop through months (from system start to current)
      while (y < SYSTEM_START_YEAR || (y === SYSTEM_START_YEAR && m <= SYSTEM_START_MONTH)) {
        const opening = balance;
        balance += 1;  // Credit 1 leave
        totalCredited += 1;

        // Find used leaves this month (only count leaves from system start)
        const monthLeaves = approvedLeaves.filter(l => {
          const [fd, fm, fy] = l.from_date.split('/').map(Number);
          // Only count leaves from system start onwards
          if (fy < SYSTEM_START_YEAR || (fy === SYSTEM_START_YEAR && fm < SYSTEM_START_MONTH)) {
            return false;
          }
          return fm === m && fy === y;
        });

        let used = 0;
        const log = [];
        monthLeaves.forEach(l => {
          const paid = l.paid_days || l.approved_days || 0;
          used += paid;
          log.push({
            leave_id: l._id,
            from_date: l.from_date,
            to_date: l.to_date,
            applied_days: l.applied_days || l.leave_days || 0,
            approved_days: l.approved_days || 0,
            paid_days: paid,
            unpaid_days: l.unpaid_days || 0,
            approved_on: l.updatedAt,
          });
        });

        balance = Math.max(0, balance - used);
        totalUsed += used;

        history.push({
          month: m,
          year: y,
          opening_balance: opening,
          credited: 1,
          used: used,
          closing_balance: balance,
          leaves_log: log,
          credited_on: new Date(y, m - 1, 1),
        });

        m++;
        if (m > 12) { m = 1; y++; }
      }

      await LeaveBalance.create({
        emp_id: emp._id,
        emp_code: emp.emp_code,
        name: emp.name,
        company_id: emp.company_id,
        current_balance: balance,
        total_credited: totalCredited,
        total_used: totalUsed,
        history: history,
        last_credited_month: SYSTEM_START_MONTH,
        last_credited_year: SYSTEM_START_YEAR,
      });

      console.log(`✅ ${emp.name} | Credited: ${totalCredited} | Used: ${totalUsed} | Balance: ${balance}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  ✅ COMPLETED');
    console.log('═══════════════════════════════════════');
    console.log(`\n🎯 System Start Date: ${SYSTEM_START_MONTH}/${SYSTEM_START_YEAR}`);
    console.log('   ✅ All employees credited 1 leave (July)');
    console.log('   ✅ Previous months ignored');
    console.log('   ✅ Everyone starts fresh from July 2026\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

forceReset();
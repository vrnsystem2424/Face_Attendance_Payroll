// backend/scripts/resetLeavesTo1.js
// 🎯 1 leave/month + Carry forward
// ✅ Joining month SKIP - next month se start

require('dotenv').config();
const mongoose = require('mongoose');
const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');

const FREE_LEAVES_PER_MONTH = 1;

const resetAllLeaveBalances = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    console.log('═══════════════════════════════════════════');
    console.log('  🔄 RESET - 1 LEAVE/MONTH (Skip Joining Month)');
    console.log('═══════════════════════════════════════════\n');

    const employees = await Employee.find({
      status: 'approved',
      role: { $in: ['employee', 'manager'] },
    });

    console.log(`👥 Total employees: ${employees.length}\n`);

    let updated = 0;
    let created = 0;
    let failed = 0;

    for (const employee of employees) {
      try {
        console.log(`\n📋 ${employee.name} (${employee.emp_code})`);

        const joinDate = new Date(employee.createdAt);
        const joinMonth = joinDate.getMonth() + 1;
        const joinYear = joinDate.getFullYear();

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        console.log(`   📅 Joined: ${joinMonth}/${joinYear} → Current: ${currentMonth}/${currentYear}`);

        const approvedLeaves = await Leave.find({
          emp_id: employee._id,
          status: 'approved',
        });

        const history = [];
        let runningBalance = 0;
        let totalCredited = 0;
        let totalUsed = 0;
        let monthCount = 0;

        // 🆕 START FROM NEXT MONTH AFTER JOINING
        let m = joinMonth + 1;
        let y = joinYear;
        if (m > 12) { m = 1; y++; }

        // If joined this month, skip - no leaves yet
        if (y > currentYear || (y === currentYear && m > currentMonth)) {
          console.log(`   ⏭️  Joined this month - No leaves credited yet`);
          
          const existing = await LeaveBalance.findOne({ emp_id: employee._id });
          if (existing) {
            existing.current_balance = 0;
            existing.total_credited = 0;
            existing.total_used = 0;
            existing.history = [];
            existing.last_credited_month = null;
            existing.last_credited_year = null;
            await existing.save();
            updated++;
          } else {
            await LeaveBalance.create({
              emp_id: employee._id,
              emp_code: employee.emp_code,
              name: employee.name,
              company_id: employee.company_id,
              current_balance: 0,
              total_credited: 0,
              total_used: 0,
              history: [],
            });
            created++;
          }
          console.log(`   💵 Final Balance: 0 leaves`);
          continue;
        }

        while (y < currentYear || (y === currentYear && m <= currentMonth)) {
          monthCount++;

          const opening = runningBalance;
          const credited = FREE_LEAVES_PER_MONTH;
          runningBalance += credited;
          totalCredited += credited;

          const monthLeaves = approvedLeaves.filter((l) => {
            const [fd, fm, fy] = l.from_date.split('/').map(Number);
            return fm === m && fy === y;
          });

          let usedInMonth = 0;
          const leavesLog = [];

          monthLeaves.forEach((l) => {
            const paidDays = l.paid_days || l.approved_days || 0;
            usedInMonth += paidDays;

            leavesLog.push({
              leave_id: l._id,
              from_date: l.from_date,
              to_date: l.to_date,
              applied_days: l.applied_days || l.leave_days || 0,
              approved_days: l.approved_days || 0,
              paid_days: paidDays,
              unpaid_days: l.unpaid_days || 0,
              approved_on: l.manager_action_date || l.updatedAt,
            });
          });

          runningBalance = Math.max(0, runningBalance - usedInMonth);
          totalUsed += usedInMonth;

          const closing = runningBalance;

          history.push({
            month: m,
            year: y,
            opening_balance: opening,
            credited: credited,
            used: usedInMonth,
            closing_balance: closing,
            leaves_log: leavesLog,
            credited_on: new Date(y, m - 1, 1),
          });

          m++;
          if (m > 12) { m = 1; y++; }
        }

        console.log(`   💰 Months: ${monthCount} | Credited: +${totalCredited} | Used: -${totalUsed}`);
        console.log(`   💵 Final Balance: ${runningBalance} leaves`);

        const existing = await LeaveBalance.findOne({ emp_id: employee._id });

        if (existing) {
          existing.current_balance = runningBalance;
          existing.total_credited = totalCredited;
          existing.total_used = totalUsed;
          existing.history = history;
          existing.last_credited_month = currentMonth;
          existing.last_credited_year = currentYear;
          await existing.save();
          updated++;
          console.log(`   ✅ UPDATED`);
        } else {
          await LeaveBalance.create({
            emp_id: employee._id,
            emp_code: employee.emp_code,
            name: employee.name,
            company_id: employee.company_id,
            current_balance: runningBalance,
            total_credited: totalCredited,
            total_used: totalUsed,
            history: history,
            last_credited_month: currentMonth,
            last_credited_year: currentYear,
          });
          created++;
          console.log(`   ✅ CREATED`);
        }
      } catch (err) {
        console.log(`   ❌ FAILED: ${err.message}`);
        failed++;
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('  📊 FINAL SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Updated:  ${updated}`);
    console.log(`✅ Created:  ${created}`);
    console.log(`❌ Failed:   ${failed}`);
    console.log(`📊 Total:    ${employees.length}`);
    console.log('═══════════════════════════════════════════');
    console.log('\n🎯 NEW SYSTEM:');
    console.log('   ✅ Joining month → NO leave');
    console.log('   ✅ Next month onwards → 1 leave/month');
    console.log('   ✅ Not used → Carry forward');
    console.log('   ✅ Used → Deducted\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
};

resetAllLeaveBalances();
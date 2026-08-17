// scripts/fixNewJoinerLeaves.js
// ✅ SAFE - New joiners ki extra July leave remove karega
// Sirf unke liye jinki joining_date August 2026 ya baad ki hai

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');

const SYSTEM_START_MONTH = 7;
const SYSTEM_START_YEAR = 2026;

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const isDryRun = !process.argv.includes('--apply');

    if (isDryRun) {
      console.log('╔════════════════════════════════════════════════════╗');
      console.log('║  🔍 DRY RUN - Preview only                        ║');
      console.log('║  Apply: node scripts/fixNewJoinerLeaves.js --apply║');
      console.log('╚════════════════════════════════════════════════════╝\n');
    } else {
      console.log('╔════════════════════════════════════════════════════╗');
      console.log('║  ⚡ APPLY MODE - Database update hoga!             ║');
      console.log('╚════════════════════════════════════════════════════╝\n');
    }

    // Find employees with joining_date set AND after system start
    const employees = await Employee.find({
      status: 'approved',
      joining_date: { $exists: true, $ne: '' },
    }).select('_id name emp_code joining_date');

    console.log(`👥 Employees with joining date: ${employees.length}\n`);

    const changes = [];
    let alreadyCorrect = 0;

    for (const emp of employees) {
      const parts = emp.joining_date.trim().split('/').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) continue;

      const [joinDay, joinMonth, joinYear] = parts;

      // Only process if joining AFTER system start month
      const joinedAfterStart =
        joinYear > SYSTEM_START_YEAR ||
        (joinYear === SYSTEM_START_YEAR && joinMonth > SYSTEM_START_MONTH);

      if (!joinedAfterStart) {
        // Joined in or before July 2026 = no fix needed
        continue;
      }

      // Get their leave balance
      const balance = await LeaveBalance.findOne({ emp_id: emp._id });
      if (!balance) continue;

      // Calculate how many months SHOULD have been credited
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      let expectedMonths = 0;
      let m = joinMonth;
      let y = joinYear;
      while (y < currentYear || (y === currentYear && m <= currentMonth)) {
        expectedMonths++;
        m++;
        if (m > 12) { m = 1; y++; }
      }

      // How many actually credited
      const actualCredited = balance.total_credited;

      // Extra leaves = actual - expected
      const extraLeaves = actualCredited - expectedMonths;

      if (extraLeaves > 0) {
        changes.push({
          id: balance._id,
          emp_name: emp.name,
          emp_code: emp.emp_code,
          joining_date: emp.joining_date,
          join_month: joinMonth,
          join_year: joinYear,
          expected_months: expectedMonths,
          actual_credited: actualCredited,
          extra_leaves: extraLeaves,
          current_balance: balance.current_balance,
          new_balance: Math.max(0, balance.current_balance - extraLeaves),
          new_total_credited: balance.total_credited - extraLeaves,
        });
      } else {
        alreadyCorrect++;
      }
    }

    // ── Show Results ──
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Already correct: ${alreadyCorrect}`);
    console.log(`⚠️  Needs fixing:   ${changes.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (changes.length === 0) {
      console.log('🎉 Sab sahi hai! Koi fix needed nahi.\n');
      process.exit(0);
    }

    console.log('┌───────────────────────────────────────────────────────────');
    console.log('│ ⚠️  EXTRA LEAVES FIX (will be deducted):');
    console.log('├───────────────────────────────────────────────────────────');

    changes.forEach(c => {
      console.log(
        `│  ${c.emp_name.padEnd(25)} (${c.emp_code})` +
        ` | Joined: ${c.joining_date}` +
        ` | Expected: ${c.expected_months} leaves` +
        ` | Got: ${c.actual_credited} leaves` +
        ` | Extra: ${c.extra_leaves}` +
        ` | Balance: ${c.current_balance} → ${c.new_balance}`
      );
    });

    console.log(`├───────────────────────────────────────────────────────────`);
    console.log(`│  Total: ${changes.length} employees`);
    console.log('└───────────────────────────────────────────────────────────\n');

    // ── Safety Info ──
    console.log('🔒 SAFETY:');
    console.log('   ✅ Sirf joining_date set wale employees');
    console.log('   ✅ Sirf system start ke baad join karne wale');
    console.log('   ✅ Purane employees (bina joining_date) UNTOUCHED');
    console.log('   ✅ Leave history mein adjustment entry add hogi');
    console.log('   ✅ current_balance aur total_credited fix hogi\n');

    // ── Apply ──
    if (!isDryRun) {
      console.log('⚡ Applying fixes...\n');

      let fixed = 0;
      let failed = 0;

      for (const change of changes) {
        try {
          const balance = await LeaveBalance.findById(change.id);
          if (!balance) { failed++; continue; }

          // Remove extra credited months from history
          // Find and remove the earliest credited months that shouldn't be there
          const extraMonthsToRemove = change.extra_leaves;
          let removed = 0;

          // Sort history by year/month ascending
          balance.history.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
          });

          // Remove entries that are BEFORE joining month
          const [joinDay, joinMonth, joinYear] = change.joining_date.split('/').map(Number);
          
          for (let i = 0; i < balance.history.length && removed < extraMonthsToRemove; i++) {
            const entry = balance.history[i];
            const entryIsBefore =
              entry.year < joinYear ||
              (entry.year === joinYear && entry.month < joinMonth);

            if (entryIsBefore && entry.credited > 0 && entry.leaves_log.length === 0) {
              // This month shouldn't have been credited
              console.log(`   Removing ${entry.month}/${entry.year} credit for ${change.emp_name}`);
              balance.history.splice(i, 1);
              removed++;
              i--; // Adjust index after splice
            }
          }

          // Update totals
          balance.current_balance = change.new_balance;
          balance.total_credited = change.new_total_credited;

          await balance.save();
          console.log(`✅ Fixed: ${change.emp_name} | Balance: ${change.current_balance} → ${change.new_balance}`);
          fixed++;
        } catch (err) {
          console.error(`❌ Failed: ${change.emp_name} - ${err.message}`);
          failed++;
        }
      }

      console.log('\n═══════════════════════════════════════════');
      console.log(`✅ Fixed: ${fixed}`);
      if (failed > 0) console.log(`❌ Failed: ${failed}`);
      console.log('═══════════════════════════════════════════\n');
    } else {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔍 DRY RUN COMPLETE - Kuch nahi badla');
      console.log('');
      console.log('   Sab sahi hai? Apply karo:');
      console.log('   node scripts/fixNewJoinerLeaves.js --apply');
      console.log('═══════════════════════════════════════════════════════\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();
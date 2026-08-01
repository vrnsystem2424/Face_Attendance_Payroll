const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI;
const EMP_CODE = 'RCC-AB2424';

const round = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

const fix = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    const emp = await Employee.findOne({ emp_code: EMP_CODE });
    const balance = await LeaveBalance.findOne({ emp_id: emp._id });

    // Backup
    const backupPath = path.resolve(__dirname, `backup-abhi-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(balance.toObject(), null, 2));
    console.log(`💾 Backup: ${backupPath}\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`👤 ${emp.name} (${emp.emp_code})`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📌 BEFORE:');
    console.log(`   Current: ${balance.current_balance} | Credited: ${balance.total_credited} | Used: ${balance.total_used}\n`);

    // ═══════════════════════════════════════════
    // 🎯 EXPECTED VALUES
    // ═══════════════════════════════════════════
    // July: +1 auto credit, 4 leaves used, balance 1 → paid 1, unpaid 3
    // Closing July: 0
    // August: 0 opening + 1 auto = 1 closing
    
    const JULY_CREDITED = 1;
    const JULY_USED = 1;  // Only 1 paid (balance 1 thi)
    const JULY_CLOSING = 0;
    
    const AUGUST_OPENING = 0;
    const AUGUST_CREDITED = 1;
    const AUGUST_USED = 0;
    const AUGUST_CLOSING = 1;

    // ─── Get July leaves ───
    const julyLeaves = await Leave.find({
      emp_id: emp._id,
      status: 'approved',
    });
    const julyLeavesFiltered = julyLeaves.filter(l => {
      const [d, m, y] = l.from_date.split('/').map(Number);
      return m === 7 && y === 2026;
    });

    console.log(`📋 Found ${julyLeavesFiltered.length} July leaves\n`);

    // ─── FIX JULY ───
    let julyEntry = balance.history.find(h => Number(h.month) === 7 && Number(h.year) === 2026);
    
    if (julyEntry) {
      julyEntry.opening_balance = 0;
      julyEntry.credited = JULY_CREDITED;
      julyEntry.used = JULY_USED;
      julyEntry.closing_balance = JULY_CLOSING;

      // Rebuild leaves_log with actual leaves only
      // Balance 1, leave 4 days → 1 paid, 3 unpaid
      let remainingBalance = JULY_CREDITED;
      
      julyEntry.leaves_log = julyLeavesFiltered.map(l => {
        const days = Number(l.approved_days) || Number(l.leave_days) || (l.is_half_day ? 0.5 : 1);
        const paid = Math.min(days, remainingBalance);
        const unpaid = round(days - paid);
        remainingBalance = round(remainingBalance - paid);
        
        return {
          leave_id: l._id,
          from_date: l.from_date,
          to_date: l.to_date,
          applied_days: days,
          approved_days: days,
          paid_days: paid,
          unpaid_days: unpaid,
          approved_on: l.updatedAt || new Date(),
        };
      });
    }

    // ─── FIX AUGUST ───
    let augEntry = balance.history.find(h => Number(h.month) === 8 && Number(h.year) === 2026);
    if (augEntry) {
      augEntry.opening_balance = AUGUST_OPENING;
      augEntry.credited = AUGUST_CREDITED;
      augEntry.used = AUGUST_USED;
      augEntry.closing_balance = AUGUST_CLOSING;
      augEntry.leaves_log = [];
    }

    // ─── MAIN FIELDS ───
    balance.current_balance = AUGUST_CLOSING;
    balance.total_credited = round(JULY_CREDITED + AUGUST_CREDITED);
    balance.total_used = round(JULY_USED + AUGUST_USED);
    balance.last_credited_month = 8;
    balance.last_credited_year = 2026;

    balance.markModified('history');
    await balance.save();

    // AFTER
    const jA = balance.history.find(h => Number(h.month) === 7 && Number(h.year) === 2026);
    const aA = balance.history.find(h => Number(h.month) === 8 && Number(h.year) === 2026);

    console.log('✅ AFTER:');
    console.log(`   Current: ${balance.current_balance}`);
    console.log(`   Credited: ${balance.total_credited}`);
    console.log(`   Used: ${balance.total_used}`);
    console.log(`   July  : Open=${jA.opening_balance} | Cr=+${jA.credited} | Us=-${jA.used} | Close=${jA.closing_balance}`);
    console.log(`   August: Open=${aA.opening_balance} | Cr=+${aA.credited} | Us=-${aA.used} | Close=${aA.closing_balance}`);
    console.log('\n🎉 SUCCESS! Abhinandan ka balance ab 1 hai\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

fix();
// backend/utils/autoCheckout.js

const Attendance = require('../models/Attendance');

// ════════════════════════════════════════════
// 🎯 AUTO CHECK-OUT
// Runs at midnight (or manually)
// If employee has IN but no OUT → set OUT to 06:00 PM
// ════════════════════════════════════════════

const DEFAULT_OUT_TIME = '06:00 PM';   // Default checkout time

const autoCheckout = async () => {
  try {
    // Get today's date in D/M/YYYY format
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const todayDate = `${day}/${month}/${year}`;

    console.log(`\n🔄 AUTO CHECKOUT — ${todayDate}`);
    console.log('═══════════════════════════════════════');

    // Find all attendance records for today with IN but NO OUT
    const pendingCheckouts = await Attendance.find({
      date: todayDate,
      in_time: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { out_time: null },
        { out_time: '' },
        { out_time: { $exists: false } },
      ],
    });

    console.log(`📊 Found ${pendingCheckouts.length} employees without checkout\n`);

    if (pendingCheckouts.length === 0) {
      console.log('✅ No pending checkouts. All good!\n');
      return { updated: 0, total: 0 };
    }

    let updated = 0;

    for (const attendance of pendingCheckouts) {
      try {
        attendance.out_time = DEFAULT_OUT_TIME;
        attendance.out_location_status = 'auto-checkout';
        attendance.out_site = 'Auto (missed checkout)';
        await attendance.save();

        console.log(`✅ ${attendance.name} (${attendance.emp_code}) → OUT: ${DEFAULT_OUT_TIME} (auto)`);
        updated++;
      } catch (err) {
        console.log(`❌ ${attendance.name}: ${err.message}`);
      }
    }

    console.log(`\n═══════════════════════════════════════`);
    console.log(`✅ Auto Checkout Complete: ${updated}/${pendingCheckouts.length} updated`);
    console.log('═══════════════════════════════════════\n');

    return { updated, total: pendingCheckouts.length };
  } catch (err) {
    console.error('❌ Auto checkout error:', err);
    return { updated: 0, total: 0, error: err.message };
  }
};

module.exports = autoCheckout;
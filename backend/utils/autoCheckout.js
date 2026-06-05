// backend/utils/autoCheckout.js

const Attendance = require('../models/Attendance');

const DEFAULT_OUT_TIME = '06:00 PM';

const autoCheckout = async () => {
  try {
    console.log(`\n🔄 AUTO CHECKOUT — Running...`);
    console.log('═══════════════════════════════════════');

    // 🆕 Find ALL records with IN but NO OUT (ANY date — not just today)
    const pendingCheckouts = await Attendance.find({
      in_time: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { out_time: null },
        { out_time: '' },
        { out_time: { $exists: false } },
      ],
    });

    console.log(`📊 Found ${pendingCheckouts.length} records without checkout\n`);

    if (pendingCheckouts.length === 0) {
      console.log('✅ No pending checkouts!\n');
      return { updated: 0, total: 0 };
    }

    let updated = 0;

    for (const attendance of pendingCheckouts) {
      try {
        attendance.out_time = DEFAULT_OUT_TIME;
        attendance.out_location_status = 'auto-checkout';
        attendance.out_site = 'Auto (missed checkout)';
        await attendance.save();

        console.log(`✅ ${attendance.name} (${attendance.emp_code}) | ${attendance.date} → OUT: ${DEFAULT_OUT_TIME}`);
        updated++;
      } catch (err) {
        console.log(`❌ ${attendance.name}: ${err.message}`);
      }
    }

    console.log(`\n✅ Auto Checkout Done: ${updated}/${pendingCheckouts.length} updated\n`);

    return { updated, total: pendingCheckouts.length };
  } catch (err) {
    console.error('❌ Auto checkout error:', err);
    return { updated: 0, total: 0, error: err.message };
  }
};

module.exports = autoCheckout;
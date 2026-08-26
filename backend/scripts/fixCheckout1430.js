// scripts/fixCheckout1430.js
// ✅ SAFE SCRIPT
// 14/8/2026 aur 22/8/2026 ke checkout fix
// - Missing checkout → 06:30 PM
// - Early checkout → 06:30 PM
// - Leave pe jo the → SKIP
// - Pehle DRY RUN, phir --apply

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');

// ════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════
const TARGET_DATES = ['14/8/2026', '22/8/2026'];
const NEW_OUT_TIME = '06:30 PM';
const OFFICE_OUT_MINUTES = 18 * 60 + 30; // 6:30 PM = 1110

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(' ');
  if (parts.length !== 2) return null;
  const [time, period] = parts;
  const [hStr, mStr] = time.split(':');
  let hours = parseInt(hStr, 10);
  let minutes = parseInt(mStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  const [d, m, y] = dateStr.split('/').map(Number);
  return `${d}/${m}/${y}`;
};

const isDateInLeaveRange = (targetDate, fromDate, toDate) => {
  try {
    const [td, tm, ty] = normalizeDate(targetDate).split('/').map(Number);
    const [fd, fm, fy] = normalizeDate(fromDate).split('/').map(Number);
    const [ed, em, ey] = normalizeDate(toDate).split('/').map(Number);

    const t = new Date(ty, tm - 1, td);
    const f = new Date(fy, fm - 1, fd);
    const e = new Date(ey, em - 1, ed);

    return t >= f && t <= e;
  } catch (err) {
    return false;
  }
};

// Late/half-day recalculate (same office rules)
const getAttendanceStatus = (in_time, out_time) => {
  const inMin = parseTimeToMinutes(in_time);
  const outMin = parseTimeToMinutes(out_time);

  const LATE_IN = 585;       // 9:45 AM
  const HALF_DAY_IN = 660;   // 11:00 AM
  const HALF_DAY_OUT = 960;  // 4:00 PM
  const OFFICE_OUT = 1110;   // 6:30 PM

  let status = 'present';
  let is_late = false;
  let is_half_day = false;
  let reasons = [];

  if (!in_time || inMin === null) {
    return {
      status: 'absent',
      is_late: false,
      is_half_day: false,
      reasons: ['No IN time'],
    };
  }

  if (inMin >= HALF_DAY_IN) {
    status = 'half-day';
    is_half_day = true;
    reasons.push(`Late IN: ${in_time} (Half Day)`);
  } else if (inMin > LATE_IN) {
    status = 'late';
    is_late = true;
    reasons.push(`Late IN: ${in_time}`);
  }

  if (outMin !== null) {
    if (outMin <= HALF_DAY_OUT) {
      status = 'half-day';
      is_half_day = true;
      is_late = false;
      reasons.push(`Early OUT: ${out_time} (Half Day)`);
    } else if (outMin < OFFICE_OUT) {
      if (status !== 'half-day') {
        status = 'late';
        is_late = true;
      }
      reasons.push(`Early OUT: ${out_time}`);
    }
  }

  return { status, is_late, is_half_day, reasons };
};

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const isDryRun = !process.argv.includes('--apply');

    if (isDryRun) {
      console.log('╔══════════════════════════════════════════════════════════╗');
      console.log('║  🔍 DRY RUN - Sirf preview                              ║');
      console.log('║     Database mein KUCH NAHI badlega                      ║');
      console.log('║                                                          ║');
      console.log('║  Apply karne ke liye:                                    ║');
      console.log('║  node scripts/fixCheckout1430.js --apply                 ║');
      console.log('╚══════════════════════════════════════════════════════════╝\n');
    } else {
      console.log('╔══════════════════════════════════════════════════════════╗');
      console.log('║  ⚡ APPLY MODE - Database UPDATE hoga!                   ║');
      console.log('║     Sirf out_time / late flags change honge              ║');
      console.log('║     Leave wale UNTOUCHED rahenge                         ║');
      console.log('╚══════════════════════════════════════════════════════════╝\n');
    }

    console.log(`📅 Target Dates: ${TARGET_DATES.join(' , ')}`);
    console.log(`⏰ New OUT time: ${NEW_OUT_TIME}\n`);

    // ── Get all attendance for these dates with IN ──
    const attendanceRecords = await Attendance.find({
      date: { $in: TARGET_DATES },
      in_time: { $exists: true, $ne: null, $ne: '' },
    }).sort({ date: 1, name: 1 });

    console.log(`📋 Total attendance with IN found: ${attendanceRecords.length}\n`);

    if (attendanceRecords.length === 0) {
      console.log('⚠️  Koi record nahi mila.\n');
      process.exit(0);
    }

    // ── Approved leaves for these employees/dates ──
    const empIds = [...new Set(attendanceRecords.map(a => a.emp_id.toString()))];

    const approvedLeaves = await Leave.find({
      emp_id: { $in: empIds },
      status: 'approved',
    }).select('emp_id from_date to_date is_half_day leave_type name emp_code');

    // Build leave map
    const leaveMap = {}; // empId -> array of leaves
    approvedLeaves.forEach(l => {
      const key = l.emp_id.toString();
      if (!leaveMap[key]) leaveMap[key] = [];
      leaveMap[key].push(l);
    });

    // Employee worker_type map
    const employees = await Employee.find({
      _id: { $in: empIds },
    }).select('_id name emp_code worker_type');

    const empMap = {};
    employees.forEach(e => {
      empMap[e._id.toString()] = e;
    });

    // ── Classify records ──
    const toFixMissing = [];   // no out_time
    const toFixEarly = [];     // out_time before 6:30 PM
    const skippedLeave = [];   // on leave
    const alreadyOk = [];      // already 6:30 or later
    const skippedNoNeed = [];

    for (const att of attendanceRecords) {
      const empId = att.emp_id.toString();
      const emp = empMap[empId];
      const empLeaves = leaveMap[empId] || [];

      // Check if on approved leave that day
      const onLeave = empLeaves.some(l =>
        isDateInLeaveRange(att.date, l.from_date, l.to_date)
      );

      if (onLeave) {
        skippedLeave.push({
          id: att._id,
          name: att.name,
          emp_code: att.emp_code,
          date: att.date,
          in_time: att.in_time,
          out_time: att.out_time || '—',
          reason: 'On approved leave',
        });
        continue;
      }

      const outMin = parseTimeToMinutes(att.out_time);
      const hasOut = !!att.out_time && outMin !== null;

      // Case 1: Missing checkout
      if (!hasOut) {
        toFixMissing.push({
          id: att._id,
          name: att.name,
          emp_code: att.emp_code,
          date: att.date,
          in_time: att.in_time,
          old_out: att.out_time || null,
          new_out: NEW_OUT_TIME,
          worker_type: emp?.worker_type || 'office',
          type: 'MISSING_CHECKOUT',
        });
        continue;
      }

      // Case 2: Early checkout (before 6:30 PM)
      if (outMin < OFFICE_OUT_MINUTES) {
        toFixEarly.push({
          id: att._id,
          name: att.name,
          emp_code: att.emp_code,
          date: att.date,
          in_time: att.in_time,
          old_out: att.out_time,
          new_out: NEW_OUT_TIME,
          worker_type: emp?.worker_type || 'office',
          type: 'EARLY_CHECKOUT',
        });
        continue;
      }

      // Already 6:30 PM or later
      alreadyOk.push({
        id: att._id,
        name: att.name,
        emp_code: att.emp_code,
        date: att.date,
        in_time: att.in_time,
        out_time: att.out_time,
      });
    }

    // ════════════════════════════════════════
    // PREVIEW
    // ════════════════════════════════════════
    console.log('════════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('════════════════════════════════════════════════════════════\n');
    console.log(`   Total records checked:     ${attendanceRecords.length}`);
    console.log(`   🔧 Missing checkout fix:   ${toFixMissing.length}`);
    console.log(`   🔧 Early checkout fix:     ${toFixEarly.length}`);
    console.log(`   ⏭️  On leave (skip):        ${skippedLeave.length}`);
    console.log(`   ✅ Already OK (6:30+):     ${alreadyOk.length}`);
    console.log(`   📦 Total will update:      ${toFixMissing.length + toFixEarly.length}\n`);

    // Group by date helper
    const printGroup = (title, list, colorNote) => {
      if (list.length === 0) return;

      console.log('┌─────────────────────────────────────────────────────────────────');
      console.log(`│ ${title}`);
      if (colorNote) console.log(`│ ${colorNote}`);
      console.log('├─────────────────────────────────────────────────────────────────');

      // sort by date then name
      list.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date, undefined, { numeric: true });
        return (a.name || '').localeCompare(b.name || '');
      });

      list.forEach((r, idx) => {
        console.log(
          `│  ${String(idx + 1).padStart(2)}. ${(r.name || '').padEnd(22)} (${r.emp_code || '—'})` +
          ` | ${r.date.padEnd(10)}` +
          ` | IN: ${(r.in_time || '—').padEnd(9)}` +
          ` | OUT: ${(r.old_out || r.out_time || '—').padEnd(9)}` +
          (r.new_out ? ` → ${r.new_out}` : '') +
          (r.reason ? ` | ${r.reason}` : '')
        );
      });

      console.log(`│  Total: ${list.length}`);
      console.log('└─────────────────────────────────────────────────────────────────\n');
    };

    printGroup(
      '🔧 MISSING CHECKOUT → 06:30 PM set hoga',
      toFixMissing,
      '   (in_time hai, out_time nahi)'
    );

    printGroup(
      '🔧 EARLY CHECKOUT → 06:30 PM set hoga',
      toFixEarly,
      '   (out_time 6:30 PM se pehle tha)'
    );

    printGroup(
      '⏭️  ON LEAVE → SKIP (kuch nahi hoga)',
      skippedLeave,
      '   (approved leave pe the)'
    );

    if (alreadyOk.length > 0) {
      console.log(`✅ Already OK (OUT 6:30 PM ya baad): ${alreadyOk.length} records\n`);
    }

    // Safety
    console.log('════════════════════════════════════════════════════════════');
    console.log('🔒 SAFETY');
    console.log('════════════════════════════════════════════════════════════');
    console.log('   ✅ Sirf dates: 14/8/2026, 22/8/2026');
    console.log('   ✅ Leave wale untouched');
    console.log('   ✅ in_time / selfie / GPS untouched');
    console.log('   ✅ Sirf out_time + late/half-day flags update');
    console.log('   ✅ out_location_status = manual-entry mark hoga');
    console.log('   ✅ worker_type site hai to late skip hi rahega\n');

    const allToFix = [...toFixMissing, ...toFixEarly];

    if (allToFix.length === 0) {
      console.log('🎉 Kuch fix karne ka nahi hai.\n');
      process.exit(0);
    }

    // ════════════════════════════════════════
    // APPLY
    // ════════════════════════════════════════
    if (isDryRun) {
      console.log('════════════════════════════════════════════════════════════');
      console.log('🔍 DRY RUN COMPLETE — Database mein KUCH NAHI badla');
      console.log('');
      console.log('   Preview sahi hai? To apply karo:');
      console.log('   node scripts/fixCheckout1430.js --apply');
      console.log('════════════════════════════════════════════════════════════\n');
      process.exit(0);
    }

    console.log('⚡ Applying changes...\n');

    let applied = 0;
    let failed = 0;

    for (const item of allToFix) {
      try {
        const att = await Attendance.findById(item.id);
        if (!att) {
          failed++;
          console.log(`❌ Not found: ${item.name} ${item.date}`);
          continue;
        }

        // Double-check leave again before update
        const empLeaves = leaveMap[att.emp_id.toString()] || [];
        const stillOnLeave = empLeaves.some(l =>
          isDateInLeaveRange(att.date, l.from_date, l.to_date)
        );
        if (stillOnLeave) {
          console.log(`⏭️  Skip leave: ${item.name} ${item.date}`);
          continue;
        }

        const oldOut = att.out_time || null;

        // Update OUT
        att.out_time = NEW_OUT_TIME;
        att.out_location_status = 'manual-entry';
        att.out_site = att.out_site || 'Manual Checkout Fix';
        att.out_address = att.out_address || 'Checkout fixed by script (06:30 PM)';
        // GPS zero only if missing checkout previously
        if (!oldOut) {
          att.out_latitude = att.out_latitude || 0;
          att.out_longitude = att.out_longitude || 0;
          att.out_distance = att.out_distance || 0;
        }

        // Recalculate late/half-day by worker type
        const emp = empMap[att.emp_id.toString()];
        const isSiteWorker = emp?.worker_type === 'site';

        let statusInfo;
        if (isSiteWorker) {
          statusInfo = {
            status: 'present',
            is_late: false,
            is_half_day: false,
            reasons: ['Site worker - Rules skipped'],
          };
        } else {
          statusInfo = getAttendanceStatus(att.in_time, NEW_OUT_TIME);
        }

        att.is_late = statusInfo.is_late;
        att.is_half_day = statusInfo.is_half_day;
        att.daily_status = statusInfo.status;
        att.late_reasons = statusInfo.reasons;

        // Audit note
        att.flag_reasons = [
          ...(att.flag_reasons || []),
          `CHECKOUT_FIX_SCRIPT: ${oldOut || 'MISSING'} → ${NEW_OUT_TIME} | Date: ${att.date} | On: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
        ];
        att.reviewed = true;
        att.review_notes = `Checkout fixed by script. Old OUT: ${oldOut || 'MISSING'} → ${NEW_OUT_TIME}`;

        await att.save();

        applied++;
        console.log(
          `✅ ${item.name.padEnd(22)} | ${item.date} | ${(oldOut || 'MISSING').padEnd(9)} → ${NEW_OUT_TIME} | ${item.type}`
        );
      } catch (err) {
        failed++;
        console.error(`❌ Failed: ${item.name} ${item.date} → ${err.message}`);
      }
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`✅ Applied: ${applied}`);
    if (failed > 0) console.log(`❌ Failed:  ${failed}`);
    console.log(`⏭️  Leave skipped: ${skippedLeave.length}`);
    console.log('════════════════════════════════════════════════════════════\n');
    console.log('🎉 DONE!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();
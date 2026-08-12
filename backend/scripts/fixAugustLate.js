// scripts/fixAugustLate.js
// ✅ SAFE - Sirf August 2025 | Sirf office workers fix karega
// Site workers ko touch nahi karega

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// ── Late/Half-Day Rules (same as attendanceStatus.js) ──
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(' ');
  if (parts.length !== 2) return null;
  const [time, period] = parts;
  const timeParts = time.split(':');
  if (timeParts.length !== 2) return null;
  let hours = parseInt(timeParts[0]);
  let minutes = parseInt(timeParts[1]);
  if (isNaN(hours) || isNaN(minutes)) return null;
  if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const getAttendanceStatus = (in_time, out_time) => {
  const inMin = parseTimeToMinutes(in_time);
  const LATE_IN = 585;       // 9:45 AM
  const HALF_DAY_IN = 660;   // 11:00 AM
  const HALF_DAY_OUT = 960;  // 4:00 PM
  const OFFICE_OUT = 1110;   // 6:30 PM

  let status = 'present';
  let is_late = false;
  let is_half_day = false;
  let reasons = [];

  if (!in_time || inMin === null) {
    return { status: 'absent', is_late: false, is_half_day: false, reasons: ['No IN time'] };
  }

  // IN time check
  if (inMin >= HALF_DAY_IN) {
    status = 'half-day';
    is_half_day = true;
    reasons.push(`Late IN: ${in_time} (Half Day)`);
  } else if (inMin > LATE_IN) {
    status = 'late';
    is_late = true;
    reasons.push(`Late IN: ${in_time}`);
  }

  // OUT time check
  const outMin = parseTimeToMinutes(out_time);
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
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const isDryRun = !process.argv.includes('--apply');

    if (isDryRun) {
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║  🔍 DRY RUN - Sirf preview dikhayega                    ║');
      console.log('║     Database mein KUCH NAHI badlega                      ║');
      console.log('║                                                          ║');
      console.log('║  Apply karne ke liye:                                    ║');
      console.log('║  node scripts/fixAugustLate.js --apply                   ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');
    } else {
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║  ⚡ APPLY MODE - Database UPDATE hoga!                   ║');
      console.log('║     Sirf is_late, is_half_day, daily_status,             ║');
      console.log('║     late_reasons change honge                            ║');
      console.log('║     Baaki sab (time, selfie, GPS) SAFE hai              ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');
    }

    // ── August 2025 Dates ──
    const MONTH = 8;
const YEAR = 2026;
    const daysInMonth = new Date(YEAR, MONTH, 0).getDate();
    const augustDates = [];
    for (let d = 1; d <= daysInMonth; d++) {
      augustDates.push(`${d}/${MONTH}/${YEAR}`);
    }
    console.log(`📅 August 2025: ${daysInMonth} days\n`);

    // ── Get ALL approved employees ──
    const allEmployees = await Employee.find({
      status: 'approved',
      role: { $in: ['employee', 'manager'] },
    }).select('_id name emp_code worker_type company_id');

    const officeWorkers = allEmployees.filter(e => (e.worker_type || 'office') === 'office');
    const siteWorkers = allEmployees.filter(e => e.worker_type === 'site');

    console.log(`👥 Total Employees: ${allEmployees.length}`);
    console.log(`   🏢 Office Workers: ${officeWorkers.length} ← YEH FIX HONGE`);
    console.log(`   🚧 Site Workers:   ${siteWorkers.length} ← IN KO TOUCH NAHI KARENGE\n`);

    if (officeWorkers.length === 0) {
      console.log('⚠️  Koi office worker nahi mila! Pehle worker_type set karo.');
      process.exit(0);
    }

    // ── Track changes ──
    const changes = [];
    let alreadyCorrect = 0;
    let totalRecordsChecked = 0;

    // ── Stats ──
    let stats = {
      presentToLate: 0,       // Was present, should be late
      presentToHalfDay: 0,    // Was present, should be half-day
      lateToPresent: 0,       // Was late, should be present (on-time)
      lateToHalfDay: 0,       // Was late, should be half-day
      halfDayToPresent: 0,    // Was half-day, should be present
      halfDayToLate: 0,       // Was half-day, should be late
      siteWorkerSkipped: 0,   // Site workers skipped
    };

    // ══════════════════════════════════════
    // PROCESS OFFICE WORKERS ONLY
    // ══════════════════════════════════════
    console.log('─────────────────────────────────────────────────');
    console.log('🏢 Processing OFFICE WORKERS...');
    console.log('─────────────────────────────────────────────────\n');

    for (const emp of officeWorkers) {
      const records = await Attendance.find({
        emp_id: emp._id,
        date: { $in: augustDates },
        in_time: { $exists: true, $ne: null, $ne: '' },
      }).select('_id date in_time out_time is_late is_half_day daily_status late_reasons in_location_status');

      for (const att of records) {
        totalRecordsChecked++;

        // ✅ Recalculate correct status based on time (GPS IGNORED)
        const correct = getAttendanceStatus(att.in_time, att.out_time);

        // Check if anything is wrong
        const lateWrong = att.is_late !== correct.is_late;
        const halfDayWrong = att.is_half_day !== correct.is_half_day;
        const statusWrong = att.daily_status !== correct.status;

        if (lateWrong || halfDayWrong || statusWrong) {
          // Track what kind of change
          const oldStatus = att.daily_status || 'present';
          const newStatus = correct.status;

          if (oldStatus === 'present' && newStatus === 'late') stats.presentToLate++;
          else if (oldStatus === 'present' && newStatus === 'half-day') stats.presentToHalfDay++;
          else if (oldStatus === 'late' && newStatus === 'present') stats.lateToPresent++;
          else if (oldStatus === 'late' && newStatus === 'half-day') stats.lateToHalfDay++;
          else if (oldStatus === 'half-day' && newStatus === 'present') stats.halfDayToPresent++;
          else if (oldStatus === 'half-day' && newStatus === 'late') stats.halfDayToLate++;

          changes.push({
            id: att._id,
            emp_name: emp.name,
            emp_code: emp.emp_code,
            date: att.date,
            in_time: att.in_time,
            out_time: att.out_time || '—',
            gps_status: att.in_location_status || '—',
            // OLD
            old_late: att.is_late,
            old_half_day: att.is_half_day,
            old_status: att.daily_status || 'present',
            // NEW (correct)
            new_late: correct.is_late,
            new_half_day: correct.is_half_day,
            new_status: correct.status,
            new_reasons: correct.reasons,
          });
        } else {
          alreadyCorrect++;
        }
      }
    }

    // ── Count site workers skipped ──
    for (const emp of siteWorkers) {
      const count = await Attendance.countDocuments({
        emp_id: emp._id,
        date: { $in: augustDates },
        in_time: { $exists: true, $ne: null, $ne: '' },
      });
      stats.siteWorkerSkipped += count;
    }

    // ════════════════════════════════════════
    // SHOW RESULTS
    // ════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`   Total records checked (office): ${totalRecordsChecked}`);
    console.log(`   ✅ Already correct:             ${alreadyCorrect}`);
    console.log(`   ⚠️  Needs fixing:               ${changes.length}`);
    console.log(`   🚧 Site worker records skipped: ${stats.siteWorkerSkipped}\n`);

    if (changes.length > 0) {
      console.log('   Change Breakdown:');
      if (stats.presentToLate > 0)
        console.log(`   ❌ Present → Late:     ${stats.presentToLate} (late nahi laga tha, ab lagega)`);
      if (stats.presentToHalfDay > 0)
        console.log(`   ❌ Present → Half-Day: ${stats.presentToHalfDay} (half-day nahi laga tha)`);
      if (stats.lateToPresent > 0)
        console.log(`   ✅ Late → Present:     ${stats.lateToPresent} (galat late laga tha, hatega)`);
      if (stats.lateToHalfDay > 0)
        console.log(`   🔄 Late → Half-Day:   ${stats.lateToHalfDay}`);
      if (stats.halfDayToPresent > 0)
        console.log(`   ✅ Half-Day → Present: ${stats.halfDayToPresent} (galat half-day laga tha)`);
      if (stats.halfDayToLate > 0)
        console.log(`   🔄 Half-Day → Late:   ${stats.halfDayToLate}`);
      console.log('');
    }

    if (changes.length === 0) {
      console.log('🎉 Sab kuch sahi hai! Koi fix needed nahi.\n');
      process.exit(0);
    }

    // ── Show each change ──
    // Group: Present → Late (most important)
    const presentToLateChanges = changes.filter(c => c.old_status === 'present' && c.new_status === 'late');
    const presentToHalfDayChanges = changes.filter(c => c.old_status === 'present' && c.new_status === 'half-day');
    const wrongLateChanges = changes.filter(c => (c.old_status === 'late' || c.old_status === 'half-day') && c.new_status === 'present');
    const otherChanges = changes.filter(c =>
      !presentToLateChanges.includes(c) &&
      !presentToHalfDayChanges.includes(c) &&
      !wrongLateChanges.includes(c)
    );

    if (presentToLateChanges.length > 0) {
      console.log('┌─────────────────────────────────────────────────────────────────');
      console.log('│ ❌ LATE NAHI LAGA THA → Ab Late Mark Hoga');
      console.log('│    (Office worker tha, GPS out-of-range hone se skip ho gaya tha)');
      console.log('├─────────────────────────────────────────────────────────────────');
      presentToLateChanges.forEach(c => {
        console.log(
          `│  ${c.emp_name.padEnd(20)} (${c.emp_code})` +
          ` | ${c.date.padEnd(12)}` +
          ` | IN: ${c.in_time.padEnd(10)}` +
          ` | GPS: ${c.gps_status.padEnd(15)}` +
          ` | present → LATE`
        );
      });
      console.log(`│  Total: ${presentToLateChanges.length}`);
      console.log('└─────────────────────────────────────────────────────────────────\n');
    }

    if (presentToHalfDayChanges.length > 0) {
      console.log('┌─────────────────────────────────────────────────────────────────');
      console.log('│ ❌ HALF-DAY NAHI LAGA THA → Ab Half-Day Mark Hoga');
      console.log('├─────────────────────────────────────────────────────────────────');
      presentToHalfDayChanges.forEach(c => {
        console.log(
          `│  ${c.emp_name.padEnd(20)} (${c.emp_code})` +
          ` | ${c.date.padEnd(12)}` +
          ` | IN: ${c.in_time.padEnd(10)} OUT: ${c.out_time.padEnd(10)}` +
          ` | present → HALF-DAY`
        );
      });
      console.log(`│  Total: ${presentToHalfDayChanges.length}`);
      console.log('└─────────────────────────────────────────────────────────────────\n');
    }

    if (wrongLateChanges.length > 0) {
      console.log('┌─────────────────────────────────────────────────────────────────');
      console.log('│ ✅ GALAT LATE/HALF-DAY LAGA THA → Ab Present Hoga');
      console.log('├─────────────────────────────────────────────────────────────────');
      wrongLateChanges.forEach(c => {
        console.log(
          `│  ${c.emp_name.padEnd(20)} (${c.emp_code})` +
          ` | ${c.date.padEnd(12)}` +
          ` | IN: ${c.in_time.padEnd(10)}` +
          ` | ${c.old_status} → PRESENT ✅`
        );
      });
      console.log(`│  Total: ${wrongLateChanges.length}`);
      console.log('└─────────────────────────────────────────────────────────────────\n');
    }

    if (otherChanges.length > 0) {
      console.log('┌─────────────────────────────────────────────────────────────────');
      console.log('│ 🔄 OTHER STATUS CHANGES');
      console.log('├─────────────────────────────────────────────────────────────────');
      otherChanges.forEach(c => {
        console.log(
          `│  ${c.emp_name.padEnd(20)} (${c.emp_code})` +
          ` | ${c.date.padEnd(12)}` +
          ` | IN: ${c.in_time.padEnd(10)} OUT: ${c.out_time.padEnd(10)}` +
          ` | ${c.old_status} → ${c.new_status}`
        );
      });
      console.log(`│  Total: ${otherChanges.length}`);
      console.log('└─────────────────────────────────────────────────────────────────\n');
    }

    // ════════════════════════════════════════
    // SAFETY CHECK
    // ════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔒 SAFETY CONFIRMATION');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('   Kya change NAHI hoga:');
    console.log('   ✅ in_time / out_time — SAFE');
    console.log('   ✅ Selfie photos — SAFE');
    console.log('   ✅ GPS coordinates — SAFE');
    console.log('   ✅ Site name — SAFE');
    console.log('   ✅ Confidence score — SAFE');
    console.log('   ✅ Site workers ke records — UNTOUCHED');
    console.log('');
    console.log('   Kya change HOGA (sirf office workers):');
    console.log('   🔄 is_late (true/false)');
    console.log('   🔄 is_half_day (true/false)');
    console.log('   🔄 daily_status (present/late/half-day)');
    console.log('   🔄 late_reasons (array)\n');

    // ════════════════════════════════════════
    // APPLY
    // ════════════════════════════════════════
    if (isDryRun) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔍 DRY RUN COMPLETE — Database mein KUCH NAHI badla');
      console.log('');
      console.log('   Preview dekh liya? Sab sahi hai? To run karo:');
      console.log('   node scripts/fixAugustLate.js --apply');
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('⚡ Applying changes to database...\n');

      let applied = 0;
      let failed = 0;

      for (const change of changes) {
        try {
          const result = await Attendance.updateOne(
            { _id: change.id },
            {
              $set: {
                is_late: change.new_late,
                is_half_day: change.new_half_day,
                daily_status: change.new_status,
                late_reasons: change.new_reasons,
              },
            }
          );

          if (result.modifiedCount === 1) {
            applied++;
          } else {
            console.log(`⚠️  No change for ${change.emp_name} ${change.date} (already updated?)`);
          }
        } catch (err) {
          failed++;
          console.error(`❌ FAILED: ${change.emp_name} ${change.date}: ${err.message}`);
        }
      }

      console.log('═══════════════════════════════════════════════════════════');
      console.log(`✅ Successfully applied: ${applied}`);
      if (failed > 0) console.log(`❌ Failed: ${failed}`);
      console.log(`🚧 Site workers untouched: ${stats.siteWorkerSkipped} records`);
      console.log('═══════════════════════════════════════════════════════════\n');

      console.log('🎉 DONE! August 2025 attendance fixed.\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();
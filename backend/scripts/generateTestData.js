// backend/scripts/generateTestData.js

require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Company = require('../models/Company');

const COMPANY_CODE = process.argv[2] || 'VRN';
const MONTH = 5;
const YEAR = 2026;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const IN_TIMES = ['08:30 AM','08:45 AM','09:00 AM','09:10 AM','09:15 AM','09:20 AM','09:30 AM','09:45 AM','10:00 AM'];
const OUT_TIMES = ['05:30 PM','05:45 PM','06:00 PM','06:10 PM','06:15 PM','06:30 PM','06:45 PM','07:00 PM','07:30 PM'];
const LEAVE_TYPES = ['casual', 'sick', 'emergency'];
const LEAVE_REASONS = ['Personal work','Not feeling well','Family function','Doctor appointment','Out of station','Emergency at home','Fever','Wedding','Exam','Hospital'];

const getDayName = (d, m, y) => {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(y, m-1, d).getDay()];
};

const getProfile = (idx, total) => {
  if (idx < total * 0.15) return { absent: 0, leave: 0, sunday: false, missedOut: 0, label: '🟢 Perfect' };
  if (idx < total * 0.30) return { absent: randomInt(0,1), leave: randomInt(1,2), sunday: false, missedOut: 0, label: '🟢 Good' };
  if (idx < total * 0.50) return { absent: randomInt(1,3), leave: randomInt(2,3), sunday: false, missedOut: randomInt(1,2), label: '🟡 Average' };
  if (idx < total * 0.70) return { absent: randomInt(3,5), leave: randomInt(3,5), sunday: false, missedOut: 0, label: '🟠 Below Avg' };
  if (idx < total * 0.80) return { absent: randomInt(0,2), leave: randomInt(0,2), sunday: true, missedOut: 0, label: '☀️ Sunday' };
  if (idx < total * 0.90) return { absent: randomInt(1,2), leave: randomInt(1,2), sunday: false, missedOut: randomInt(2,4), label: '⚠️ MissedOUT' };
  return { absent: randomInt(5,8), leave: randomInt(4,6), sunday: false, missedOut: 0, label: '🔴 Poor' };
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const company = await Company.findOne({ code: COMPANY_CODE });
    if (!company) { console.error('❌ Company not found'); process.exit(1); }

    const employees = await Employee.find({
      company_id: company._id, status: 'approved', role: 'employee'
    }).sort({ name: 1 });

    const daysInMonth = new Date(YEAR, MONTH, 0).getDate();

    console.log(`📊 ${company.name} | ${employees.length} employees | May ${YEAR} (${daysInMonth} days)\n`);
    console.log(`${'Name'.padEnd(25)} | ${'Type'.padEnd(15)} | ${'Pres'.padEnd(4)} | ${'Abs'.padEnd(3)} | ${'Lv'.padEnd(3)} | ${'Miss'.padEnd(4)} | Sun`);
    console.log('─'.repeat(85));

    let tAtt = 0, tLv = 0, tMiss = 0, tSun = 0;

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const p = getProfile(i, employees.length);

      // Build ALL working dates for FULL month (1 to 31)
      const workDates = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dn = getDayName(d, MONTH, YEAR);
        if (dn === 'Sunday' && !p.sunday) continue;
        workDates.push(d);
      }

      // Pick absent dates
      const absentSet = new Set();
      let att = 0;
      while (absentSet.size < p.absent && att < 100) {
        absentSet.add(workDates[randomInt(0, workDates.length - 1)]);
        att++;
      }

      // Pick leave dates (not on absent)
      const leaveSet = new Set();
      att = 0;
      while (leaveSet.size < p.leave && att < 100) {
        const d = workDates[randomInt(0, workDates.length - 1)];
        if (!absentSet.has(d)) leaveSet.add(d);
        att++;
      }

      // Pick missed OUT dates
      const presentDates = workDates.filter(d => !absentSet.has(d) && !leaveSet.has(d));
      const missSet = new Set();
      att = 0;
      while (missSet.size < p.missedOut && att < 100 && presentDates.length > 0) {
        missSet.add(presentDates[randomInt(0, presentDates.length - 1)]);
        att++;
      }

      // CREATE ATTENDANCE — Full month
      let empPres = 0, empSun = 0;
      for (const d of presentDates) {
        const dateStr = `${d}/${MONTH}/${YEAR}`;
        const dn = getDayName(d, MONTH, YEAR);

        const existing = await Attendance.findOne({ emp_id: emp._id, date: dateStr });
        if (existing) continue;

        const outTime = missSet.has(d) ? null : randomItem(OUT_TIMES);

        await Attendance.create({
          emp_id: emp._id,
          emp_code: emp.emp_code,
          name: emp.name,
          company_id: emp.company_id,
          department: emp.department,
          date: dateStr,
          in_time: randomItem(IN_TIMES),
          out_time: outTime,
          in_latitude: 0, in_longitude: 0,
          in_location_status: 'test-data',
          in_site: 'Office', in_distance: 0,
          out_latitude: 0, out_longitude: 0,
          out_location_status: outTime ? 'test-data' : null,
          out_site: outTime ? 'Office' : null,
          out_distance: 0,
          status: 'present',
          confidence: 100,
        });

        empPres++;
        tAtt++;
        if (dn === 'Sunday') { empSun++; tSun++; }
        if (!outTime) tMiss++;
      }

      // CREATE LEAVES
      let empLv = 0;
      for (const d of leaveSet) {
        const dateStr = `${d}/${MONTH}/${YEAR}`;
        const existing = await Leave.findOne({ emp_id: emp._id, from_date: dateStr, to_date: dateStr });
        if (existing) continue;

        const isHalf = Math.random() < 0.15;

        await Leave.create({
          emp_id: emp._id,
          emp_code: emp.emp_code,
          name: emp.name,
          company_id: emp.company_id,
          department: emp.department,
          from_date: dateStr,
          to_date: dateStr,
          leave_days: isHalf ? 0.5 : 1,
          applied_days: isHalf ? 0.5 : 1,
          approved_days: isHalf ? 0.5 : 1,
          paid_days: isHalf ? 0.5 : 1,
          unpaid_days: 0,
          leave_type: randomItem(LEAVE_TYPES),
          shift: 'General',
          is_half_day: isHalf,
          half_day_period: isHalf ? (Math.random() < 0.5 ? 'first' : 'second') : '',
          reason: randomItem(LEAVE_REASONS),
          status: 'approved',
          manager_name: emp.leave_approval_manager || 'Manager',
          manager_remark: 'Approved (test)',
          admin_remark: 'Test data',
          manager_action_date: new Date(),
        });

        empLv++;
        tLv++;
      }

      const sunLabel = p.sunday ? `Yes(${empSun})` : 'No';
      console.log(`${emp.name.padEnd(25)} | ${p.label.padEnd(15)} | ${String(empPres).padEnd(4)} | ${String(absentSet.size).padEnd(3)} | ${String(empLv).padEnd(3)} | ${String(missSet.size).padEnd(4)} | ${sunLabel}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`✅ Attendance: ${tAtt} | Leaves: ${tLv} | MissedOUT: ${tMiss} | SundayWork: ${tSun}`);
    console.log('═══════════════════════════════════════');
    console.log('\n📋 NEXT:');
    console.log('1. Monthly Settings → VRN → May 2026 → 208h → Save');
    console.log('2. Auto-checkout: POST /api/attendance/auto-checkout');
    console.log('3. Payroll → VRN → May 2026 → Generate\n');

    process.exit(0);
  } catch (err) {
    console.error('❌', err);
    process.exit(1);
  }
};

run();
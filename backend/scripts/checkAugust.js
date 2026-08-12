// scripts/checkAugust.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Total attendance records
    const total = await Attendance.countDocuments();
    console.log(`📊 Total attendance records in DB: ${total}`);

    // August records
    const augustDates = [];
    for (let d = 1; d <= 31; d++) {
      augustDates.push(`${d}/8/2025`);
    }

    const augustRecords = await Attendance.find({
      date: { $in: augustDates }
    }).limit(5);

    console.log(`📅 August 2025 records: ${await Attendance.countDocuments({ date: { $in: augustDates } })}`);

    // Sample dates in DB
    const sampleDates = await Attendance.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name date in_time daily_status is_late');

    console.log('\n📋 Last 5 records in DB:');
    sampleDates.forEach(r => {
      console.log(`   ${r.name} | date: "${r.date}" | ${r.in_time} | ${r.daily_status} | late: ${r.is_late}`);
    });

    // Check date format
    console.log('\n🔍 Date format check - unique dates sample:');
    const uniqueDates = await Attendance.distinct('date');
    uniqueDates.slice(0, 10).forEach(d => console.log(`   "${d}"`));

    process.exit(0);
  } catch (err) {
    console.error('❌', err);
    process.exit(1);
  }
};

run();
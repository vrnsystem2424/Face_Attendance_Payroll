// scripts/getRCCInfo.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Company = require('../models/Company');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Site = require('../models/Site');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  // All Companies
  const companies = await Company.find();
  console.log('📋 All Companies:');
  companies.forEach(c => {
    console.log(`   ${c.name} | Code: ${c.code} | ID: ${c._id}`);
  });

  // Existing Sites
  console.log('\n📍 Existing Sites:');
  const sites = await Site.find().populate('company_id', 'name code');
  if (sites.length === 0) {
    console.log('   Koi site configure nahi hai!');
  } else {
    sites.forEach(s => {
      console.log(`   ${s.site_name} | ${s.company_id?.name} | Lat: ${s.latitude} | Lng: ${s.longitude} | Radius: ${s.radius}m`);
    });
  }

  // RCC Site Workers GPS
  console.log('\n🗺️  RCC Site Workers - Unique GPS Locations:');
  const rccSiteWorkers = await Employee.find({
    emp_code: { $regex: '^RCC', $options: 'i' },
    worker_type: 'site',
    status: 'approved',
  }).select('_id name emp_code');

  console.log(`   RCC Site Workers: ${rccSiteWorkers.length}`);

  const empIds = rccSiteWorkers.map(e => e._id);

  // August 2026 attendance
  const augustDates = [];
  for (let d = 1; d <= 31; d++) {
    augustDates.push(`${d}/8/2026`);
  }

  const attendances = await Attendance.find({
    emp_id: { $in: empIds },
    date: { $in: augustDates },
    in_latitude: { $exists: true, $ne: 0 },
    in_longitude: { $exists: true, $ne: 0 },
  }).select('name emp_code date in_time in_latitude in_longitude in_site in_location_status');

  console.log(`\n   Total August records: ${attendances.length}\n`);

  // Group by approximate location
  const locations = {};
  attendances.forEach(a => {
    // Round to 3 decimal places to group nearby locations
    const lat = Math.round(a.in_latitude * 1000) / 1000;
    const lng = Math.round(a.in_longitude * 1000) / 1000;
    const key = `${lat},${lng}`;

    if (!locations[key]) {
      locations[key] = {
        lat: a.in_latitude,
        lng: a.in_longitude,
        count: 0,
        employees: new Set(),
        site_name: a.in_site,
        status: a.in_location_status,
      };
    }
    locations[key].count++;
    locations[key].employees.add(a.emp_code);
  });

  console.log('📍 Unique Locations Found (sorted by frequency):');
  console.log('─────────────────────────────────────────────────────────');

  Object.entries(locations)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([key, loc]) => {
      console.log(`\n   📌 Lat: ${loc.lat}, Lng: ${loc.lng}`);
      console.log(`      Check-ins: ${loc.count}`);
      console.log(`      Employees: ${[...loc.employees].join(', ')}`);
      console.log(`      Current site name: ${loc.site_name}`);
      console.log(`      GPS Status: ${loc.status}`);
      console.log(`      Maps: https://www.google.com/maps?q=${loc.lat},${loc.lng}`);
    });

  process.exit(0);
};

run();
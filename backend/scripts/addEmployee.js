// backend/scripts/updateEmployeeDept.js
// 🎯 Employee ka department update karo

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Employee = require('../models/Employee');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI;

const EMP_CODE = 'RCC-RA2126';
const NEW_DEPARTMENT = 'RCC';

const update = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    const emp = await Employee.findOne({ emp_code: EMP_CODE });
    if (!emp) {
      console.log(`❌ Employee ${EMP_CODE} not found`);
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`👤 ${emp.name} (${emp.emp_code})`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📌 BEFORE:');
    console.log(`   Department: ${emp.department}`);
    console.log(`   Designation: ${emp.designation}\n`);

    // Update
    emp.department = NEW_DEPARTMENT;
    await emp.save();

    console.log('✅ AFTER:');
    console.log(`   Department: ${emp.department} ✅`);
    console.log(`   Designation: ${emp.designation}\n`);

    console.log('🎉 Updated successfully!\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

update();
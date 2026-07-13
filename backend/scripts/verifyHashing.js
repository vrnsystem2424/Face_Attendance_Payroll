require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const email = 'followup@rcc.com';
    const testPassword = 'test123';

    // Get user
    const user = await Employee.findOne({ email });
    console.log(`👤 User: ${user.name}`);
    console.log(`   Current Hash: ${user.password}\n`);

    // Method 1: Direct hash
    console.log('═══════════════════════════════════════');
    console.log('METHOD 1: Direct Hash + Save');
    console.log('═══════════════════════════════════════');
    const hash1 = await bcrypt.hash(testPassword, 10);
    console.log(`   Generated hash: ${hash1.substring(0, 40)}...`);

    user.password = hash1;
    await user.save();

    const afterSave = await Employee.findOne({ email });
    console.log(`   Stored hash:    ${afterSave.password.substring(0, 40)}...`);
    console.log(`   Match?          ${hash1 === afterSave.password ? '✅ SAME' : '❌ DIFFERENT (BUG!)'}`);

    // Try to compare
    const compare1 = await bcrypt.compare(testPassword, afterSave.password);
    console.log(`   Compare works?  ${compare1 ? '✅ YES' : '❌ NO'}\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

verify();
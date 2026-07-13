require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const email = 'followup@rcc.com';
    
    // Get user
    const user = await Employee.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('═══════════════════════════════════════');
    console.log('📋 USER DETAILS');
    console.log('═══════════════════════════════════════');
    console.log(`Name:              ${user.name}`);
    console.log(`Email:             ${user.email}`);
    console.log(`Role:              ${user.role}`);
    console.log(`Password Version:  ${user.passwordVersion}`);
    console.log(`Changed At:        ${user.passwordChangedAt}`);
    console.log(`Hash:              ${user.password.substring(0, 40)}...`);
    console.log('');

    // Test different passwords
    const passwords = [
      'Admin@123',       // Old password
      'NewPass@123',     // Test 1
      'TestPass@456',    // Test 2
      // Add jo password aap use kar rahe ho
    ];

    console.log('═══════════════════════════════════════');
    console.log('🔍 PASSWORD TESTS');
    console.log('═══════════════════════════════════════');
    
    for (const pwd of passwords) {
      const match = await bcrypt.compare(pwd, user.password);
      console.log(`   "${pwd}" → ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
    }

    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

check();
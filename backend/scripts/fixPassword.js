require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

const fix = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // 🎯 YAHAN CHANGE KARO
    const email = 'followup@rcc.com';
    const newPassword = 'Admin@123';  // Naya password
    // ═══════════════════════════════

    const user = await Employee.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`👤 Fixing: ${user.name} (${user.email})`);

    // Hash password ONCE
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update using findByIdAndUpdate
    const updated = await Employee.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
        passwordVersion: (user.passwordVersion || 1) + 1,
        passwordChangedAt: new Date(),
      },
      { new: true }
    );

    // Verify
    const testMatch = await bcrypt.compare(newPassword, updated.password);
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ RESULT');
    console.log('═══════════════════════════════════════');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`Version:  ${updated.passwordVersion}`);
    console.log(`Works?    ${testMatch ? '✅ YES' : '❌ NO'}`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

fix();
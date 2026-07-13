require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // 🎯 Yahan wo email daalo jiska password change kiya tha
    const email = 'followup@rcc.com';
    const oldPassword = 'PURANA_PASSWORD_YAHAN';  // Purana password
    const newPassword = 'NAYA_PASSWORD_YAHAN';    // Naya jo set kiya

    const user = await Employee.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`👤 User: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password Version: ${user.passwordVersion}`);
    console.log(`   Password Changed At: ${user.passwordChangedAt}`);
    console.log(`   Password Hash: ${user.password.substring(0, 30)}...\n`);

    // Test old password
    const oldMatch = await bcrypt.compare(oldPassword, user.password);
    console.log(`Old password match: ${oldMatch ? '✅ YES (BUG!)' : '❌ NO (Correct)'}`);

    // Test new password
    const newMatch = await bcrypt.compare(newPassword, user.password);
    console.log(`New password match: ${newMatch ? '✅ YES (Correct)' : '❌ NO (BUG!)'}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

check();
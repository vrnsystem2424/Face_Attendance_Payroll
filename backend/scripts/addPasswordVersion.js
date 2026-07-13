require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Add passwordVersion to all existing users
    const result = await Employee.updateMany(
      { passwordVersion: { $exists: false } },
      { 
        $set: { 
          passwordVersion: 1,
          passwordChangedAt: new Date(),
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with passwordVersion field`);
    console.log('   All existing users now have passwordVersion: 1\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

migrate();
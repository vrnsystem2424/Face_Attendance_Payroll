// backend/scripts/fixEmployeeCompany.js

require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Company = require('../models/Company');

const fix = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get correct company IDs
    const rcc = await Company.findOne({ code: 'RCC' });
    const vrn = await Company.findOne({ code: 'VRN' });
    const dim = await Company.findOne({ code: 'DIM' });

    console.log('📦 Correct Company IDs:');
    console.log(`   RCC: ${rcc._id}`);
    console.log(`   VRN: ${vrn._id}`);
    console.log(`   DIM: ${dim._id}\n`);

    // Fix RCC employees (department = "RCC")
    const rccResult = await Employee.updateMany(
      { department: 'RCC' },
      { $set: { company_id: rcc._id } }
    );
    console.log(`✅ RCC employees fixed: ${rccResult.modifiedCount}`);

    // Fix VRN employees (department = "VRN INC")
    const vrnResult = await Employee.updateMany(
      { department: 'VRN INC' },
      { $set: { company_id: vrn._id } }
    );
    console.log(`✅ VRN employees fixed: ${vrnResult.modifiedCount}`);

    // Fix DIM employees (department = "DIMENSIONS")
    const dimResult = await Employee.updateMany(
      { department: 'DIMENSIONS' },
      { $set: { company_id: dim._id } }
    );
    console.log(`✅ DIM employees fixed: ${dimResult.modifiedCount}`);

    // Fix Management (admins)
    const mgmtResult = await Employee.updateMany(
      { department: 'Management', role: 'admin' },
      { $set: {} }  // Already fixed by fixAdmins
    );

    // Verify
    console.log('\n═══════════════════════════════════════');
    console.log('  📊 VERIFICATION');
    console.log('═══════════════════════════════════════');

    const rccCount = await Employee.countDocuments({ company_id: rcc._id });
    const vrnCount = await Employee.countDocuments({ company_id: vrn._id });
    const dimCount = await Employee.countDocuments({ company_id: dim._id });

    console.log(`   RCC: ${rccCount} employees`);
    console.log(`   VRN: ${vrnCount} employees`);
    console.log(`   DIM: ${dimCount} employees`);
    console.log(`   Total: ${rccCount + vrnCount + dimCount}`);
    console.log('═══════════════════════════════════════\n');

    console.log('✅ ALL FIXED! Admin login karke check karo.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

fix();
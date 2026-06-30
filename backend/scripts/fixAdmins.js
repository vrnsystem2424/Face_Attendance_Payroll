// backend/scripts/fixAdmins.js

require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Company = require('../models/Company');

const fixAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const companies = await Company.find({});
    console.log('📦 Companies:');
    companies.forEach(c => console.log(`   ${c.name} | ${c.code} | ${c._id}`));

    const admins = await Employee.find({ role: 'admin' });
    console.log(`\n🔑 Admins found: ${admins.length}\n`);

    for (const admin of admins) {
      // Find matching company by admin name
      let matchedCompany = null;

      if (admin.name.toLowerCase().includes('rcc')) {
        matchedCompany = companies.find(c => c.code === 'RCC');
      } else if (admin.name.toLowerCase().includes('vrn')) {
        matchedCompany = companies.find(c => c.code === 'VRN');
      } else if (admin.name.toLowerCase().includes('dimension')) {
        matchedCompany = companies.find(c => c.code === 'DIM');
      }

      if (matchedCompany) {
        const oldId = admin.company_id?.toString();
        const newId = matchedCompany._id.toString();

        if (oldId === newId) {
          console.log(`✅ ${admin.name} → Already correct (${matchedCompany.name})`);
        } else {
          admin.company_id = matchedCompany._id;
          await admin.save();
          console.log(`🔧 ${admin.name} → Fixed! ${oldId} → ${newId} (${matchedCompany.name})`);
        }
      } else {
        console.log(`⚠️  ${admin.name} → No matching company found`);
      }
    }

    // Also fix super admin (if needed)
    const superAdmin = await Employee.findOne({ role: 'super_admin' });
    if (superAdmin) {
      console.log(`\n✅ Super Admin: ${superAdmin.name} (${superAdmin.email})`);
    } else {
      console.log('\n⚠️  No Super Admin found!');
    }

    // Verify
    console.log('\n═══════════════════════════════════════');
    console.log('  🔍 VERIFICATION');
    console.log('═══════════════════════════════════════');

    const updatedAdmins = await Employee.find({ role: 'admin' });
    for (const admin of updatedAdmins) {
      const company = await Company.findById(admin.company_id);
      const empCount = await Employee.countDocuments({
        company_id: admin.company_id,
        role: { $ne: 'super_admin' },
      });
      console.log(`   ${admin.name}`);
      console.log(`   → Company: ${company?.name || 'NOT FOUND'}`);
      console.log(`   → Employees visible: ${empCount}`);
      console.log('   ---');
    }

    console.log('\n✅ DONE! Admin login karke check karo.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

fixAdmins();
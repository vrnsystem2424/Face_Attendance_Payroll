// fixLeavesCompany.js — One-time fix script

require('dotenv').config();
const mongoose = require('mongoose');
const Leave = require('./models/Leave');
const Employee = require('./models/Employee');

const fixLeaves = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Find leaves without company_id
    const leaves = await Leave.find({});
    console.log(`📊 Total leaves: ${leaves.length}`);

    let fixed = 0;
    let skipped = 0;

    for (const leave of leaves) {
      // Skip if already has company_id
      if (leave.company_id) {
        skipped++;
        continue;
      }

      // Get employee
      const employee = await Employee.findById(leave.emp_id);
      if (employee && employee.company_id) {
        leave.company_id = employee.company_id;
        await leave.save();
        fixed++;
        console.log(`✅ Fixed: ${leave.name} → ${employee.company_id}`);
      } else {
        console.log(`⚠️  Skipped: ${leave.name} (no employee/company found)`);
      }
    }

    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║  📊 RESULTS                            ║`);
    console.log(`╠════════════════════════════════════════╣`);
    console.log(`║  ✅ Fixed:    ${fixed.toString().padEnd(25)}║`);
    console.log(`║  ⏭️  Already OK: ${skipped.toString().padEnd(22)}║`);
    console.log(`╚════════════════════════════════════════╝`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

fixLeaves();
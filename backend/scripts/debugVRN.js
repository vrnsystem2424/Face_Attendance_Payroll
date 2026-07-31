require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Company = require('../models/Company');

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Find VRN company
    const vrn = await Company.findOne({ code: 'VRN' });
    if (!vrn) {
      console.log('❌ VRN not found');
      process.exit(1);
    }

    // Get all VRN employees
    const employees = await Employee.find({ 
      company_id: vrn._id,
      status: 'approved',
    });

    console.log(`🏢 VRN INC - Employees: ${employees.length}\n`);

    // Check first employee's Sunday attendance
    for (const emp of employees.slice(0, 3)) {
      console.log(`\n👤 ${emp.name} (${emp.emp_code})`);
      
      const july2026 = await Attendance.find({
        emp_id: emp._id,
        date: { $regex: '/7/2026$' }
      });

      const sundayCount = july2026.filter(a => {
        if (!a.in_time) return false;
        const [d, m, y] = a.date.split('/').map(Number);
        return new Date(y, m - 1, d).getDay() === 0;
      }).length;

      console.log(`   Total July attendance: ${july2026.length}`);
      console.log(`   Sunday attendance: ${sundayCount}`);
      console.log(`   Is Site Worker? ${sundayCount >= 2 ? 'YES 🚧' : 'NO 🏢'}`);
      
      if (sundayCount > 0) {
        console.log(`   Sunday dates worked:`);
        july2026.forEach(a => {
          if (!a.in_time) return;
          const [d, m, y] = a.date.split('/').map(Number);
          if (new Date(y, m - 1, d).getDay() === 0) {
            console.log(`     - ${a.date}`);
          }
        });
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('📅 July 2026 Sundays: 5, 12, 19, 26 (4 Sundays)');
    console.log('   Working Days should be: 31 - 4 = 27');
    console.log('═══════════════════════════════════════');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

debug();
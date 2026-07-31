require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // 🎯 Find the admin (Lt Col Mayank Sharma)
    const admin = await Employee.findOne({ 
      role: 'admin',
      assigned_manager: { $regex: 'Mayank', $options: 'i' }
    });

    if (!admin) {
      console.log('❌ Admin with Mayank not found');
      
      // Show all leave admins
      console.log('\n📋 All Leave Admins:');
      const allAdmins = await Employee.find({ 
        role: 'admin',
        assigned_manager: { $ne: '' }
      });
      allAdmins.forEach(a => {
        console.log(`   - ${a.name} → assigned_manager: "${a.assigned_manager}"`);
      });
      
      process.exit(1);
    }

    console.log('👤 ADMIN DETAILS:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Company: ${admin.company_id}`);
    console.log(`   assigned_manager: "${admin.assigned_manager}"`);
    console.log(`   Length: ${admin.assigned_manager.length} chars`);
    console.log('');

    // Find all employees with this manager
    console.log('🔍 Searching employees with manager...\n');

    // Exact match
    const exact = await Employee.find({
      leave_approval_manager: admin.assigned_manager
    });
    console.log(`Exact match: ${exact.length}`);

    // Case insensitive
    const caseInsensitive = await Employee.find({
      leave_approval_manager: { 
        $regex: new RegExp(`^${admin.assigned_manager}$`, 'i') 
      }
    });
    console.log(`Case insensitive match: ${caseInsensitive.length}`);

    // Contains
    const contains = await Employee.find({
      leave_approval_manager: { 
        $regex: 'Mayank', 
        $options: 'i' 
      }
    });
    console.log(`Contains "Mayank": ${contains.length}\n`);

    if (contains.length > 0) {
      console.log('📋 Employees with Mayank in manager:');
      contains.forEach(e => {
        console.log(`   - ${e.name} (${e.emp_code})`);
        console.log(`     leave_approval_manager: "${e.leave_approval_manager}"`);
        console.log(`     Length: ${e.leave_approval_manager.length} chars`);
        console.log('');
      });

      // Check leaves
      const empIds = contains.map(e => e._id);
      const leaves = await Leave.find({ emp_id: { $in: empIds } });
      console.log(`📋 Total leaves: ${leaves.length}`);
      const pendingLeaves = leaves.filter(l => l.status === 'pending');
      console.log(`📋 Pending leaves: ${pendingLeaves.length}`);

      // Check attendance
      const attendance = await Attendance.find({ 
        emp_id: { $in: empIds },
        date: { $regex: '2026' }
      });
      console.log(`📅 Attendance records: ${attendance.length}`);
    }

    // Show all unique managers
    console.log('\n📋 All unique managers in DB:');
    const allManagers = await Employee.distinct('leave_approval_manager');
    allManagers.filter(m => m && m.trim()).forEach(m => {
      console.log(`   - "${m}" (${m.length} chars)`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

debug();
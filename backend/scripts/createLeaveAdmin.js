require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const Company = require('../models/Company');

const createLeaveAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // ═══════════════════════════════════════
    // 🎯 CONFIGURATION - Yahan change karo
    // ═══════════════════════════════════════
    const adminDetails = {
      name: 'Lt Col Mayank Sharma (Retd)',
      email: 'rccinfra2024@gmail.com',
      phone: '9238487651',
      password: 'Mayank@123',
      company_code: 'RCC',   // 🎯 RCC, VRN, DIM
      assigned_manager: 'Lt Col Mayank Sharma (Retd)',   // 🎯 Exact manager name
    };
    // ═══════════════════════════════════════

    // Find company
    const company = await Company.findOne({ code: adminDetails.company_code });
    if (!company) {
      console.log(`❌ Company not found: ${adminDetails.company_code}`);
      const companies = await Company.find();
      console.log('\n📋 Available companies:');
      companies.forEach(c => console.log(`   - ${c.code}: ${c.name}`));
      process.exit(1);
    }

    console.log(`🏢 Company: ${company.name} (${company.code})`);

    // Check if admin already exists
    const existing = await Employee.findOne({ 
      email: adminDetails.email.toLowerCase() 
    });

    if (existing) {
      console.log(`\n⚠️  Admin already exists: ${existing.email}`);
      console.log(`   Updating assigned_manager to: ${adminDetails.assigned_manager}\n`);
      
      existing.assigned_manager = adminDetails.assigned_manager;
      existing.admin_type = '';
      await existing.save();
      
      console.log(`✅ Updated successfully!`);
      console.log(`   Now managing: ${adminDetails.assigned_manager}`);
      process.exit(0);
    }

    // Check managed employees
    const managedEmployees = await Employee.find({
      company_id: company._id,
      leave_approval_manager: { 
        $regex: new RegExp(`^${adminDetails.assigned_manager}$`, 'i') 
      },
    });

    console.log(`\n👥 Employees managed by "${adminDetails.assigned_manager}": ${managedEmployees.length}`);
    
    if (managedEmployees.length === 0) {
      console.log(`   ⚠️  WARNING: No employees have this manager set!`);
    } else {
      console.log('   List:');
      managedEmployees.slice(0, 5).forEach(e => {
        console.log(`     - ${e.name} (${e.emp_code})`);
      });
      if (managedEmployees.length > 5) {
        console.log(`     ... and ${managedEmployees.length - 5} more`);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminDetails.password, 10);
    const emp_code = `ADM-${company.code}-${Date.now().toString().slice(-4)}`;

    // Create admin (Same as Ravindra style)
    const admin = await Employee.create({
      name: adminDetails.name,
      emp_code,
      phone: adminDetails.phone,
      email: adminDetails.email.toLowerCase(),
      password: hashedPassword,
      company_id: company._id,
      department: 'Management',
      designation: `Leave Admin (${adminDetails.assigned_manager})`,
      face_registered: true,
      status: 'approved',
      role: 'admin',
      assigned_manager: adminDetails.assigned_manager,   // 🎯 Key field
      admin_type: '',   // Leave Admin (not followup)
      passwordVersion: 1,
      passwordChangedAt: new Date(),
    });

    console.log('\n═══════════════════════════════════════');
    console.log('✅ LEAVE ADMIN CREATED');
    console.log('═══════════════════════════════════════');
    console.log(`Name:              ${admin.name}`);
    console.log(`Email:             ${admin.email}`);
    console.log(`Password:          ${adminDetails.password}`);
    console.log(`Emp Code:          ${admin.emp_code}`);
    console.log(`Company:           ${company.name}`);
    console.log(`Managing:          ${admin.assigned_manager}`);
    console.log(`Managed Employees: ${managedEmployees.length}`);
    console.log('═══════════════════════════════════════\n');

    console.log('📌 Login Details:');
    console.log(`   URL:      http://localhost:5173/admin/login`);
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Password: ${adminDetails.password}\n`);

    console.log('🎯 Ye admin login karega to sirf');
    console.log(`   "${adminDetails.assigned_manager}" ke employees ke leaves dikhenge.\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

createLeaveAdmin();
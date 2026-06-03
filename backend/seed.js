// seed.js — Initial data setup

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('./models/Company');
const Employee = require('./models/Employee');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // ── 1. Clear old data ──
    await Company.deleteMany({});
    await Employee.deleteMany({ role: { $in: ['super_admin', 'admin'] } });
    console.log('🗑️  Old companies & admins cleared');

    // ── 2. Create 3 Companies ──
    const companies = await Company.insertMany([
      { name: 'RCC Construction', code: 'RCC', address: 'Indore, MP' },
      { name: 'Dimensions', code: 'DIM', address: 'Indore, MP' },
      { name: 'VRN INC', code: 'VRN', address: 'Indore, MP' },
    ]);
    console.log(`✅ ${companies.length} Companies created`);

    // ── 3. Create Super Admin ──
    const superAdminPwd = await bcrypt.hash('superadmin123', 10);
    await Employee.create({
      name: 'Super Admin',
      email: 'superadmin@system.com',
      phone: '9999999999',
      password: superAdminPwd,
      emp_code: 'SUPER-001',
      department: 'System',
      designation: 'Super Administrator',
      role: 'super_admin',
      status: 'approved',
      face_registered: true,
    });
    console.log('✅ Super Admin created');

    // ── 4. Create One Admin Per Company ──
    for (const company of companies) {
      const adminPwd = await bcrypt.hash('admin123', 10);
      await Employee.create({
        name: `${company.name} Admin`,
        email: `admin@${company.code.toLowerCase()}.com`,
        phone: `888888${Math.floor(1000 + Math.random() * 9000)}`,
        password: adminPwd,
        emp_code: `ADM-${company.code}-001`,
        company_id: company._id,
        department: 'Management',
        designation: 'Administrator',
        role: 'admin',
        status: 'approved',
        face_registered: true,
      });
      console.log(`✅ Admin for ${company.name}`);
    }

    console.log(`
╔════════════════════════════════════════════════╗
║         🎉 SEEDING COMPLETE!                   ║
╠════════════════════════════════════════════════╣
║                                                ║
║  SUPER ADMIN:                                  ║
║    Email:    superadmin@system.com             ║
║    Password: superadmin123                     ║
║                                                ║
║  RCC ADMIN:                                    ║
║    Email:    admin@rcc.com                     ║
║    Password: admin123                          ║
║                                                ║
║  DIM ADMIN:                                    ║
║    Email:    admin@dim.com                     ║
║    Password: admin123                          ║
║                                                ║
║  VRN ADMIN:                                    ║
║    Email:    admin@vrn.com                     ║
║    Password: admin123                          ║
║                                                ║
╚════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
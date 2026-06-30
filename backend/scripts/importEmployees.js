// backend/scripts/importEmployees.js

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');

const Employee = require('../models/Employee');
const Company = require('../models/Company');

const CSV_FILE = process.argv[2] || 'all_employees.csv';
const CSV_FILE_PATH = path.join(__dirname, '../data/', CSV_FILE);

// Company mapping
const COMPANY_MAPPING = {
  'RCC': 'RCC',
  'VRN INC': 'VRN',
  'VRN': 'VRN',
  'DIMENSIONS': 'DIM',
  'DIM': 'DIM',
};

// 🎯 Password: FirstName#Last4Digits
const generatePassword = (name, phone) => {
  const firstName = name.split(' ')[0];
  const last4 = phone.slice(-4);
  return `${firstName}#${last4}`;
};

const importEmployees = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const allCompanies = await Company.find({});
    const companyMap = {};
    allCompanies.forEach(c => { companyMap[c.code.toUpperCase()] = c; });

    console.log('📦 Companies:');
    allCompanies.forEach(c => console.log(`   - ${c.code}: ${c.name}`));

    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`\n❌ CSV not found: ${CSV_FILE_PATH}`);
      process.exit(1);
    }

    console.log(`\n📂 Reading: ${CSV_FILE}\n`);

    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 Total rows: ${rows.length}\n`);
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`${'Name'.padEnd(25)} | ${'Code'.padEnd(7)} | ${'Phone'.padEnd(12)} | ${'Co'.padEnd(4)} | Password`);
    console.log('─'.repeat(75));

    let created = 0, skipped = 0, failed = 0;
    const credentials = { RCC: [], VRN: [], DIM: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row['Name']?.trim();
      const empCode = row['EMP Code']?.trim();
      const phone = row['Mobile No.']?.trim().replace(/\s+/g, '');
      const email = row['Email']?.trim().replace(/\s+/g, '').replace(/\n/g, '') || '';
      const manager = row['Leave Approval Manager']?.trim() || '';
      const department = row['Department']?.trim() || '';
      const designation = row['Designation']?.trim() || 'Employee';

      if (!name || !empCode || !phone || phone.length < 10) {
        skipped++;
        continue;
      }

      const companyCode = COMPANY_MAPPING[department.toUpperCase()];
      if (!companyCode) { failed++; continue; }

      const company = companyMap[companyCode];
      if (!company) { failed++; continue; }

      try {
        const existing = await Employee.findOne({
          $or: [{ emp_code: empCode }, { phone: phone }],
        });
        if (existing) { skipped++; continue; }

        const plainPassword = generatePassword(name, phone);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        await Employee.create({
          name, emp_code: empCode, phone, email,
          password: hashedPassword,
          department, designation: designation || 'Employee',
          leave_approval_manager: manager,
          company_id: company._id,
          monthly_salary: 0,
          status: 'approved',
          face_registered: false,
          role: 'employee',
          face_encoding: [], all_encodings: [],
        });

        console.log(`✅ ${name.padEnd(25)} | ${empCode.padEnd(7)} | ${phone.padEnd(12)} | ${companyCode.padEnd(4)} | ${plainPassword}`);
        credentials[companyCode]?.push({ name, emp_code: empCode, phone, password: plainPassword });
        created++;
      } catch (err) {
        console.log(`❌ ${name}: ${err.message}`);
        failed++;
      }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log(`✅ Created: ${created} | ⏭️ Skipped: ${skipped} | ❌ Failed: ${failed}`);

    // Company-wise count
    Object.entries(credentials).forEach(([code, list]) => {
      if (list.length > 0) console.log(`   📦 ${code}: ${list.length} employees`);
    });

    // Save credentials
    Object.entries(credentials).forEach(([code, list]) => {
      if (list.length === 0) return;

      const filePath = path.join(__dirname, `../data/${code.toLowerCase()}_credentials.txt`);
      let content = `═══════════════════════════════════════════\n`;
      content += `  ${code} LOGIN CREDENTIALS\n`;
      content += `═══════════════════════════════════════════\n\n`;
      content += `${'Name'.padEnd(25)} | ${'Code'.padEnd(7)} | ${'Phone'.padEnd(12)} | Password\n`;
      content += '─'.repeat(60) + '\n';

      list.forEach(c => {
        content += `${c.name.padEnd(25)} | ${c.emp_code.padEnd(7)} | ${c.phone.padEnd(12)} | ${c.password}\n`;
      });

      content += `\nTotal: ${list.length}\nLogin: Phone + Password\n`;
      fs.writeFileSync(filePath, content);
      console.log(`📄 ${code} credentials: data/${code.toLowerCase()}_credentials.txt`);
    });

    console.log('\n✅ ALL DONE!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌', err);
    process.exit(1);
  }
};

importEmployees();
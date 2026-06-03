// backend/scripts/importEmployees.js

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');

const Employee = require('../models/Employee');
const Company = require('../models/Company');

// ════════════════════════════════════════════
// CONFIGURATION — Set CSV file path here
// ════════════════════════════════════════════
const CSV_FILE = 'employees.csv';      // ⚠️ Change for different files
const DEFAULT_PASSWORD = 'vrn@2026';       // ⚠️ Default password
const DEFAULT_SALARY = 0;

const CSV_FILE_PATH = path.join(__dirname, '../data/', CSV_FILE);

// ════════════════════════════════════════════
// SMART COMPANY MAPPING
// CSV "Department" → Real Company in DB
// ════════════════════════════════════════════
const COMPANY_MAPPING = {
  'RCC': 'RCC',           // Department "RCC" → Company code "RCC"
  'VRN INC': 'VRN',       // Department "VRN INC" → Company code "VRN"
  'VRN': 'VRN',
  'DIM': 'DIM',           // Department "DIM" → Company code "DIM"
  'DIMENSIONS': 'DIM',
};

// ════════════════════════════════════════════
// MAIN IMPORT FUNCTION
// ════════════════════════════════════════════
const importEmployees = async () => {
  try {
    // 1. Connect MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // 2. Fetch all companies (cache for fast lookup)
    const allCompanies = await Company.find({});
    const companyMap = {};
    allCompanies.forEach(c => {
      companyMap[c.code.toUpperCase()] = c;
    });

    console.log(`📦 Available Companies in DB:`);
    allCompanies.forEach(c => console.log(`   - ${c.code}: ${c.name}`));
    console.log('');

    // 3. Hash default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log(`🔑 Default password: ${DEFAULT_PASSWORD}\n`);

    // 4. Read CSV
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`);
      console.log(`💡 Place "${CSV_FILE}" in backend/data/ folder`);
      process.exit(1);
    }

    console.log(`📂 Reading: ${CSV_FILE}`);

    const employeesData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => employeesData.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 Total rows: ${employeesData.length}\n`);
    console.log('═══════════════════════════════════════');
    console.log('  IMPORTING EMPLOYEES');
    console.log('═══════════════════════════════════════\n');

    let created = 0;
    let skipped = 0;
    let failed = 0;
    const summary = {};

    for (let i = 0; i < employeesData.length; i++) {
      const row = employeesData[i];

      const employeeData = {
        name: row['Name']?.trim(),
        emp_code: row['EMP Code']?.trim(),
        phone: row['Mobile No.']?.trim().replace(/\s+/g, ''),   // remove spaces
        email: row['Email']?.trim().replace(/\s+/g, '') || '',
        leave_approval_manager: row['Leave Approval Manager']?.trim() || '',
        department: row['Department']?.trim() || '',
        designation: row['Designation']?.trim() || 'Employee',
      };

      // Validation
      if (!employeeData.name || !employeeData.emp_code || !employeeData.phone) {
        console.log(`⚠️  [${i + 1}] SKIPPED: Missing data (${employeeData.name || 'No Name'})`);
        skipped++;
        continue;
      }

      // 🆕 SMART COMPANY DETECTION
      const departmentUpper = employeeData.department.toUpperCase();
      const companyCode = COMPANY_MAPPING[departmentUpper];

      if (!companyCode) {
        console.log(`❌ [${i + 1}] FAILED: ${employeeData.name} — Unknown company "${employeeData.department}"`);
        failed++;
        continue;
      }

      const company = companyMap[companyCode.toUpperCase()];

      if (!company) {
        console.log(`❌ [${i + 1}] FAILED: ${employeeData.name} — Company "${companyCode}" not found in DB`);
        failed++;
        continue;
      }

      try {
        // Check existing
        const existing = await Employee.findOne({
          $or: [
            { emp_code: employeeData.emp_code },
            { phone: employeeData.phone },
          ],
        });

        if (existing) {
          console.log(`⏭️  [${i + 1}] EXISTS: ${employeeData.name} (${employeeData.emp_code})`);
          skipped++;
          continue;
        }

        // Create employee
        const newEmployee = await Employee.create({
          name: employeeData.name,
          emp_code: employeeData.emp_code,
          phone: employeeData.phone,
          email: employeeData.email,
          password: hashedPassword,
          department: employeeData.department,        // Keep original (e.g. "VRN INC")
          designation: employeeData.designation,
          leave_approval_manager: employeeData.leave_approval_manager,
          company_id: company._id,                    // ✅ Auto-mapped
          monthly_salary: DEFAULT_SALARY,
          status: 'approved',
          face_registered: false,
          role: 'employee',
          face_encoding: [],
          all_encodings: [],
        });

        console.log(`✅ [${i + 1}] CREATED: ${newEmployee.name} (${newEmployee.emp_code}) → ${company.name}`);
        created++;

        // Track per-company
        summary[company.code] = (summary[company.code] || 0) + 1;
      } catch (err) {
        console.log(`❌ [${i + 1}] FAILED: ${employeeData.name} — ${err.message}`);
        failed++;
      }
    }

    // Final Summary
    console.log('\n═══════════════════════════════════════');
    console.log('  📊 IMPORT SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Created:        ${created}`);
    console.log(`⏭️  Already exists: ${skipped}`);
    console.log(`❌ Failed:         ${failed}`);
    console.log(`📊 Total in CSV:   ${employeesData.length}`);

    if (Object.keys(summary).length > 0) {
      console.log('\n📦 Per Company:');
      Object.entries(summary).forEach(([code, count]) => {
        console.log(`   - ${code}: ${count} employees`);
      });
    }

    console.log('═══════════════════════════════════════\n');

    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════');
    console.log(`📱 Phone:    [Their mobile number]`);
    console.log(`🔒 Password: ${DEFAULT_PASSWORD}`);
    console.log('═══════════════════════════════════════\n');

    console.log('📋 NEXT STEPS:');
    console.log('1. ✅ Employees imported');
    console.log('2. 💰 Login as admin → Set salary');
    console.log('3. 📊 Run attendance import script');
    console.log('4. 💵 Payroll auto-calculated\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
};

importEmployees();
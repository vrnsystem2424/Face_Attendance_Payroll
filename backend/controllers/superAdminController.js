// controllers/superAdminController.js

const Employee = require('../models/Employee');
const Company = require('../models/Company');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const bcrypt = require('bcryptjs');

// ════════════════════════════════════════════════════════════
// GLOBAL DASHBOARD STATS
// ════════════════════════════════════════════════════════════
const getGlobalStats = async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments({ active: true });
    const totalEmployees = await Employee.countDocuments({ role: 'employee' });
    const totalManagers = await Employee.countDocuments({ role: 'manager' });
    const totalAdmins = await Employee.countDocuments({ role: 'admin' });
    const pendingApprovals = await Employee.countDocuments({ status: 'pending' });
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        total_companies: totalCompanies,
        total_employees: totalEmployees,
        total_managers: totalManagers,
        total_admins: totalAdmins,
        pending_approvals: pendingApprovals,
        pending_leaves: pendingLeaves,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// CREATE ADMIN FOR ANY COMPANY
// ════════════════════════════════════════════════════════════
const createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, company_id } = req.body;

    if (!company_id) {
      return res.status(400).json({ success: false, message: 'Company select karo' });
    }

    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(400).json({ success: false, message: 'Invalid company' });
    }

    const exists = await Employee.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emp_code = `ADM-${company.code}-${Date.now().toString().slice(-4)}`;

    const admin = await Employee.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      emp_code,
      company_id,
      department: 'Management',
      designation: 'Administrator',
      role: 'admin',
      status: 'approved',
      face_registered: true,
    });

    res.status(201).json({
      success: true,
      message: 'Admin create ho gaya',
      data: {
        _id: admin._id,
        name,
        email,
        emp_code,
        company: { _id: company._id, name: company.name, code: company.code }
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// GET ALL ADMINS + MANAGERS (across companies)
// ════════════════════════════════════════════════════════════
const getAllAdmins = async (req, res) => {
  try {
    const { role, company_id } = req.query;

    const filter = {
      role: role ? role : { $in: ['admin', 'manager'] }
    };

    if (company_id) filter.company_id = company_id;

    const admins = await Employee.find(filter)
      .populate('company_id', 'name code')
      .select('-password -face_encoding -all_encodings')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// DELETE ADMIN
// ════════════════════════════════════════════════════════════
const deleteAdmin = async (req, res) => {
  try {
    const admin = await Employee.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin nahi mila' });
    }

    if (admin.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super admin delete nahi kar sakte' });
    }

    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Admin delete ho gaya' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// PROMOTE EMPLOYEE TO MANAGER
// ════════════════════════════════════════════════════════════
const promoteToManager = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee nahi mila' });
    }

    if (employee.role !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Sirf employees ko manager bana sakte ho'
      });
    }

    employee.role = 'manager';
    await employee.save();

    res.json({
      success: true,
      message: `${employee.name} ab manager hai`,
      data: employee
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// DEMOTE MANAGER TO EMPLOYEE
// ════════════════════════════════════════════════════════════
const demoteToEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee nahi mila' });
    }

    if (employee.role !== 'manager') {
      return res.status(400).json({ success: false, message: 'Yeh manager nahi hai' });
    }

    employee.role = 'employee';
    await employee.save();

    res.json({
      success: true,
      message: `${employee.name} ab employee hai`,
      data: employee
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// GET ALL EMPLOYEES ACROSS COMPANIES
// ════════════════════════════════════════════════════════════
const getAllEmployees = async (req, res) => {
  try {
    const { company_id, status, role } = req.query;

    const filter = {};
    if (company_id) filter.company_id = company_id;
    if (status) filter.status = status;
    if (role) filter.role = role;

    const employees = await Employee.find(filter)
      .populate('company_id', 'name code')
      .populate('leave_approval_manager', 'name')
      .select('-password -face_encoding -all_encodings')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 🆕 GET ALL ATTENDANCE (Across all companies)
// ════════════════════════════════════════════════════════════
const getAllAttendanceGlobal = async (req, res) => {
  try {
    const { date, emp_code, company_id, flagged, location_status } = req.query;

    const filter = {};
    
    if (date) filter.date = date;
    if (emp_code) filter.emp_code = { $regex: emp_code, $options: 'i' };
    if (company_id && company_id !== 'all') filter.company_id = company_id;
    if (flagged === 'true') filter.flagged = true;
    if (location_status && location_status !== 'all') {
      filter.in_location_status = location_status;
    }

    const records = await Attendance.find(filter)
      .populate('company_id', 'name code')
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({ 
      success: true, 
      data: records,
      total: records.length,
    });
  } catch (err) {
    console.error('All attendance global error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ════════════════════════════════════════════════════════════
// 🆕 RESET USER PASSWORD (Admin, Manager, Super Admin)
// ════════════════════════════════════════════════════════════
// const resetUserPassword = async (req, res) => {
//   try {
//     const { user_id, new_password } = req.body;

//     if (!user_id) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'User ID required' 
//       });
//     }

//     if (!new_password || new_password.length < 6) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Password kam se kam 6 characters ka hona chahiye' 
//       });
//     }

//     const user = await Employee.findById(user_id);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User nahi mila' 
//       });
//     }

//     // Only allow password reset for admin/manager/super_admin/employee
//     const allowedRoles = ['admin', 'manager', 'super_admin', 'employee'];
//     if (!allowedRoles.includes(user.role)) {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'Is user ka password reset nahi kar sakte' 
//       });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(new_password, 10);
//     user.password = hashedPassword;
//     await user.save();

//     console.log(`🔑 Password reset: ${user.name} (${user.email})`);
//     console.log(`   By: ${req.employee.name} (Super Admin)`);
//     console.log(`   Role: ${user.role}`);

//     return res.json({
//       success: true,
//       message: `${user.name} ka password successfully reset ho gaya!`,
//       data: {
//         user_id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (err) {
//     console.error('❌ Reset password error:', err);
//     res.status(500).json({ 
//       success: false, 
//       message: err.message 
//     });
//   }
// };


// ════════════════════════════════════════════════════════════
// 🆕 RESET USER PASSWORD - FINAL FIX
// ════════════════════════════════════════════════════════════
const resetUserPassword = async (req, res) => {
  try {
    const { user_id, new_password } = req.body;

    console.log('\n═══════════════════════════════════════');
    console.log('🔑 PASSWORD RESET REQUEST');
    console.log('═══════════════════════════════════════');
    console.log(`   User ID: ${user_id}`);
    console.log(`   New Password Length: ${new_password?.length}`);

    // Validation
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password kam se kam 6 characters ka hona chahiye' 
      });
    }

    // Find user
    const user = await Employee.findById(user_id);
    if (!user) {
      console.log('   ❌ User not found');
      return res.status(404).json({ success: false, message: 'User nahi mila' });
    }

    console.log(`   👤 User: ${user.name} (${user.email})`);
    console.log(`   Current Version: ${user.passwordVersion}`);

    // Check allowed roles
    const allowedRoles = ['admin', 'manager', 'super_admin', 'employee'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Is user ka password reset nahi kar sakte' 
      });
    }

    // ════════════════════════════════════════
    // 🎯 HASH PASSWORD - ONLY ONCE
    // ════════════════════════════════════════
    const hashedPassword = await bcrypt.hash(new_password, 10);
    console.log(`   ✅ Hash generated: ${hashedPassword.substring(0, 30)}...`);

    // ════════════════════════════════════════
    // 🎯 UPDATE USER - Using findByIdAndUpdate
    // (This bypasses ALL pre-save hooks)
    // ════════════════════════════════════════
    const newVersion = (user.passwordVersion || 1) + 1;
    
    const updated = await Employee.findByIdAndUpdate(
      user_id,
      {
        password: hashedPassword,
        passwordVersion: newVersion,
        passwordChangedAt: new Date(),
      },
      { 
        new: true,
        runValidators: false,  // Skip validators
      }
    );

    if (!updated) {
      return res.status(500).json({ 
        success: false, 
        message: 'Update failed' 
      });
    }

    console.log(`   ✅ Updated in DB`);
    console.log(`   New Version: ${updated.passwordVersion}`);

    // ════════════════════════════════════════
    // 🎯 VERIFY PASSWORD WORKS
    // ════════════════════════════════════════
    const testMatch = await bcrypt.compare(new_password, updated.password);
    console.log(`   ✅ Password verification: ${testMatch ? 'WORKS ✅' : 'FAILED ❌'}`);
    
    if (!testMatch) {
      console.log('   🚨 CRITICAL: Password hash mismatch after save!');
      return res.status(500).json({ 
        success: false, 
        message: 'Password save error - contact developer' 
      });
    }

    console.log(`✅ SUCCESS - ${user.name} password reset done`);
    console.log(`   By: ${req.employee.name}`);
    console.log('═══════════════════════════════════════\n');

    return res.json({
      success: true,
      message: `${user.name} ka password reset ho gaya! Woh sab devices se auto-logout ho jaayega.`,
      data: {
        user_id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        new_version: updated.passwordVersion,
      },
    });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const changeOwnPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    console.log('\n═══════════════════════════════════════');
    console.log('🔑 SUPER ADMIN PASSWORD CHANGE');
    console.log('═══════════════════════════════════════');

    if (!current_password || !new_password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current aur new password dono zaroori hain' 
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password kam se kam 6 characters ka hona chahiye' 
      });
    }

    const superAdmin = await Employee.findById(req.employee._id);
    if (!superAdmin) {
      return res.status(404).json({ success: false, message: 'User nahi mila' });
    }

    console.log(`   User: ${superAdmin.name}`);
    console.log(`   Current Version: ${superAdmin.passwordVersion}`);

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, superAdmin.password);
    if (!isMatch) {
      console.log('   ❌ Current password wrong');
      return res.status(400).json({ 
        success: false, 
        message: 'Current password galat hai' 
      });
    }

    console.log('   ✅ Current password verified');

    // Hash new password ONCE
    const hashedPassword = await bcrypt.hash(new_password, 10);
    console.log(`   New Hash: ${hashedPassword.substring(0, 30)}...`);

    // Update using findByIdAndUpdate (bypass hooks)
    const newVersion = (superAdmin.passwordVersion || 1) + 1;
    
    const updated = await Employee.findByIdAndUpdate(
      req.employee._id,
      {
        password: hashedPassword,
        passwordVersion: newVersion,
        passwordChangedAt: new Date(),
      },
      { 
        new: true,
        runValidators: false,
      }
    );

    // Verify
    const testMatch = await bcrypt.compare(new_password, updated.password);
    console.log(`   ✅ Password verification: ${testMatch ? 'WORKS ✅' : 'FAILED ❌'}`);
    console.log(`   New Version: ${updated.passwordVersion}`);

    if (!testMatch) {
      return res.status(500).json({ 
        success: false, 
        message: 'Password save error' 
      });
    }

    console.log(`✅ SUCCESS - Super Admin password changed`);
    console.log('═══════════════════════════════════════\n');

    return res.json({
      success: true,
      message: 'Aapka password change ho gaya! Sab devices se logout ho jaayenge.',
    });
  } catch (err) {
    console.error('❌ Change own password error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};




// ════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════
module.exports = {
  getGlobalStats,
  createAdmin,
  getAllAdmins,
  deleteAdmin,
  promoteToManager,
  demoteToEmployee,
  getAllEmployees,
  getAllAttendanceGlobal, 
   resetUserPassword,    // 🆕
  changeOwnPassword, // 🆕
};
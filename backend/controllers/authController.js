// controllers/authController.js

const Employee = require('../models/Employee');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateEmpCode = async (name, phone, companyCode) => {
  const nameLetters = name.replace(/\s+/g, '').substring(0, 2).toUpperCase();
  const phoneDigits = phone.slice(-4);
  const prefix = companyCode ? `${companyCode}-` : '';

  let empCode = `${prefix}${nameLetters}${phoneDigits}`;
  let existing = await Employee.findOne({ emp_code: empCode });
  let counter = 1;
  while (existing) {
    empCode = `${prefix}${nameLetters}${phoneDigits}${counter}`;
    existing = await Employee.findOne({ emp_code: empCode });
    counter++;
  }
  return empCode;
};

// ════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════
const register = async (req, res) => {
  try {
    const {
      name, phone, email, password,
      company_id,
      department, designation,
      leave_approval_manager,
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email dena zaroori hai' });
    }

    if (!company_id) {
      return res.status(400).json({ success: false, message: 'Company select karna zaroori hai' });
    }

    const company = await Company.findById(company_id);
    if (!company || !company.active) {
      return res.status(400).json({ success: false, message: 'Invalid ya inactive company' });
    }

    const existingEmail = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Yeh email already registered hai' });
    }

    const existingPhone = await Employee.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'Yeh phone already registered hai' });
    }

    const emp_code = await generateEmpCode(name, phone, company.code);
    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await Employee.create({
      name,
      emp_code,
      phone,
      email: email.toLowerCase(),
      password: hashedPassword,
      company_id,
      department,
      designation,
      leave_approval_manager: leave_approval_manager || null,
    });

    console.log(`✅ New Employee: ${name} | Company: ${company.code}`);

    return res.status(201).json({
      success: true,
      message: `Registration successful! Tumhara Employee Code: ${emp_code}`,
      data: {
        id: employee._id,
        name: employee.name,
        emp_code: employee.emp_code,
        email: employee.email,
        company: { _id: company._id, name: company.name, code: company.code },
        status: employee.status,
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════
// EMPLOYEE / MANAGER LOGIN
// ════════════════════════════════════════
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const employee = await Employee.findOne({ email: email.toLowerCase() })
      .populate('company_id', 'name code')
      .populate('leave_approval_manager', 'name email');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Email galat hai' });
    }

    if (employee.role === 'admin' || employee.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin login portal use karo'
      });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password galat hai' });
    }

    if (employee.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Admin ne abhi approve nahi kiya' });
    }

    if (employee.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Account reject ho gaya hai' });
    }

    const token = generateToken(employee._id);

    // ── 🆕 Include face_encoding for fast client-side matching ──
    const userData = {
      id: employee._id,
      name: employee.name,
      emp_code: employee.emp_code,
      email: employee.email,
      role: employee.role,
      company: employee.company_id,
      department: employee.department,
      designation: employee.designation,
      leave_approval_manager: employee.leave_approval_manager,
      face_registered: employee.face_registered,
      face_encoding: employee.face_encoding || [],          // 🆕 cache ke liye
      all_encodings: employee.all_encodings || [],          // 🆕 multi-match
    };

    if (!employee.face_registered) {
      return res.status(200).json({
        success: true,
        message: 'Face register karo',
        face_pending: true,
        token,
        data: { ...userData, face_registered: false }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: userData
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════
// ADMIN LOGIN
// ════════════════════════════════════════
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Employee.findOne({
      email: email.toLowerCase(),
      role: 'admin'
    }).populate('company_id', 'name code');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin nahi mila' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password galat hai' });
    }

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token: generateToken(admin._id),
      data: {
        id: admin._id,
        name: admin.name,
        emp_code: admin.emp_code,
        email: admin.email,
        role: admin.role,
        company: admin.company_id,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════
// SUPER ADMIN LOGIN
// ════════════════════════════════════════
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const superAdmin = await Employee.findOne({
      email: email.toLowerCase(),
      role: 'super_admin'
    });

    if (!superAdmin) {
      return res.status(404).json({ success: false, message: 'Super admin nahi mila' });
    }

    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password galat hai' });
    }

    return res.status(200).json({
      success: true,
      message: 'Super admin login successful',
      token: generateToken(superAdmin._id),
      data: {
        id: superAdmin._id,
        name: superAdmin.name,
        emp_code: superAdmin.emp_code,
        email: superAdmin.email,
        role: superAdmin.role,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════
// CREATE ADMIN
// ════════════════════════════════════════
const createAdmin = async (req, res) => {
  try {
    const { name, phone, email, password, company_id } = req.body;

    if (!company_id) {
      return res.status(400).json({ success: false, message: 'Company select karo' });
    }

    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(400).json({ success: false, message: 'Invalid company' });
    }

    const existing = await Employee.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already exist hai' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emp_code = `ADM-${company.code}-${Date.now().toString().slice(-4)}`;

    const admin = await Employee.create({
      name,
      emp_code,
      phone,
      email: email.toLowerCase(),
      password: hashedPassword,
      company_id,
      department: 'Management',
      designation: 'Administrator',
      face_registered: true,
      status: 'approved',
      role: 'admin'
    });

    return res.status(201).json({
      success: true,
      message: 'Admin ban gaya!',
      data: {
        name: admin.name,
        emp_code: admin.emp_code,
        email: admin.email,
        role: admin.role,
        company: { _id: company._id, name: company.name, code: company.code }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════
// GET CURRENT USER
// ════════════════════════════════════════
const getMe = async (req, res) => {
  try {
    const user = await Employee.findById(req.employee._id)
      .populate('company_id', 'name code')
      .populate('leave_approval_manager', 'name email')
      .select('-password');

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  superAdminLogin,
  createAdmin,
  getMe,
};
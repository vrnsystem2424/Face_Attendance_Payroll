
// // // controllers/authController.js

// // const Employee = require('../models/Employee');
// // const Company = require('../models/Company');
// // const bcrypt = require('bcryptjs');
// // const jwt = require('jsonwebtoken');

// // const generateToken = (id) => {
// //   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// // };

// // const generateEmpCode = async (name, phone, companyCode) => {
// //   const nameLetters = name.replace(/\s+/g, '').substring(0, 2).toUpperCase();
// //   const phoneDigits = phone.slice(-4);
// //   const prefix = companyCode ? `${companyCode}-` : '';

// //   let empCode = `${prefix}${nameLetters}${phoneDigits}`;
// //   let existing = await Employee.findOne({ emp_code: empCode });
// //   let counter = 1;
// //   while (existing) {
// //     empCode = `${prefix}${nameLetters}${phoneDigits}${counter}`;
// //     existing = await Employee.findOne({ emp_code: empCode });
// //     counter++;
// //   }
// //   return empCode;
// // };

// // // ════════════════════════════════════════
// // // REGISTER
// // // ════════════════════════════════════════
// // const register = async (req, res) => {
// //   try {
// //     const {
// //       name, phone, email, password,
// //       company_id,
// //       department, designation,
// //       leave_approval_manager,
// //     } = req.body;

// //     if (!email) {
// //       return res.status(400).json({ success: false, message: 'Email dena zaroori hai' });
// //     }

// //     if (!company_id) {
// //       return res.status(400).json({ success: false, message: 'Company select karna zaroori hai' });
// //     }

// //     const company = await Company.findById(company_id);
// //     if (!company || !company.active) {
// //       return res.status(400).json({ success: false, message: 'Invalid ya inactive company' });
// //     }

// //     const existingEmail = await Employee.findOne({ email: email.toLowerCase() });
// //     if (existingEmail) {
// //       return res.status(400).json({ success: false, message: 'Yeh email already registered hai' });
// //     }

// //     const existingPhone = await Employee.findOne({ phone });
// //     if (existingPhone) {
// //       return res.status(400).json({ success: false, message: 'Yeh phone already registered hai' });
// //     }

// //     const emp_code = await generateEmpCode(name, phone, company.code);
// //     const hashedPassword = await bcrypt.hash(password, 10);

// //     const employee = await Employee.create({
// //       name,
// //       emp_code,
// //       phone,
// //       email: email.toLowerCase(),
// //       password: hashedPassword,
// //       company_id,
// //       department,
// //       designation,
// //       leave_approval_manager: leave_approval_manager || null,
// //     });

// //     console.log(`✅ New Employee: ${name} | Company: ${company.code}`);

// //     return res.status(201).json({
// //       success: true,
// //       message: `Registration successful! Tumhara Employee Code: ${emp_code}`,
// //       data: {
// //         id: employee._id,
// //         name: employee.name,
// //         emp_code: employee.emp_code,
// //         email: employee.email,
// //         company: { _id: company._id, name: company.name, code: company.code },
// //         status: employee.status,
// //       }
// //     });

// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
// //   }
// // };

// // // ════════════════════════════════════════
// // // EMPLOYEE / MANAGER LOGIN
// // // ════════════════════════════════════════
// // const login = async (req, res) => {
// //   try {
// //     const { email, password } = req.body;

// //     const employee = await Employee.findOne({ email: email.toLowerCase() })
// //       .populate('company_id', 'name code')
// //       .populate('leave_approval_manager', 'name email');

// //     if (!employee) {
// //       return res.status(404).json({ success: false, message: 'Email galat hai' });
// //     }

// //     if (employee.role === 'admin' || employee.role === 'super_admin') {
// //       return res.status(403).json({
// //         success: false,
// //         message: 'Admin login portal use karo'
// //       });
// //     }

// //     const isMatch = await bcrypt.compare(password, employee.password);
// //     if (!isMatch) {
// //       return res.status(400).json({ success: false, message: 'Password galat hai' });
// //     }

// //     if (employee.status === 'pending') {
// //       return res.status(403).json({ success: false, message: 'Admin ne abhi approve nahi kiya' });
// //     }

// //     if (employee.status === 'rejected') {
// //       return res.status(403).json({ success: false, message: 'Account reject ho gaya hai' });
// //     }

// //     const token = generateToken(employee._id);

// //     const userData = {
// //       id: employee._id,
// //       name: employee.name,
// //       emp_code: employee.emp_code,
// //       email: employee.email,
// //       role: employee.role,
// //       company: employee.company_id,
// //       company_id: employee.company_id,
// //       department: employee.department,
// //       designation: employee.designation,
// //       leave_approval_manager: employee.leave_approval_manager,
// //       face_registered: employee.face_registered,
// //       face_encoding: employee.face_encoding || [],
// //       all_encodings: employee.all_encodings || [],
// //     };

// //     if (!employee.face_registered) {
// //       return res.status(200).json({
// //         success: true,
// //         message: 'Face register karo',
// //         face_pending: true,
// //         token,
// //         data: { ...userData, face_registered: false }
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       message: 'Login successful',
// //       token,
// //       data: userData
// //     });

// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
// //   }
// // };

// // // ════════════════════════════════════════
// // // 🆕 ADMIN LOGIN - Updated with assigned_manager
// // // ════════════════════════════════════════
// // const adminLogin = async (req, res) => {
// //   try {
// //     const { email, password } = req.body;

// //     const admin = await Employee.findOne({
// //       email: email.toLowerCase(),
// //       role: 'admin'
// //     }).populate('company_id', 'name code');

// //     if (!admin) {
// //       return res.status(404).json({ success: false, message: 'Admin nahi mila' });
// //     }

// //     const isMatch = await bcrypt.compare(password, admin.password);
// //     if (!isMatch) {
// //       return res.status(400).json({ success: false, message: 'Password galat hai' });
// //     }

// //     console.log(`✅ Admin Login: ${admin.name} | Assigned Manager: ${admin.assigned_manager || 'None'}`);

// //     return res.status(200).json({
// //       success: true,
// //       message: 'Admin login successful',
// //       token: generateToken(admin._id),
// //       data: {
// //         id: admin._id,
// //         name: admin.name,
// //         emp_code: admin.emp_code,
// //         email: admin.email,
// //         role: admin.role,
// //         company: admin.company_id,
// //         company_id: admin.company_id,
// //         assigned_manager: admin.assigned_manager || '',
// //         admin_type: admin.admin_type || 'full',   // 🆕 IMPORTANT
// //         department: admin.department,
// //         designation: admin.designation,
// //       }
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
// //   }
// // };

// // // ════════════════════════════════════════
// // // SUPER ADMIN LOGIN
// // // ════════════════════════════════════════
// // const superAdminLogin = async (req, res) => {
// //   try {
// //     const { email, password } = req.body;

// //     const superAdmin = await Employee.findOne({
// //       email: email.toLowerCase(),
// //       role: 'super_admin'
// //     });

// //     if (!superAdmin) {
// //       return res.status(404).json({ success: false, message: 'Super admin nahi mila' });
// //     }

// //     const isMatch = await bcrypt.compare(password, superAdmin.password);
// //     if (!isMatch) {
// //       return res.status(400).json({ success: false, message: 'Password galat hai' });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       message: 'Super admin login successful',
// //       token: generateToken(superAdmin._id),
// //       data: {
// //         id: superAdmin._id,
// //         name: superAdmin.name,
// //         emp_code: superAdmin.emp_code,
// //         email: superAdmin.email,
// //         role: superAdmin.role,
// //       }
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
// //   }
// // };

// // // ════════════════════════════════════════
// // // CREATE ADMIN
// // // ════════════════════════════════════════
// // const createAdmin = async (req, res) => {
// //   try {
// //     const { name, phone, email, password, company_id, assigned_manager } = req.body;

// //     if (!company_id) {
// //       return res.status(400).json({ success: false, message: 'Company select karo' });
// //     }

// //     const company = await Company.findById(company_id);
// //     if (!company) {
// //       return res.status(400).json({ success: false, message: 'Invalid company' });
// //     }

// //     const existing = await Employee.findOne({ email: email.toLowerCase() });
// //     if (existing) {
// //       return res.status(400).json({ success: false, message: 'Already exist hai' });
// //     }

// //     const hashedPassword = await bcrypt.hash(password, 10);
// //     const emp_code = `ADM-${company.code}-${Date.now().toString().slice(-4)}`;

// //     const admin = await Employee.create({
// //       name,
// //       emp_code,
// //       phone,
// //       email: email.toLowerCase(),
// //       password: hashedPassword,
// //       company_id,
// //       department: 'Management',
// //       designation: assigned_manager ? `Leave Admin (${assigned_manager})` : 'Administrator',
// //       face_registered: true,
// //       status: 'approved',
// //       role: 'admin',
// //       assigned_manager: assigned_manager || '',  // 🆕
// //     });

// //     return res.status(201).json({
// //       success: true,
// //       message: 'Admin ban gaya!',
// //       data: {
// //         name: admin.name,
// //         emp_code: admin.emp_code,
// //         email: admin.email,
// //         role: admin.role,
// //         assigned_manager: admin.assigned_manager,
// //         company: { _id: company._id, name: company.name, code: company.code }
// //       }
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
// //   }
// // };

// // // ════════════════════════════════════════
// // // GET CURRENT USER
// // // ════════════════════════════════════════
// // const getMe = async (req, res) => {
// //   try {
// //     const user = await Employee.findById(req.employee._id)
// //       .populate('company_id', 'name code')
// //       .populate('leave_approval_manager', 'name email')
// //       .select('-password');

// //     return res.status(200).json({ success: true, data: user });
// //   } catch (error) {
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Server error',
// //       error: error.message,
// //     });
// //   }
// // };

// // module.exports = {
// //   register,
// //   login,
// //   adminLogin,
// //   superAdminLogin,
// //   createAdmin,
// //   getMe,
// // };







// const Employee = require('../models/Employee');
// const Company = require('../models/Company');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { sendOTPEmail } = require('../utils/emailService');

// // ════════════════════════════════════════
// // OTP STORE (In-memory)
// // ════════════════════════════════════════
// const otpStore = new Map();

// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// const generateEmpCode = async (name, phone, companyCode) => {
//   const nameLetters = name.replace(/\s+/g, '').substring(0, 2).toUpperCase();
//   const phoneDigits = phone.slice(-4);
//   const prefix = companyCode ? `${companyCode}-` : '';

//   let empCode = `${prefix}${nameLetters}${phoneDigits}`;
//   let existing = await Employee.findOne({ emp_code: empCode });
//   let counter = 1;
//   while (existing) {
//     empCode = `${prefix}${nameLetters}${phoneDigits}${counter}`;
//     existing = await Employee.findOne({ emp_code: empCode });
//     counter++;
//   }
//   return empCode;
// };

// // ════════════════════════════════════════
// // REGISTER
// // ════════════════════════════════════════
// const register = async (req, res) => {
//   try {
//     const {
//       name, phone, email, password,
//       company_id,
//       department, designation,
//       leave_approval_manager,
//     } = req.body;

//     if (!email) {
//       return res.status(400).json({ success: false, message: 'Email dena zaroori hai' });
//     }

//     if (!company_id) {
//       return res.status(400).json({ success: false, message: 'Company select karna zaroori hai' });
//     }

//     const company = await Company.findById(company_id);
//     if (!company || !company.active) {
//       return res.status(400).json({ success: false, message: 'Invalid ya inactive company' });
//     }

//     const existingEmail = await Employee.findOne({ email: email.toLowerCase() });
//     if (existingEmail) {
//       return res.status(400).json({ success: false, message: 'Yeh email already registered hai' });
//     }

//     const existingPhone = await Employee.findOne({ phone });
//     if (existingPhone) {
//       return res.status(400).json({ success: false, message: 'Yeh phone already registered hai' });
//     }

//     const emp_code = await generateEmpCode(name, phone, company.code);
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const employee = await Employee.create({
//       name,
//       emp_code,
//       phone,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       company_id,
//       department,
//       designation,
//       leave_approval_manager: leave_approval_manager || null,
//     });

//     console.log(`✅ New Employee: ${name} | Company: ${company.code}`);

//     return res.status(201).json({
//       success: true,
//       message: `Registration successful! Tumhara Employee Code: ${emp_code}`,
//       data: {
//         id: employee._id,
//         name: employee.name,
//         emp_code: employee.emp_code,
//         email: employee.email,
//         company: { _id: company._id, name: company.name, code: company.code },
//         status: employee.status,
//       }
//     });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

// // ════════════════════════════════════════
// // EMPLOYEE / MANAGER LOGIN
// // ════════════════════════════════════════
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const employee = await Employee.findOne({ email: email.toLowerCase() })
//       .populate('company_id', 'name code')
//       .populate('leave_approval_manager', 'name email');

//     if (!employee) {
//       return res.status(404).json({ success: false, message: 'Email galat hai' });
//     }

//     if (employee.role === 'admin' || employee.role === 'super_admin') {
//       return res.status(403).json({
//         success: false,
//         message: 'Admin login portal use karo'
//       });
//     }

//     const isMatch = await bcrypt.compare(password, employee.password);
//     if (!isMatch) {
//       return res.status(400).json({ success: false, message: 'Password galat hai' });
//     }

//     if (employee.status === 'pending') {
//       return res.status(403).json({ success: false, message: 'Admin ne abhi approve nahi kiya' });
//     }

//     if (employee.status === 'rejected') {
//       return res.status(403).json({ success: false, message: 'Account reject ho gaya hai' });
//     }

//     const token = generateToken(employee._id);

//     const userData = {
//       id: employee._id,
//       name: employee.name,
//       emp_code: employee.emp_code,
//       email: employee.email,
//       role: employee.role,
//       company: employee.company_id,
//       company_id: employee.company_id,
//       department: employee.department,
//       designation: employee.designation,
//       leave_approval_manager: employee.leave_approval_manager,
//       face_registered: employee.face_registered,
//       face_encoding: employee.face_encoding || [],
//       all_encodings: employee.all_encodings || [],
//     };

//     if (!employee.face_registered) {
//       return res.status(200).json({
//         success: true,
//         message: 'Face register karo',
//         face_pending: true,
//         token,
//         data: { ...userData, face_registered: false }
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       token,
//       data: userData
//     });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

// // ════════════════════════════════════════
// // ADMIN LOGIN
// // ════════════════════════════════════════
// const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const admin = await Employee.findOne({
//       email: email.toLowerCase(),
//       role: 'admin'
//     }).populate('company_id', 'name code');

//     if (!admin) {
//       return res.status(404).json({ success: false, message: 'Admin nahi mila' });
//     }

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//       return res.status(400).json({ success: false, message: 'Password galat hai' });
//     }

//     console.log(`✅ Admin Login: ${admin.name} | Assigned Manager: ${admin.assigned_manager || 'None'}`);

//     return res.status(200).json({
//       success: true,
//       message: 'Admin login successful',
//       token: generateToken(admin._id),
//       data: {
//         id: admin._id,
//         name: admin.name,
//         emp_code: admin.emp_code,
//         email: admin.email,
//         role: admin.role,
//         company: admin.company_id,
//         company_id: admin.company_id,
//         assigned_manager: admin.assigned_manager || '',
//         admin_type: admin.admin_type || 'full',
//         department: admin.department,
//         designation: admin.designation,
//       }
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

// // ════════════════════════════════════════
// // SUPER ADMIN LOGIN
// // ════════════════════════════════════════
// const superAdminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const superAdmin = await Employee.findOne({
//       email: email.toLowerCase(),
//       role: 'super_admin'
//     });

//     if (!superAdmin) {
//       return res.status(404).json({ success: false, message: 'Super admin nahi mila' });
//     }

//     const isMatch = await bcrypt.compare(password, superAdmin.password);
//     if (!isMatch) {
//       return res.status(400).json({ success: false, message: 'Password galat hai' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Super admin login successful',
//       token: generateToken(superAdmin._id),
//       data: {
//         id: superAdmin._id,
//         name: superAdmin.name,
//         emp_code: superAdmin.emp_code,
//         email: superAdmin.email,
//         role: superAdmin.role,
//       }
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

// // ════════════════════════════════════════
// // CREATE ADMIN
// // ════════════════════════════════════════
// const createAdmin = async (req, res) => {
//   try {
//     const { name, phone, email, password, company_id, assigned_manager } = req.body;

//     if (!company_id) {
//       return res.status(400).json({ success: false, message: 'Company select karo' });
//     }

//     const company = await Company.findById(company_id);
//     if (!company) {
//       return res.status(400).json({ success: false, message: 'Invalid company' });
//     }

//     const existing = await Employee.findOne({ email: email.toLowerCase() });
//     if (existing) {
//       return res.status(400).json({ success: false, message: 'Already exist hai' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const emp_code = `ADM-${company.code}-${Date.now().toString().slice(-4)}`;

//     const admin = await Employee.create({
//       name,
//       emp_code,
//       phone,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       company_id,
//       department: 'Management',
//       designation: assigned_manager ? `Leave Admin (${assigned_manager})` : 'Administrator',
//       face_registered: true,
//       status: 'approved',
//       role: 'admin',
//       assigned_manager: assigned_manager || '',
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'Admin ban gaya!',
//       data: {
//         name: admin.name,
//         emp_code: admin.emp_code,
//         email: admin.email,
//         role: admin.role,
//         assigned_manager: admin.assigned_manager,
//         company: { _id: company._id, name: company.name, code: company.code }
//       }
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

// // ════════════════════════════════════════
// // GET CURRENT USER
// // ════════════════════════════════════════
// const getMe = async (req, res) => {
//   try {
//     const user = await Employee.findById(req.employee._id)
//       .populate('company_id', 'name code')
//       .populate('leave_approval_manager', 'name email')
//       .select('-password');

//     return res.status(200).json({ success: true, data: user });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // ════════════════════════════════════════
// // 🆕 FORGOT PASSWORD - Send OTP
// // ════════════════════════════════════════
// const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email daalna zaroori hai'
//       });
//     }

//     // Employee dhundo
//     const employee = await Employee.findOne({
//       email: email.toLowerCase()
//     });

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: 'Yeh email registered nahi hai'
//       });
//     }

//     // 6 digit OTP generate karo
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     // OTP store karo (10 min expiry)
//     otpStore.set(email.toLowerCase(), {
//       otp,
//       expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
//       name: employee.name,
//     });

//     // Gmail se OTP bhejo
//     await sendOTPEmail(email.toLowerCase(), otp, employee.name);

//     console.log(`✅ OTP sent: ${otp} → ${email}`);

//     return res.status(200).json({
//       success: true,
//       message: `OTP bheja gaya ${email} par. 10 minute mein use karo.`,
//     });

//   } catch (error) {
//     console.error('❌ Forgot password error:', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'OTP send nahi ho saka'
//     });
//   }
// };

// // ════════════════════════════════════════
// // 🆕 VERIFY OTP
// // ════════════════════════════════════════
// const verifyOTP = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email aur OTP dono zaroori hain'
//       });
//     }

//     const stored = otpStore.get(email.toLowerCase());

//     // OTP exist karta hai?
//     if (!stored) {
//       return res.status(400).json({
//         success: false,
//         message: 'OTP nahi mila. Pehle Forgot Password karo.'
//       });
//     }

//     // OTP expire hua?
//     if (Date.now() > stored.expiresAt) {
//       otpStore.delete(email.toLowerCase());
//       return res.status(400).json({
//         success: false,
//         message: 'OTP expire ho gaya. Dobara bhejo.'
//       });
//     }

//     // OTP match karo
//     if (stored.otp !== otp.toString()) {
//       return res.status(400).json({
//         success: false,
//         message: 'OTP galat hai'
//       });
//     }

//     // OTP sahi hai - verified mark karo
//     otpStore.set(email.toLowerCase(), {
//       ...stored,
//       verified: true,
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'OTP verified! Ab naya password set karo.'
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // ════════════════════════════════════════
// // 🆕 RESET PASSWORD
// // ════════════════════════════════════════
// const resetPassword = async (req, res) => {
//   try {
//     const { email, otp, newPassword } = req.body;

//     if (!email || !otp || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email, OTP aur naya password zaroori hai'
//       });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: 'Password kam se kam 6 characters ka hona chahiye'
//       });
//     }

//     const stored = otpStore.get(email.toLowerCase());

//     if (!stored) {
//       return res.status(400).json({
//         success: false,
//         message: 'OTP nahi mila. Pehle Forgot Password karo.'
//       });
//     }

//     if (Date.now() > stored.expiresAt) {
//       otpStore.delete(email.toLowerCase());
//       return res.status(400).json({
//         success: false,
//         message: 'OTP expire ho gaya. Dobara bhejo.'
//       });
//     }

//     if (stored.otp !== otp.toString()) {
//       return res.status(400).json({
//         success: false,
//         message: 'OTP galat hai'
//       });
//     }

//     // Password update karo
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     await Employee.findOneAndUpdate(
//       { email: email.toLowerCase() },
//       { password: hashedPassword }
//     );

//     // OTP delete karo (use ho gaya)
//     otpStore.delete(email.toLowerCase());

//     console.log(`✅ Password reset: ${email}`);

//     return res.status(200).json({
//       success: true,
//       message: 'Password reset ho gaya! Ab login karo.'
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   register,
//   login,
//   adminLogin,
//   superAdminLogin,
//   createAdmin,
//   getMe,
//   forgotPassword,  // 🆕
//   verifyOTP,       // 🆕
//   resetPassword,   // 🆕
// };






const Employee = require('../models/Employee');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/emailService');

const otpStore = new Map();

// 🆕 UPDATED - Include passwordVersion in token
const generateToken = (id, passwordVersion = 1) => {
  return jwt.sign(
    { id, passwordVersion }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
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
      passwordVersion: 1,  // 🆕
      passwordChangedAt: new Date(),  // 🆕
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

    // 🆕 Include passwordVersion in token
    const token = generateToken(employee._id, employee.passwordVersion || 1);

    const userData = {
      id: employee._id,
      name: employee.name,
      emp_code: employee.emp_code,
      email: employee.email,
      role: employee.role,
      company: employee.company_id,
      company_id: employee.company_id,
      department: employee.department,
      designation: employee.designation,
      leave_approval_manager: employee.leave_approval_manager,
      face_registered: employee.face_registered,
      face_encoding: employee.face_encoding || [],
      all_encodings: employee.all_encodings || [],
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

    console.log(`✅ Admin Login: ${admin.name} | Assigned Manager: ${admin.assigned_manager || 'None'}`);

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      // 🆕 Include passwordVersion
      token: generateToken(admin._id, admin.passwordVersion || 1),
      data: {
        id: admin._id,
        name: admin.name,
        emp_code: admin.emp_code,
        email: admin.email,
        role: admin.role,
        company: admin.company_id,
        company_id: admin.company_id,
        assigned_manager: admin.assigned_manager || '',
        admin_type: admin.admin_type || 'full',
        department: admin.department,
        designation: admin.designation,
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
      // 🆕 Include passwordVersion
      token: generateToken(superAdmin._id, superAdmin.passwordVersion || 1),
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
    const { name, phone, email, password, company_id, assigned_manager } = req.body;

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
      designation: assigned_manager ? `Leave Admin (${assigned_manager})` : 'Administrator',
      face_registered: true,
      status: 'approved',
      role: 'admin',
      assigned_manager: assigned_manager || '',
      passwordVersion: 1,  // 🆕
      passwordChangedAt: new Date(),  // 🆕
    });

    return res.status(201).json({
      success: true,
      message: 'Admin ban gaya!',
      data: {
        name: admin.name,
        emp_code: admin.emp_code,
        email: admin.email,
        role: admin.role,
        assigned_manager: admin.assigned_manager,
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
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════
// FORGOT PASSWORD - Send OTP
// ════════════════════════════════════════
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email daalna zaroori hai' });
    }

    const employee = await Employee.findOne({ email: email.toLowerCase() });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Yeh email registered nahi hai' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      name: employee.name,
    });

    await sendOTPEmail(email.toLowerCase(), otp, employee.name);

    console.log(`✅ OTP sent: ${otp} → ${email}`);

    return res.status(200).json({
      success: true,
      message: `OTP bheja gaya ${email} par. 10 minute mein use karo.`,
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'OTP send nahi ho saka'
    });
  }
};

// ════════════════════════════════════════
// VERIFY OTP
// ════════════════════════════════════════
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email aur OTP dono zaroori hain' });
    }

    const stored = otpStore.get(email.toLowerCase());

    if (!stored) {
      return res.status(400).json({ success: false, message: 'OTP nahi mila. Pehle Forgot Password karo.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: 'OTP expire ho gaya. Dobara bhejo.' });
    }

    if (stored.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'OTP galat hai' });
    }

    otpStore.set(email.toLowerCase(), { ...stored, verified: true });

    return res.status(200).json({
      success: true,
      message: 'OTP verified! Ab naya password set karo.'
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════
// 🆕 RESET PASSWORD (with version increment)
// ════════════════════════════════════════
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    console.log('\n═══════════════════════════════════════');
    console.log('🔑 FORGOT PASSWORD - RESET');
    console.log('═══════════════════════════════════════');
    console.log(`   Email: ${email}`);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP aur naya password zaroori hai'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password kam se kam 6 characters ka hona chahiye'
      });
    }

    const stored = otpStore.get(email.toLowerCase());

    if (!stored) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP nahi mila. Pehle Forgot Password karo.' 
      });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ 
        success: false, 
        message: 'OTP expire ho gaya. Dobara bhejo.' 
      });
    }

    if (stored.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'OTP galat hai' });
    }

    // Find user
    const user = await Employee.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nahi mila' });
    }

    console.log(`   User: ${user.name}`);
    console.log(`   Current Version: ${user.passwordVersion}`);

    // Hash password ONCE
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`   New Hash: ${hashedPassword.substring(0, 30)}...`);

    // Update using findByIdAndUpdate (bypass hooks)
    const newVersion = (user.passwordVersion || 1) + 1;
    
    const updated = await Employee.findByIdAndUpdate(
      user._id,
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
    const testMatch = await bcrypt.compare(newPassword, updated.password);
    console.log(`   ✅ Password verification: ${testMatch ? 'WORKS ✅' : 'FAILED ❌'}`);
    console.log(`   New Version: ${updated.passwordVersion}`);

    if (!testMatch) {
      return res.status(500).json({ 
        success: false, 
        message: 'Password save error' 
      });
    }

    // Delete OTP
    otpStore.delete(email.toLowerCase());

    console.log(`✅ SUCCESS - Password reset done via OTP`);
    console.log('═══════════════════════════════════════\n');

    return res.status(200).json({
      success: true,
      message: 'Password reset ho gaya! Ab login karo.'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};
module.exports = {
  register,
  login,
  adminLogin,
  superAdminLogin,
  createAdmin,
  getMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
  generateToken,  // 🆕 Export for other controllers
};
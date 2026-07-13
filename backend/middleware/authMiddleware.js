// // middleware/authMiddleware.js

// const jwt = require('jsonwebtoken');
// const Employee = require('../models/Employee');

// // ════════════════════════════════════════
// // 1. PROTECT — Verify token
// // ════════════════════════════════════════

// const protect = async (req, res, next) => {
//   try {
//     let token;

//     if (req.headers.authorization && 
//         req.headers.authorization.startsWith('Bearer')) {
//       token = req.headers.authorization.split(' ')[1];
//     }

    
//     if (!token) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Login karo pehle' 
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     req.employee = await Employee.findById(decoded.id)
//                                  .populate('company_id', 'name code')
//                                  .select('-password');

//     if (!req.employee) {
//       return res.status(401).json({
//         success: false,
//         message: 'User nahi mila'
//       });
//     }

//     next();

//   } catch (error) {
//     return res.status(401).json({ 
//       success: false, 
//       message: 'Token invalid hai' 
//     });
//   }
// };

// // ════════════════════════════════════════
// // 2. ADMIN ONLY (admin + super_admin)
// // ════════════════════════════════════════
// const adminOnly = (req, res, next) => {
//   if (req.employee && (req.employee.role === 'admin' || req.employee.role === 'super_admin')) {
//     next();
//   } else {
//     return res.status(403).json({ 
//       success: false, 
//       message: 'Admin access chahiye' 
//     });
//   }
// };

// // ════════════════════════════════════════
// // 3. SUPER ADMIN ONLY
// // ════════════════════════════════════════
// const superAdminOnly = (req, res, next) => {
//   if (req.employee && req.employee.role === 'super_admin') {
//     next();
//   } else {
//     return res.status(403).json({ 
//       success: false, 
//       message: 'Super admin access chahiye' 
//     });
//   }
// };

// // ════════════════════════════════════════
// // 4. MANAGER ONLY (manager + admin + super_admin)
// // ════════════════════════════════════════
// const managerOnly = (req, res, next) => {
//   const allowedRoles = ['manager', 'admin', 'super_admin'];
//   if (req.employee && allowedRoles.includes(req.employee.role)) {
//     next();
//   } else {
//     return res.status(403).json({ 
//       success: false, 
//       message: 'Manager access chahiye' 
//     });
//   }
// };

// // ════════════════════════════════════════
// // 5. AUTHORIZE — Multiple roles
// // Usage: authorize('admin', 'manager')
// // ════════════════════════════════════════
// const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!req.employee) {
//       return res.status(401).json({
//         success: false,
//         message: 'Login karo pehle'
//       });
//     }

//     // Super admin bypass — sab kuch access
//     if (req.employee.role === 'super_admin') {
//       return next();
//     }

//     if (!roles.includes(req.employee.role)) {
//       return res.status(403).json({
//         success: false,
//         message: `Access denied. Required role: ${roles.join(' or ')}`
//       });
//     }

//     next();
//   };
// };

// // ════════════════════════════════════════
// // 6. COMPANY SCOPE — Auto filter by company
// // ════════════════════════════════════════
// const companyScope = (req, res, next) => {
//   if (!req.employee) {
//     return res.status(401).json({
//       success: false,
//       message: 'Login karo pehle'
//     });
//   }

//   // Super admin → see all OR filter by query
//   if (req.employee.role === 'super_admin') {
//     req.companyFilter = req.query.company_id 
//       ? { company_id: req.query.company_id } 
//       : {};
//   } 
//   // Others → only their company
//   else {
//     req.companyFilter = { 
//       company_id: req.employee.company_id?._id || req.employee.company_id 
//     };
//   }

//   next();
// };

// // ════════════════════════════════════════
// // 7. SAME COMPANY CHECK
// // ════════════════════════════════════════
// const sameCompany = async (req, res, next) => {
//   try {
//     if (req.employee.role === 'super_admin') return next();

//     const targetUser = await Employee.findById(req.params.id);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User nahi mila'
//       });
//     }

//     const myCompanyId = req.employee.company_id?._id?.toString() 
//                      || req.employee.company_id?.toString();
//     const targetCompanyId = targetUser.company_id?.toString();

//     if (myCompanyId !== targetCompanyId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Doosri company ke user ko access nahi kar sakte'
//       });
//     }

//     req.targetUser = targetUser;
//     next();
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };

// module.exports = { 
//   protect, 
//   adminOnly,
//   superAdminOnly,
//   managerOnly,
//   authorize,
//   companyScope,
//   sameCompany,
// };





// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// ════════════════════════════════════════
// 1. PROTECT — Verify token + password version
// ════════════════════════════════════════
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Login karo pehle' 
      });
    }

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get employee from DB
    req.employee = await Employee.findById(decoded.id)
                                 .populate('company_id', 'name code')
                                 .select('-password');

    if (!req.employee) {
      return res.status(401).json({
        success: false,
        message: 'User nahi mila'
      });
    }

    // 🆕 PASSWORD VERSION CHECK
    const tokenVersion = decoded.passwordVersion || 1;
    const currentVersion = req.employee.passwordVersion || 1;

    // 🔍 DEBUG - Always log
    console.log(`\n🔍 AUTH CHECK`);
    console.log(`   User: ${req.employee.name}`);
    console.log(`   Token version: ${tokenVersion}`);
    console.log(`   DB version: ${currentVersion}`);
    console.log(`   Match: ${tokenVersion === currentVersion ? '✅ YES' : '❌ MISMATCH - LOGOUT!'}`);

    if (tokenVersion !== currentVersion) {
      console.log(`🔒 AUTO LOGOUT: ${req.employee.name}\n`);
      return res.status(401).json({ 
        success: false, 
        message: 'Aapka password change ho gaya hai. Dobara login karo.',
        code: 'PASSWORD_CHANGED'
      });
    }

    next();

  } catch (error) {
    console.log('❌ Token error:', error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Token invalid hai' 
    });
  }
};

// ════════════════════════════════════════
// 2. ADMIN ONLY
// ════════════════════════════════════════
const adminOnly = (req, res, next) => {
  if (req.employee && (req.employee.role === 'admin' || req.employee.role === 'super_admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access chahiye' 
    });
  }
};

// ════════════════════════════════════════
// 3. SUPER ADMIN ONLY
// ════════════════════════════════════════
const superAdminOnly = (req, res, next) => {
  if (req.employee && req.employee.role === 'super_admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Super admin access chahiye' 
    });
  }
};

// ════════════════════════════════════════
// 4. MANAGER ONLY
// ════════════════════════════════════════
const managerOnly = (req, res, next) => {
  const allowedRoles = ['manager', 'admin', 'super_admin'];
  if (req.employee && allowedRoles.includes(req.employee.role)) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Manager access chahiye' 
    });
  }
};

// ════════════════════════════════════════
// 5. AUTHORIZE
// ════════════════════════════════════════
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({
        success: false,
        message: 'Login karo pehle'
      });
    }

    if (req.employee.role === 'super_admin') {
      return next();
    }

    if (!roles.includes(req.employee.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// ════════════════════════════════════════
// 6. COMPANY SCOPE
// ════════════════════════════════════════
const companyScope = (req, res, next) => {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: 'Login karo pehle'
    });
  }

  if (req.employee.role === 'super_admin') {
    req.companyFilter = req.query.company_id 
      ? { company_id: req.query.company_id } 
      : {};
  } 
  else {
    req.companyFilter = { 
      company_id: req.employee.company_id?._id || req.employee.company_id 
    };
  }

  next();
};

// ════════════════════════════════════════
// 7. SAME COMPANY CHECK
// ════════════════════════════════════════
const sameCompany = async (req, res, next) => {
  try {
    if (req.employee.role === 'super_admin') return next();

    const targetUser = await Employee.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User nahi mila'
      });
    }

    const myCompanyId = req.employee.company_id?._id?.toString() 
                     || req.employee.company_id?.toString();
    const targetCompanyId = targetUser.company_id?.toString();

    if (myCompanyId !== targetCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Doosri company ke user ko access nahi kar sakte'
      });
    }

    req.targetUser = targetUser;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = { 
  protect, 
  adminOnly,
  superAdminOnly,
  managerOnly,
  authorize,
  companyScope,
  sameCompany,
};
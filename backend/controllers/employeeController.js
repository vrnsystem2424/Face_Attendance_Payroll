const Employee = require('../models/Employee');

// ════════════════════════════════════════════
// GET ALL EMPLOYEES — Company filtered
// ════════════════════════════════════════════
const getAllEmployees = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (req.employee.role !== 'super_admin') {
      filter.company_id = req.employee.company_id?._id || req.employee.company_id;
    }

    if (status) filter.status = status;
    filter.role = { $ne: 'super_admin' };

    const employees = await Employee.find(filter)
      .populate('company_id', 'name code')
      .select('-password -face_encoding -all_encodings')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.log('getAllEmployees error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// GET MY DETAILS
// ════════════════════════════════════════════
const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id)
      .populate('company_id', 'name code')
      .select('-password -face_encoding -all_encodings');

    return res.status(200).json({ success: true, data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// APPROVE EMPLOYEE — with Manager + Salary
// ════════════════════════════════════════════
const approveEmployee = async (req, res) => {
  try {
    const { leave_approval_manager, monthly_salary } = req.body;

    console.log('📥 Approve Request:', {
      empId: req.params.id,
      body: req.body,
    });

    const targetEmployee = await Employee.findById(req.params.id);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Employee nahi mila' });
    }

    // Company check
    if (req.employee.role !== 'super_admin') {
      const myCompanyId = req.employee.company_id?._id?.toString()
                       || req.employee.company_id?.toString();
      const targetCompanyId = targetEmployee.company_id?.toString();
      if (myCompanyId !== targetCompanyId) {
        return res.status(403).json({
          success: false,
          message: 'Doosri company ke employee ko approve nahi kar sakte',
        });
      }
    }

    // Validate salary
    const salary = Number(monthly_salary) || 0;
    if (salary < 0) {
      return res.status(400).json({
        success: false,
        message: 'Salary negative nahi ho sakti',
      });
    }

    const updateData = {
      status: 'approved',
      leave_approval_manager: leave_approval_manager || '',
      monthly_salary: salary,
    };

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after' }
    )
      .populate('company_id', 'name code')
      .select('-password -face_encoding -all_encodings');

    console.log('✅ APPROVED:', {
      name: employee.name,
      manager: employee.leave_approval_manager,
      salary: employee.monthly_salary,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee approve ho gaya',
      data: employee,
    });
  } catch (error) {
    console.log('❌ approveEmployee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════════
// UPDATE SALARY (for already-approved employees)
// ════════════════════════════════════════════
const updateSalary = async (req, res) => {
  try {
    const { monthly_salary } = req.body;

    if (monthly_salary === undefined || monthly_salary === null || Number(monthly_salary) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid salary required',
      });
    }

    const targetEmployee = await Employee.findById(req.params.id);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Employee nahi mila' });
    }

    // Company check
    if (req.employee.role !== 'super_admin') {
      const myCompanyId = req.employee.company_id?._id?.toString()
                       || req.employee.company_id?.toString();
      const targetCompanyId = targetEmployee.company_id?.toString();
      if (myCompanyId !== targetCompanyId) {
        return res.status(403).json({
          success: false,
          message: 'Doosri company ke employee ko update nahi kar sakte',
        });
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { monthly_salary: Number(monthly_salary) },
      { returnDocument: 'after' }
    )
      .populate('company_id', 'name code')
      .select('-password -face_encoding -all_encodings');

    console.log('💰 Salary Updated:', {
      name: employee.name,
      salary: employee.monthly_salary,
    });

    return res.status(200).json({
      success: true,
      message: 'Salary update ho gayi',
      data: employee,
    });
  } catch (error) {
    console.log('❌ updateSalary error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// REJECT EMPLOYEE
// ════════════════════════════════════════════
const rejectEmployee = async (req, res) => {
  try {
    const targetEmployee = await Employee.findById(req.params.id);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Employee nahi mila' });
    }

    if (req.employee.role !== 'super_admin') {
      const myCompanyId = req.employee.company_id?._id?.toString()
                       || req.employee.company_id?.toString();
      const targetCompanyId = targetEmployee.company_id?.toString();
      if (myCompanyId !== targetCompanyId) {
        return res.status(403).json({
          success: false,
          message: 'Doosri company ke employee ko reject nahi kar sakte',
        });
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { returnDocument: 'after' }
    )
      .populate('company_id', 'name code')
      .select('-password -face_encoding -all_encodings');

    return res.status(200).json({
      success: true,
      message: 'Employee reject ho gaya',
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// UPDATE PROFILE
// ════════════════════════════════════════════
const updateEmployee = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.employee._id,
      { name, phone },
      { returnDocument: 'after' }
    ).select('-password -face_encoding -all_encodings');

    return res.status(200).json({
      success: true,
      message: 'Profile update ho gayi',
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// FACE REGISTER
// ════════════════════════════════════════════
const registerFace = async (req, res) => {
  try {
    const { face_encoding, all_encodings, capture_count } = req.body;

    if (!face_encoding || face_encoding.length === 0) {
      return res.status(400).json({ success: false, message: 'Face encoding nahi mili' });
    }

    const updateData = {
      face_encoding,
      face_registered: true,
    };

    if (all_encodings && Array.isArray(all_encodings) && all_encodings.length > 0) {
      updateData.all_encodings = all_encodings;
      updateData.face_capture_count = capture_count || all_encodings.length;
    }

    await Employee.findByIdAndUpdate(req.employee._id, updateData);

    const msg = all_encodings
      ? `Face registered with ${all_encodings.length} captures!`
      : 'Face registered!';

    return res.status(200).json({ success: true, message: msg });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// DELETE EMPLOYEE
// ════════════════════════════════════════════
const deleteEmployee = async (req, res) => {
  try {
    const targetEmployee = await Employee.findById(req.params.id);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Employee nahi mila' });
    }

    if (req.employee.role !== 'super_admin') {
      const myCompanyId = req.employee.company_id?._id?.toString()
                       || req.employee.company_id?.toString();
      const targetCompanyId = targetEmployee.company_id?.toString();
      if (myCompanyId !== targetCompanyId) {
        return res.status(403).json({
          success: false,
          message: 'Doosri company ke employee ko delete nahi kar sakte',
        });
      }
    }

    await Employee.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Employee delete ho gaya' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// FACE ENCODINGS (company filtered)
// ════════════════════════════════════════════
const getAllFaceEncodings = async (req, res) => {
  try {
    let filter = {
      status: 'approved',
      face_registered: true,
    };

    if (req.employee.role !== 'super_admin') {
      filter.company_id = req.employee.company_id?._id || req.employee.company_id;
    }

    const employees = await Employee.find(filter)
      .select('name emp_code face_encoding all_encodings company_id');

    return res.status(200).json({ success: true, data: employees });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllEmployees,
  getEmployee,
  updateEmployee,
  approveEmployee,
  rejectEmployee,
  registerFace,
  deleteEmployee,
  getAllFaceEncodings,
  updateSalary,   // 🆕
};
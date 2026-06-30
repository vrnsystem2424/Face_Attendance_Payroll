const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { deleteSelfie } = require('../utils/cloudinary');

// ════════════════════════════════════════════
// GET ALL EMPLOYEES
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
    return res.status(500).json({ success: false, message: 'Server error' });
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
// APPROVE EMPLOYEE
// ════════════════════════════════════════════
const approveEmployee = async (req, res) => {
  try {
    const { leave_approval_manager, monthly_salary } = req.body;

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
          message: 'Doosri company ke employee ko approve nahi kar sakte',
        });
      }
    }

    const salary = Number(monthly_salary) || 0;
    if (salary < 0) {
      return res.status(400).json({ success: false, message: 'Salary negative nahi ho sakti' });
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

    return res.status(200).json({
      success: true,
      message: 'Employee approve ho gaya',
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// UPDATE SALARY
// ════════════════════════════════════════════
const updateSalary = async (req, res) => {
  try {
    const { monthly_salary } = req.body;

    if (monthly_salary === undefined || monthly_salary === null || Number(monthly_salary) < 0) {
      return res.status(400).json({ success: false, message: 'Valid salary required' });
    }

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

    return res.status(200).json({
      success: true,
      message: 'Salary update ho gayi',
      data: employee,
    });
  } catch (error) {
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
// 🆕 GET DELETE PREVIEW (Count records before delete)
// ════════════════════════════════════════════
const getDeletePreview = async (req, res) => {
  try {
    const targetEmployee = await Employee.findById(req.params.id);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Employee nahi mila' });
    }

    if (targetEmployee.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin delete nahi kar sakte',
      });
    }

    if (targetEmployee._id.toString() === req.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Khud ko delete nahi kar sakte',
      });
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

    const attendanceCount = await Attendance.countDocuments({ emp_id: req.params.id });
    const leaveCount = await Leave.countDocuments({ emp_id: req.params.id });
    
    // Count photos
    const attendanceWithPhotos = await Attendance.find({
      emp_id: req.params.id,
      $or: [
        { in_selfie_public_id: { $exists: true, $ne: null } },
        { out_selfie_public_id: { $exists: true, $ne: null } },
      ],
    });
    
    let photoCount = 0;
    attendanceWithPhotos.forEach(a => {
      if (a.in_selfie_public_id) photoCount++;
      if (a.out_selfie_public_id) photoCount++;
    });

    return res.status(200).json({
      success: true,
      data: {
        employee: {
          _id: targetEmployee._id,
          name: targetEmployee.name,
          emp_code: targetEmployee.emp_code,
          email: targetEmployee.email,
          department: targetEmployee.department,
          role: targetEmployee.role,
        },
        counts: {
          attendance_records: attendanceCount,
          leave_records: leaveCount,
          photos: photoCount,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// 🆕 DELETE EMPLOYEE (Cascade Delete)
// ════════════════════════════════════════════
const deleteEmployee = async (req, res) => {
  try {
    const targetEmployee = await Employee.findById(req.params.id);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Employee nahi mila' });
    }

    // Super admin cannot be deleted
    if (targetEmployee.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin delete nahi kar sakte',
      });
    }

    // Cannot delete yourself
    if (targetEmployee._id.toString() === req.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Khud ko delete nahi kar sakte',
      });
    }

    // Company check (admin can only delete same company)
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

      // Admin cannot delete other admins
      if (targetEmployee.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin ko sirf Super Admin delete kar sakte hain',
        });
      }
    }

    console.log(`🗑️  Deleting employee: ${targetEmployee.name} (${targetEmployee.emp_code})`);

    // ── Step 1: Delete Cloudinary photos ──
    const attendanceWithPhotos = await Attendance.find({
      emp_id: req.params.id,
      $or: [
        { in_selfie_public_id: { $exists: true, $ne: null } },
        { out_selfie_public_id: { $exists: true, $ne: null } },
      ],
    });

    let deletedPhotos = 0;
    for (const att of attendanceWithPhotos) {
      if (att.in_selfie_public_id) {
        await deleteSelfie(att.in_selfie_public_id);
        deletedPhotos++;
      }
      if (att.out_selfie_public_id) {
        await deleteSelfie(att.out_selfie_public_id);
        deletedPhotos++;
      }
    }
    console.log(`📸 Deleted ${deletedPhotos} photos from Cloudinary`);

    // ── Step 2: Delete attendance records ──
    const attendanceResult = await Attendance.deleteMany({ emp_id: req.params.id });
    console.log(`📊 Deleted ${attendanceResult.deletedCount} attendance records`);

    // ── Step 3: Delete leave records ──
    const leaveResult = await Leave.deleteMany({ emp_id: req.params.id });
    console.log(`📋 Deleted ${leaveResult.deletedCount} leave records`);

    // ── Step 4: Delete leave balance (if exists) ──
    try {
      const LeaveBalance = require('../models/LeaveBalance');
      await LeaveBalance.deleteMany({ emp_id: req.params.id });
      console.log(`💰 Deleted leave balance`);
    } catch (err) {
      console.log('Leave balance model not found, skipping');
    }

    // ── Step 5: Finally delete employee ──
    await Employee.findByIdAndDelete(req.params.id);
    console.log(`✅ Employee deleted: ${targetEmployee.name}`);

    return res.status(200).json({
      success: true,
      message: `${targetEmployee.name} aur unka saara data delete ho gaya`,
      deleted: {
        employee: targetEmployee.name,
        attendance_records: attendanceResult.deletedCount,
        leave_records: leaveResult.deletedCount,
        photos: deletedPhotos,
      },
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// FACE ENCODINGS
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
  getDeletePreview,  // 🆕
  getAllFaceEncodings,
  updateSalary,
};
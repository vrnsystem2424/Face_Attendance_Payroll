// controllers/faceController.js
const Employee = require('../models/Employee');

// ── Register Face ──
const registerFace = async (req, res) => {
  try {
    const { encoding, all_encodings, capture_count } = req.body;

    if (!encoding || !Array.isArray(encoding) || encoding.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Face encoding nahi mili',
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.employee._id,
      {
        face_registered: true,
        face_encoding: encoding,
        all_encodings: all_encodings || [],
        face_capture_count: capture_count || 1,
        face_registered_at: new Date(),
      },
      { new: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee nahi mila',
      });
    }

    console.log(`✅ Face registered: ${employee.name}`);

    return res.status(200).json({
      success: true,
      message: 'Face successfully register ho gaya!',
      data: {
        id: employee._id,
        name: employee.name,
        emp_code: employee.emp_code,
        face_registered: employee.face_registered,
        face_capture_count: employee.face_capture_count,
      },
    });

  } catch (error) {
    console.error('Face register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ── Get All Face Encodings ──
const getAllFaceEncodings = async (req, res) => {
  try {
    const employees = await Employee.find({
      company_id: req.employee.company_id,
      face_registered: true,
      status: 'approved',
    }).select('name emp_code face_encoding all_encodings department designation');

    const data = employees.map(emp => ({
      id: emp._id,
      name: emp.name,
      emp_code: emp.emp_code,
      department: emp.department,
      designation: emp.designation,
      face_encoding: emp.face_encoding || [],
      all_encodings: emp.all_encodings || [],
    }));

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  registerFace,
  getAllFaceEncodings,
};
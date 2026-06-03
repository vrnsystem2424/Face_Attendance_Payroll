// controllers/monthlySettingsController.js

const MonthlySettings = require('../models/MonthlySettings');

// ════════════════════════════════════════
// GET MONTHLY SETTINGS (for specific month)
// ════════════════════════════════════════
const getMonthlySettings = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year required'
      });
    }

    // Get company_id from user
    const company_id = req.employee.role === 'super_admin'
      ? req.query.company_id
      : (req.employee.company_id?._id || req.employee.company_id);

    let settings = await MonthlySettings.findOne({
      company_id,
      month: parseInt(month),
      year: parseInt(year),
    });

    // If not found, return defaults
    if (!settings) {
      return res.json({
        success: true,
        data: {
          month: parseInt(month),
          year: parseInt(year),
          company_id,
          required_hours: 240,
          daily_hours: 8,
          holidays: [],
          weekly_off: ['Sunday'],
          is_default: true,
        }
      });
    }

    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// CREATE OR UPDATE MONTHLY SETTINGS (Admin)
// ════════════════════════════════════════
const upsertMonthlySettings = async (req, res) => {
  try {
    const {
      month,
      year,
      required_hours,
      daily_hours,
      holidays,
      weekly_off,
    } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year required'
      });
    }

    const company_id = req.employee.role === 'super_admin'
      ? req.body.company_id
      : (req.employee.company_id?._id || req.employee.company_id);

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'Company required'
      });
    }

    const settings = await MonthlySettings.findOneAndUpdate(
      { company_id, month: parseInt(month), year: parseInt(year) },
      {
        company_id,
        month: parseInt(month),
        year: parseInt(year),
        required_hours: required_hours || 240,
        daily_hours: daily_hours || 8,
        holidays: holidays || [],
        weekly_off: weekly_off || ['Sunday'],
        created_by: req.employee._id,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Monthly settings saved',
      data: settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// ADD HOLIDAY
// ════════════════════════════════════════
const addHoliday = async (req, res) => {
  try {
    const { month, year, date, name } = req.body;

    const company_id = req.employee.role === 'super_admin'
      ? req.body.company_id
      : (req.employee.company_id?._id || req.employee.company_id);

    let settings = await MonthlySettings.findOne({
      company_id,
      month: parseInt(month),
      year: parseInt(year),
    });

    if (!settings) {
      settings = await MonthlySettings.create({
        company_id,
        month: parseInt(month),
        year: parseInt(year),
        holidays: [{ date, name }],
        created_by: req.employee._id,
      });
    } else {
      // Check duplicate
      const exists = settings.holidays.some(h => h.date === date);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Holiday already exists for this date'
        });
      }
      settings.holidays.push({ date, name });
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Holiday added',
      data: settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// REMOVE HOLIDAY
// ════════════════════════════════════════
const removeHoliday = async (req, res) => {
  try {
    const { month, year, date } = req.body;

    const company_id = req.employee.role === 'super_admin'
      ? req.body.company_id
      : (req.employee.company_id?._id || req.employee.company_id);

    const settings = await MonthlySettings.findOne({
      company_id,
      month: parseInt(month),
      year: parseInt(year),
    });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    settings.holidays = settings.holidays.filter(h => h.date !== date);
    await settings.save();

    res.json({
      success: true,
      message: 'Holiday removed',
      data: settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// GET ALL MONTHLY SETTINGS (Admin overview)
// ════════════════════════════════════════
const getAllSettings = async (req, res) => {
  try {
    const company_id = req.employee.role === 'super_admin'
      ? (req.query.company_id || null)
      : (req.employee.company_id?._id || req.employee.company_id);

    const filter = company_id ? { company_id } : {};

    const settings = await MonthlySettings.find(filter)
      .sort({ year: -1, month: -1 })
      .populate('company_id', 'name code');

    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMonthlySettings,
  upsertMonthlySettings,
  addHoliday,
  removeHoliday,
  getAllSettings,
};
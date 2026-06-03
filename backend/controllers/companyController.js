// controllers/companyController.js

const Company = require('../models/Company');
const Employee = require('../models/Employee');

// ── GET ALL COMPANIES (public — for register dropdown) ──
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ active: true })
      .select('name code _id')
      .sort({ name: 1 });
    res.json({ success: true, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET COMPANY BY ID ──
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company nahi mili' });
    }
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CREATE COMPANY (super admin only) ──
const createCompany = async (req, res) => {
  try {
    const { name, code, address } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name aur code zaroori hai' });
    }

    const exists = await Company.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Company code already exists' });
    }

    const company = await Company.create({
      name,
      code: code.toUpperCase(),
      address: address || '',
    });

    res.status(201).json({
      success: true,
      data: company,
      message: 'Company create ho gayi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE COMPANY ──
const updateCompany = async (req, res) => {
  try {
    const { name, address, active } = req.body;

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { name, address, active },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company nahi mili' });
    }

    res.json({ success: true, data: company, message: 'Company update ho gayi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE COMPANY (soft delete) ──
const deleteCompany = async (req, res) => {
  try {
    // Check if company has employees
    const empCount = await Employee.countDocuments({ company_id: req.params.id });
    if (empCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Pehle ${empCount} employees ko transfer/delete karo`
      });
    }

    await Company.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true, message: 'Company deactivate ho gayi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── COMPANY STATS (all companies with counts) ──
const getCompanyStats = async (req, res) => {
  try {
    const companies = await Company.find({ active: true });

    const stats = await Promise.all(
      companies.map(async (c) => {
        const totalEmp = await Employee.countDocuments({
          company_id: c._id,
          role: 'employee'
        });
        const pendingEmp = await Employee.countDocuments({
          company_id: c._id,
          status: 'pending'
        });
        const approvedEmp = await Employee.countDocuments({
          company_id: c._id,
          status: 'approved',
          role: 'employee'
        });
        const managers = await Employee.countDocuments({
          company_id: c._id,
          role: 'manager'
        });
        const admins = await Employee.countDocuments({
          company_id: c._id,
          role: 'admin'
        });

        return {
          _id: c._id,
          name: c.name,
          code: c.code,
          total_employees: totalEmp,
          approved_employees: approvedEmp,
          pending_approvals: pendingEmp,
          managers,
          admins,
        };
      })
    );

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
};
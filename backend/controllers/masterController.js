const MasterData = require('../models/MasterData');

// Sab Master Data
const getAllMasterData = async (req, res) => {
  try {
    const data = await MasterData.find({ is_active: true }).sort({ type: 1, value: 1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Type wise data (department, designation, manager)
const getByType = async (req, res) => {
  try {
    const data = await MasterData.find({ 
      type: req.params.type, 
      is_active: true 
    }).sort({ value: 1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Add Master Data
const addMasterData = async (req, res) => {
  try {
    const { type, value } = req.body;

    // Check duplicate
    const existing = await MasterData.findOne({ type, value });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Yeh already exist karta hai' });
    }

    const data = await MasterData.create({ type, value });
    return res.status(201).json({ success: true, message: 'Added successfully', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update Master Data
const updateMasterData = async (req, res) => {
  try {
    const data = await MasterData.findByIdAndUpdate(
      req.params.id,
      { value: req.body.value },
      { new: true }
    );
    if (!data) {
      return res.status(404).json({ success: false, message: 'Data nahi mila' });
    }
    return res.status(200).json({ success: true, message: 'Updated', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete Master Data
const deleteMasterData = async (req, res) => {
  try {
    await MasterData.findByIdAndUpdate(req.params.id, { is_active: false });
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getAllMasterData, getByType, addMasterData, updateMasterData, deleteMasterData };
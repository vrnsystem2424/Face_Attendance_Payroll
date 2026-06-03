const mongoose = require('mongoose');

const masterDataSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['department', 'designation', 'manager']
  },
  value: {
    type: String,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('MasterData', masterDataSchema);
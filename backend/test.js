require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const emp = await Employee.findOne({ name: /gourav/i }).select('name face_encoding all_encodings face_capture_count');
  console.log('Name:', emp.name);
  console.log('encoding length:', emp.face_encoding?.length);
  console.log('all_encodings count:', emp.all_encodings?.length);
  console.log('capture_count:', emp.face_capture_count);
  console.log('First 5 values:', emp.face_encoding?.slice(0,5));
  process.exit();
});
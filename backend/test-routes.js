// test-routes.js
require('dotenv').config();

console.log('═══════════════════════════════════');

// Test middleware
console.log('\n1. Middleware (auth.js):');
const mw = require('./middleware/auth');
console.log('   - protect:', typeof mw.protect);
console.log('   - adminOnly:', typeof mw.adminOnly);

// Test controller
console.log('\n2. Attendance Controller:');
const ctrl = require('./controllers/attendanceController');
console.log('   - markAttendance:', typeof ctrl.markAttendance);
console.log('   - getMyAttendance:', typeof ctrl.getMyAttendance);
console.log('   - getTodayAttendance:', typeof ctrl.getTodayAttendance);
console.log('   - getAllAttendance:', typeof ctrl.getAllAttendance);
console.log('   - markReceptionAttendance:', typeof ctrl.markReceptionAttendance);

// Test the actual routes file
console.log('\n3. Loading attendanceRoutes.js...');
try {
  require('./routes/attendanceRoutes');
  console.log('   ✓ Loaded successfully');
} catch (err) {
  console.log('   ❌ ERROR:', err.message);
}

console.log('\n═══════════════════════════════════');
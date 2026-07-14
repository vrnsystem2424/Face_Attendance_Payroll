
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const axios = require('axios');

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json({ limit: '20mb' }));
// app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// // ════════════════════════════════════════
// // HEALTH CHECK
// // ════════════════════════════════════════
// app.get('/health', (req, res) => {
//   res.json({ status: 'awake', time: new Date().toISOString() });
// });

// // ════════════════════════════════════════
// // EXISTING ROUTES
// // ════════════════════════════════════════
// const authRoutes = require('./routes/authRoutes');
// const employeeRoutes = require('./routes/employeeRoutes');
// const attendanceRoutes = require('./routes/attendanceRoutes');
// const leaveRoutes = require('./routes/leaveRoutes');
// const siteRoutes = require('./routes/siteRoutes');
// const masterRoutes = require('./routes/masterRoutes');

// // ════════════════════════════════════════
// // NEW ROUTES
// // ════════════════════════════════════════
// const companyRoutes = require('./routes/companyRoutes');
// const superAdminRoutes = require('./routes/superAdminRoutes');
// const managerRoutes = require('./routes/managerRoutes');
// const monthlySettingsRoutes = require('./routes/monthlySettingsRoutes');
// const leaveBalanceRoutes = require('./routes/leaveBalanceRoutes');
// const payrollRoutes = require('./routes/payrollRoutes');
// const faceRoutes = require('./routes/faceRoutes');

// // ════════════════════════════════════════
// // MOUNT ROUTES
// // ════════════════════════════════════════
// app.use('/api/auth', authRoutes);
// app.use('/api/employees', employeeRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/leaves', leaveRoutes);
// app.use('/api/sites', siteRoutes);
// app.use('/api/master', masterRoutes);
// app.use('/api/companies', companyRoutes);
// app.use('/api/super-admin', superAdminRoutes);
// app.use('/api/manager', managerRoutes);
// app.use('/api/monthly-settings', monthlySettingsRoutes);
// app.use('/api/leave-balance', leaveBalanceRoutes);
// app.use('/api/payroll', payrollRoutes);
// app.use('/api/face', faceRoutes);

// // ════════════════════════════════════════
// // ROOT ROUTE (API info)
// // ════════════════════════════════════════
// app.get('/', (req, res) => {
//   res.json({
//     message: 'Multi-Company Attendance API',
//     version: '2.0',
//     endpoints: {
//       auth: '/api/auth',
//       employees: '/api/employees',
//       attendance: '/api/attendance',
//       leaves: '/api/leaves',
//       sites: '/api/sites',
//       master: '/api/master',
//       companies: '/api/companies',
//       superAdmin: '/api/super-admin',
//       manager: '/api/manager',
//       payroll: '/api/payroll',
//     }
//   });
// });

// // ════════════════════════════════════════
// // 404 HANDLER
// // ════════════════════════════════════════
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route not found: ${req.method} ${req.originalUrl}`
//   });
// });

// // ════════════════════════════════════════
// // GLOBAL ERROR HANDLER
// // ════════════════════════════════════════
// app.use((err, req, res, next) => {
//   console.error('❌ Error:', err.message);
//   res.status(err.statusCode || 500).json({
//     success: false,
//     message: err.message || 'Server error',
//   });
// });

// // ════════════════════════════════════════
// // SELF-PING (keep alive on free hosting)
// // ════════════════════════════════════════
// const BACKEND_URL = process.env.BACKEND_URL ||
//                     `http://localhost:${process.env.PORT || 5000}`;

// setInterval(async () => {
//   try {
//     await axios.get(`${BACKEND_URL}/health`);
//     console.log('✅ Self ping - Server awake!');
//   } catch (error) {
//     console.log('❌ Self ping failed');
//   }
// }, 14 * 60 * 1000);

// // ════════════════════════════════════════
// // DATABASE + SERVER START
// // ════════════════════════════════════════
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => {
//     console.log('✅ MongoDB Connected!');

//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//       console.log(`
// ╔════════════════════════════════════════╗
// ║  🚀 Server Running on Port ${PORT}        ║
// ║  📡 ${BACKEND_URL}        
// ║  🏢 Multi-Company Attendance System    ║
// ╚════════════════════════════════════════╝
//       `);
//     });
//   })
//   .catch((err) => {
//     console.log('❌ MongoDB Error:', err);
//   });




const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();

// ════════════════════════════════════════
// 🆕 CORS - Production Setup with Frontend URL
// ════════════════════════════════════════
const allowedOrigins = [
  'http://localhost:5173',                                      // Local dev (Vite)
  'http://localhost:3000',                                      // Local dev (React)
  'https://face-attendance-payroll.vercel.app',                // 🎯 Vercel Frontend
  'https://attendance-backend-api.signaturesbuilders.com',     // Backend (self)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, health checks)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({ status: 'awake', time: new Date().toISOString() });
});

// ════════════════════════════════════════
// EXISTING ROUTES
// ════════════════════════════════════════
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const siteRoutes = require('./routes/siteRoutes');
const masterRoutes = require('./routes/masterRoutes');

// ════════════════════════════════════════
// NEW ROUTES
// ════════════════════════════════════════
const companyRoutes = require('./routes/companyRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const managerRoutes = require('./routes/managerRoutes');
const monthlySettingsRoutes = require('./routes/monthlySettingsRoutes');
const leaveBalanceRoutes = require('./routes/leaveBalanceRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const faceRoutes = require('./routes/faceRoutes');

// ════════════════════════════════════════
// MOUNT ROUTES
// ════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/monthly-settings', monthlySettingsRoutes);
app.use('/api/leave-balance', leaveBalanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/face', faceRoutes);

// ════════════════════════════════════════
// ROOT ROUTE (API info)
// ════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    message: 'Multi-Company Attendance API',
    version: '2.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      employees: '/api/employees',
      attendance: '/api/attendance',
      leaves: '/api/leaves',
      sites: '/api/sites',
      master: '/api/master',
      companies: '/api/companies',
      superAdmin: '/api/super-admin',
      manager: '/api/manager',
      payroll: '/api/payroll',
    }
  });
});

// ════════════════════════════════════════
// 404 HANDLER
// ════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});

// ════════════════════════════════════════
// SELF-PING (keep alive on free hosting)
// ════════════════════════════════════════
const BACKEND_URL = process.env.BACKEND_URL ||
                    `http://localhost:${process.env.PORT || 5000}`;

setInterval(async () => {
  try {
    await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Self ping - Server awake!');
  } catch (error) {
    console.log('❌ Self ping failed');
  }
}, 14 * 60 * 1000);

// ════════════════════════════════════════
// DATABASE + SERVER START
// ════════════════════════════════════════
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected!');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  🚀 Server Running on Port ${PORT}        ║
║  📡 ${BACKEND_URL}        
║  🏢 Multi-Company Attendance System    ║
╚════════════════════════════════════════╝
      `);
    });
  })
  .catch((err) => {
    console.log('❌ MongoDB Error:', err);
  });
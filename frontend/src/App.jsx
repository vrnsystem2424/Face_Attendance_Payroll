import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ManagerRoute from './components/ManagerRoute';
import SuperAdminRoute from './components/SuperAdminRoute';

import Navbar from './components/Navbar';

// ── Public Pages ──
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';


// ── Employee Pages ──
import EmployeeDashboard from './pages/EmployeeDashboard';
import FaceRegister from './pages/FaceRegister';
import Attendance from './pages/Attendance';
import LeaveForm from './pages/LeaveForm';
import MyRecords from './pages/MyRecords';

// ── Admin Pages ──
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import AttendanceList from './pages/admin/AttendanceList';
import LeaveList from './pages/admin/LeaveList';
import Sites from './pages/admin/Sites';
import MasterData from './pages/admin/MasterData';
import ReceptionMode from './pages/admin/ReceptionMode';
import MonthlySettings from './pages/admin/MonthlySettings';

// ── Super Admin Pages ──
import SuperAdminLogin from './pages/super-admin/SuperAdminLogin';
import SuperDashboard from './pages/super-admin/SuperDashboard';
import Companies from './pages/super-admin/Companies';
import ManageAdmins from './pages/super-admin/ManageAdmins';
import PayrollReports from './pages/super-admin/PayrollReports';
import AllLeaves from './pages/super-admin/AllLeaves';
import AllEmployees from './pages/super-admin/AllEmployees';
import AllAttendance from './pages/super-admin/AllAttendance';  // 🆕
import SuperAdminSites from './pages/super-admin/Sites';
import SuperAdminMonthlySettings from './pages/super-admin/MonthlySettings';
import FixAttendance from './pages/super-admin/FixAttendance';
import LeaveAdjustments from './pages/super-admin/LeaveAdjustments';

// ── Manager Pages ──
import ManagerDashboard from './pages/manager/ManagerDashboard';
import PendingLeaves from './pages/manager/PendingLeaves';

// ════════════════════════════════════════════════════════════
// FACE REGISTER WRAPPER
// ════════════════════════════════════════════════════════════
const FaceRegisterWrapper = () => {
  const { user, token } = useSelector((state) => state.auth);

  console.log('👤 FaceRegisterWrapper:', {
    hasToken: !!token,
    hasUser: !!user,
    face_registered: user?.face_registered,
  });

  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/super-admin/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.face_registered) return <Navigate to="/attendance" replace />;

  return <FaceRegister />;
};

// ════════════════════════════════════════════════════════════
// APP
// ════════════════════════════════════════════════════════════
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>

        {/* DEFAULT REDIRECT */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* PUBLIC ROUTES */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/super-admin/leave-adjustments" element={<SuperAdminRoute><LeaveAdjustments /></SuperAdminRoute>} />



        {/* FACE REGISTER */}
        <Route path="/face-register" element={<FaceRegisterWrapper />} />

        {/* EMPLOYEE ROUTES */}
        <Route path="/dashboard" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/leave" element={<ProtectedRoute><LeaveForm /></ProtectedRoute>} />
        <Route path="/my-records" element={<ProtectedRoute><MyRecords /></ProtectedRoute>} />

        {/* MANAGER ROUTES */}
        <Route path="/manager/dashboard" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
        <Route path="/manager/leaves" element={<ManagerRoute><PendingLeaves /></ManagerRoute>} />

        {/* ADMIN ROUTES */}
        <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/employees" element={<AdminRoute><Employees /></AdminRoute>} />
        <Route path="/admin/attendance" element={<AdminRoute><AttendanceList /></AdminRoute>} />
        <Route path="/admin/leaves" element={<AdminRoute><LeaveList /></AdminRoute>} />
        <Route path="/admin/sites" element={<AdminRoute><Sites /></AdminRoute>} />
        <Route path="/admin/master-data" element={<AdminRoute><MasterData /></AdminRoute>} />
        <Route path="/admin/reception" element={<AdminRoute><ReceptionMode /></AdminRoute>} />
        <Route path="/admin/monthly-settings" element={<AdminRoute><MonthlySettings /></AdminRoute>} />

        {/* SUPER ADMIN ROUTES */}
        <Route path="/super-admin/dashboard" element={<SuperAdminRoute><SuperDashboard /></SuperAdminRoute>} />
        <Route path="/super-admin/companies" element={<SuperAdminRoute><Companies /></SuperAdminRoute>} />
        <Route path="/super-admin/admins" element={<SuperAdminRoute><ManageAdmins /></SuperAdminRoute>} />
        <Route path="/super-admin/payroll" element={<SuperAdminRoute><PayrollReports /></SuperAdminRoute>} />
        <Route path="/super-admin/leaves" element={<SuperAdminRoute><AllLeaves /></SuperAdminRoute>} />
        <Route path="/super-admin/employees" element={<SuperAdminRoute><AllEmployees /></SuperAdminRoute>} />
        <Route path="/super-admin/attendance" element={<SuperAdminRoute><AllAttendance /></SuperAdminRoute>} />  {/* 🆕 */}
        <Route path="/super-admin/sites" element={<SuperAdminRoute><SuperAdminSites /></SuperAdminRoute>} />
        <Route path="/super-admin/monthly-settings" element={<SuperAdminRoute><SuperAdminMonthlySettings /></SuperAdminRoute>} />
<Route path="/super-admin/fix-attendance" element={<SuperAdminRoute><FixAttendance /></SuperAdminRoute>} />

        {/* 404 FALLBACK */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
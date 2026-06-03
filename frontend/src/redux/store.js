import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import employeeReducer from './slices/employeeSlice';
import attendanceReducer from './slices/attendanceSlice';
import leaveReducer from './slices/leaveSlice';
import faceReducer from './slices/faceSlice';
import siteReducer from './slices/siteSlice';
import masterReducer from './slices/masterSlice';
import companyReducer from './slices/companySlice';
import superAdminReducer from './slices/superAdminSlice';
import managerReducer from './slices/managerSlice';
import monthlySettingsReducer from './slices/monthlySettingsSlice';   // 🆕
import leaveBalanceReducer from './slices/leaveBalanceSlice';
import payrollReducer from './slices/payrollSlice';



const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer,
    attendance: attendanceReducer,
    leaves: leaveReducer,
    faces: faceReducer,
    sites: siteReducer,
    master: masterReducer,
    company: companyReducer,
    superAdmin: superAdminReducer,
    manager: managerReducer,
    monthlySettings: monthlySettingsReducer,   // 🆕
    leaveBalance: leaveBalanceReducer,  
    payroll: payrollReducer,     // 🆕
  },
});

export { store };
export default store;
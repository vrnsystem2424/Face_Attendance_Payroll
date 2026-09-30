import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

export const fetchGlobalStats = createAsyncThunk('superAdmin/fetchGlobalStats', async (_, { rejectWithValue }) => {
  try { const response = await API.get('/super-admin/stats'); return response.data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed'); }
});

export const fetchAllAdmins = createAsyncThunk('superAdmin/fetchAllAdmins', async (filters = {}, { rejectWithValue }) => {
  try { const params = new URLSearchParams(filters).toString(); const response = await API.get(`/super-admin/admins?${params}`); return response.data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed'); }
});

export const createAdmin = createAsyncThunk('superAdmin/createAdmin', async (data, { rejectWithValue }) => {
  try { const response = await API.post('/super-admin/admins', data); return response.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed'); }
});

export const deleteAdmin = createAsyncThunk('superAdmin/deleteAdmin', async (id, { rejectWithValue }) => {
  try { await API.delete(`/super-admin/admins/${id}`); return id; }
  catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed'); }
});

export const fetchAllEmployeesGlobal = createAsyncThunk('superAdmin/fetchAllEmployees', async (filters = {}, { rejectWithValue }) => {
  try { const params = new URLSearchParams(filters).toString(); const response = await API.get(`/super-admin/employees?${params}`); return response.data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed'); }
});

export const promoteToManager = createAsyncThunk('superAdmin/promoteToManager', async (id, { rejectWithValue }) => {
  try { const response = await API.put(`/super-admin/promote/${id}`); return response.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed'); }
});

export const demoteToEmployee = createAsyncThunk('superAdmin/demoteToEmployee', async (id, { rejectWithValue }) => {
  try { const response = await API.put(`/super-admin/demote/${id}`); return response.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed'); }
});

export const fetchAllAttendanceGlobal = createAsyncThunk('superAdmin/fetchAllAttendanceGlobal', async (filters = {}, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.emp_code) params.append('emp_code', filters.emp_code);
    if (filters.company_id) params.append('company_id', filters.company_id);
    if (filters.flagged) params.append('flagged', filters.flagged);
    if (filters.location_status) params.append('location_status', filters.location_status);

    const response = await API.get(`/super-admin/all-attendance?${params.toString()}`);
    return response.data.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed to load attendance'); }
});

// ── 🆕 FETCH LIVE AUDIT DATA FOR WEB TABLE ──
export const fetchEmployeeAuditData = createAsyncThunk(
  'superAdmin/fetchEmployeeAuditData',
  async ({ employee_id, start_date, end_date }, { rejectWithValue }) => {
    try {
      const response = await API.get('/super-admin/employee-report-data', {
        params: { employee_id, start_date, end_date },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audit records');
    }
  }
);

// ── 🆕 VIEW/DOWNLOAD PDF REPORT ──
export const downloadEmployeeDetailedReport = createAsyncThunk(
  'superAdmin/downloadEmployeeDetailedReport',
  async ({ employee_id, start_date, end_date, employee_name, view_mode = 'download' }, { rejectWithValue }) => {
    try {
      const response = await API.get('/super-admin/employee-report-pdf', {
        params: { employee_id, start_date, end_date, view_mode },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      if (view_mode === 'inline') {
        // Open PDF in a new browser tab for viewing
        window.open(url, '_blank');
      } else {
        // Trigger file download
        const link = document.createElement('a');
        link.href = url;
        const safeName = (employee_name || 'Employee').replace(/\s+/g, '_');
        link.setAttribute('download', `GPS_Audit_${safeName}_${start_date}_to_${end_date}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'PDF Generation failed');
    }
  }
);

export const resetUserPassword = createAsyncThunk('superAdmin/resetUserPassword', async ({ user_id, new_password }, { rejectWithValue }) => {
  try { const response = await API.post('/super-admin/reset-password', { user_id, new_password }); return response.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || 'Password reset failed'); }
});

export const changeOwnPassword = createAsyncThunk('superAdmin/changeOwnPassword', async ({ current_password, new_password }, { rejectWithValue }) => {
  try { const response = await API.post('/super-admin/change-own-password', { current_password, new_password }); return response.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || 'Password change failed'); }
});

const superAdminSlice = createSlice({
  name: 'superAdmin',
  initialState: {
    stats: null,
    admins: [],
    allEmployees: [],
    allAttendance: [],
    auditReportData: null, // 🆕 Live preview data
    loading: false,
    auditLoading: false,
    downloadingReport: false,
    error: null,
    message: null,
    passwordLoading: false,
    passwordMessage: null,
    passwordError: null,
  },
  reducers: {
    clearSuperAdminError: (state) => { state.error = null; },
    clearSuperAdminMessage: (state) => { state.message = null; },
    clearPasswordMessage: (state) => { state.passwordMessage = null; state.passwordError = null; },
    clearAuditReportData: (state) => { state.auditReportData = null; }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchGlobalStats.fulfilled, (state, action) => { state.stats = action.payload; });
    builder.addCase(fetchAllAdmins.pending, (state) => { state.loading = true; })
           .addCase(fetchAllAdmins.fulfilled, (state, action) => { state.loading = false; state.admins = action.payload; });
    builder.addCase(createAdmin.fulfilled, (state, action) => { state.message = action.payload.message; })
           .addCase(createAdmin.rejected, (state, action) => { state.error = action.payload; });
    builder.addCase(deleteAdmin.fulfilled, (state, action) => {
      state.admins = state.admins.filter(a => a._id !== action.payload);
      state.message = 'Admin deleted';
    });
    builder.addCase(fetchAllEmployeesGlobal.pending, (state) => { state.loading = true; })
           .addCase(fetchAllEmployeesGlobal.fulfilled, (state, action) => { state.loading = false; state.allEmployees = action.payload; });

    builder.addCase(fetchAllAttendanceGlobal.pending, (state) => { state.loading = true; state.error = null; })
           .addCase(fetchAllAttendanceGlobal.fulfilled, (state, action) => { state.loading = false; state.allAttendance = action.payload; })
           .addCase(fetchAllAttendanceGlobal.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.allAttendance = []; });

    // 🆕 Live Audit Data Extra Reducers
    builder.addCase(fetchEmployeeAuditData.pending, (state) => { state.auditLoading = true; state.error = null; })
           .addCase(fetchEmployeeAuditData.fulfilled, (state, action) => { state.auditLoading = false; state.auditReportData = action.payload; })
           .addCase(fetchEmployeeAuditData.rejected, (state, action) => { state.auditLoading = false; state.error = action.payload; state.auditReportData = null; });

    // Download / View PDF
    builder.addCase(downloadEmployeeDetailedReport.pending, (state) => { state.downloadingReport = true; state.error = null; })
           .addCase(downloadEmployeeDetailedReport.fulfilled, (state) => { state.downloadingReport = false; })
           .addCase(downloadEmployeeDetailedReport.rejected, (state, action) => { state.downloadingReport = false; state.error = action.payload; });

    builder.addCase(resetUserPassword.pending, (state) => { state.passwordLoading = true; })
           .addCase(resetUserPassword.fulfilled, (state, action) => { state.passwordLoading = false; state.passwordMessage = action.payload.message; })
           .addCase(resetUserPassword.rejected, (state, action) => { state.passwordLoading = false; state.passwordError = action.payload; });

    builder.addCase(changeOwnPassword.pending, (state) => { state.passwordLoading = true; })
           .addCase(changeOwnPassword.fulfilled, (state, action) => { state.passwordLoading = false; state.passwordMessage = action.payload.message; })
           .addCase(changeOwnPassword.rejected, (state, action) => { state.passwordLoading = false; state.passwordError = action.payload; });
  },
});

export const { clearSuperAdminError, clearSuperAdminMessage, clearPasswordMessage, clearAuditReportData } = superAdminSlice.actions;
export default superAdminSlice.reducer;
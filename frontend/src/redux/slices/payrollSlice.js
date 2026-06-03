// src/redux/slices/payrollSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ════════════════════════════════════════════
// FETCH PAYROLL DATA
// ════════════════════════════════════════════
export const fetchCompanyPayroll = createAsyncThunk(
  'payroll/fetchCompanyPayroll',
  async ({ company_id, department, month, year }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (company_id) params.append('company_id', company_id);
      if (department) params.append('department', department);
      if (month) params.append('month', month);
      if (year) params.append('year', year);

      const response = await API.get(`/payroll/company?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payroll fetch failed');
    }
  }
);

// ════════════════════════════════════════════
// FETCH DEPARTMENTS (for filter dropdown)
// ════════════════════════════════════════════
export const fetchCompanyDepartments = createAsyncThunk(
  'payroll/fetchCompanyDepartments',
  async (company_id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/payroll/departments?company_id=${company_id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Departments fetch failed');
    }
  }
);

// ════════════════════════════════════════════
// DOWNLOAD PDF
// ════════════════════════════════════════════
export const downloadPayrollPDF = createAsyncThunk(
  'payroll/downloadPayrollPDF',
  async ({ company_id, department, month, year, company_name, month_name }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (company_id) params.append('company_id', company_id);
      if (department) params.append('department', department);
      if (month) params.append('month', month);
      if (year) params.append('year', year);

      const response = await API.get(`/payroll/download/pdf?${params.toString()}`, {
        responseType: 'blob',   // ✅ Binary data
      });

      // Create blob URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payroll_${company_name || 'Report'}_${month_name || ''}_${year || ''}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up
      setTimeout(() => window.URL.revokeObjectURL(url), 100);

      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'PDF download failed');
    }
  }
);

// ════════════════════════════════════════════
// SLICE
// ════════════════════════════════════════════
const payrollSlice = createSlice({
  name: 'payroll',
  initialState: {
    payrollData: null,
    departments: [],
    loading: false,
    downloading: false,
    error: null,
  },
  reducers: {
    clearPayrollData: (state) => {
      state.payrollData = null;
      state.error = null;
    },
    clearPayrollError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch payroll
    builder
      .addCase(fetchCompanyPayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.payrollData = action.payload;
      })
      .addCase(fetchCompanyPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch departments
    builder
      .addCase(fetchCompanyDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
      });

    // Download PDF
    builder
      .addCase(downloadPayrollPDF.pending, (state) => {
        state.downloading = true;
      })
      .addCase(downloadPayrollPDF.fulfilled, (state) => {
        state.downloading = false;
      })
      .addCase(downloadPayrollPDF.rejected, (state, action) => {
        state.downloading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPayrollData, clearPayrollError } = payrollSlice.actions;
export default payrollSlice.reducer;
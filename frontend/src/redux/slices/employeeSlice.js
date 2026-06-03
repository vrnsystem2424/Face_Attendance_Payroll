import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// Fetch Employees
export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (status, { rejectWithValue }) => {
    try {
      const url = status ? `/employees?status=${status}` : '/employees';
      const response = await API.get(url);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Employees load nahi hue');
    }
  }
);

// Approve Employee (with manager + salary)
export const approveEmployee = createAsyncThunk(
  'employees/approveEmployee',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/employees/approve/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Approve nahi hua');
    }
  }
);

// Reject Employee
export const rejectEmployee = createAsyncThunk(
  'employees/rejectEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.put(`/employees/reject/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Reject nahi hua');
    }
  }
);

// Delete Employee
export const deleteEmployee = createAsyncThunk(
  'employees/deleteEmployee',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/employees/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Delete nahi hua');
    }
  }
);

// 🆕 Update Salary
export const updateEmployeeSalary = createAsyncThunk(
  'employees/updateEmployeeSalary',
  async ({ id, monthly_salary }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/employees/salary/${id}`, { monthly_salary });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Salary update nahi hui');
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    employees: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearEmployeeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder.addCase(approveEmployee.fulfilled, (state, action) => {
      const index = state.employees.findIndex(e => e._id === action.payload._id);
      if (index !== -1) state.employees[index] = action.payload;
    });

    builder.addCase(rejectEmployee.fulfilled, (state, action) => {
      const index = state.employees.findIndex(e => e._id === action.payload._id);
      if (index !== -1) state.employees[index] = action.payload;
    });

    builder.addCase(deleteEmployee.fulfilled, (state, action) => {
      state.employees = state.employees.filter(e => e._id !== action.payload);
    });

    // 🆕 Salary update
    builder.addCase(updateEmployeeSalary.fulfilled, (state, action) => {
      const index = state.employees.findIndex(e => e._id === action.payload._id);
      if (index !== -1) state.employees[index] = action.payload;
    });
  },
});

export const { clearEmployeeError } = employeeSlice.actions;
export default employeeSlice.reducer;
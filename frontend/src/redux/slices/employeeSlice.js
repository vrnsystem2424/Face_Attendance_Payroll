// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../api/axios';

// // Fetch Employees
// export const fetchEmployees = createAsyncThunk(
//   'employees/fetchEmployees',
//   async (status, { rejectWithValue }) => {
//     try {
//       const url = status ? `/employees?status=${status}` : '/employees';
//       const response = await API.get(url);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Employees load nahi hue');
//     }
//   }
// );

// // Approve Employee
// export const approveEmployee = createAsyncThunk(
//   'employees/approveEmployee',
//   async ({ id, data }, { rejectWithValue }) => {
//     try {
//       const response = await API.put(`/employees/approve/${id}`, data);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Approve nahi hua');
//     }
//   }
// );

// // Reject Employee
// export const rejectEmployee = createAsyncThunk(
//   'employees/rejectEmployee',
//   async (id, { rejectWithValue }) => {
//     try {
//       const response = await API.put(`/employees/reject/${id}`);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Reject nahi hua');
//     }
//   }
// );

// // 🆕 Get Delete Preview
// export const getDeletePreview = createAsyncThunk(
//   'employees/getDeletePreview',
//   async (id, { rejectWithValue }) => {
//     try {
//       const response = await API.get(`/employees/delete-preview/${id}`);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Preview load nahi hua');
//     }
//   }
// );

// // Delete Employee
// export const deleteEmployee = createAsyncThunk(
//   'employees/deleteEmployee',
//   async (id, { rejectWithValue }) => {
//     try {
//       const response = await API.delete(`/employees/${id}`);
//       return { id, message: response.data.message, deleted: response.data.deleted };
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Delete nahi hua');
//     }
//   }
// );

// // Update Salary
// export const updateEmployeeSalary = createAsyncThunk(
//   'employees/updateEmployeeSalary',
//   async ({ id, monthly_salary }, { rejectWithValue }) => {
//     try {
//       const response = await API.put(`/employees/salary/${id}`, { monthly_salary });
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Salary update nahi hui');
//     }
//   }
// );

// const employeeSlice = createSlice({
//   name: 'employees',
//   initialState: {
//     employees: [],
//     deletePreview: null,  // 🆕
//     loading: false,
//     error: null,
//     message: null,
//   },
//   reducers: {
//     clearEmployeeError: (state) => { state.error = null; },
//     clearEmployeeMessage: (state) => { state.message = null; },
//     clearDeletePreview: (state) => { state.deletePreview = null; },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchEmployees.pending, (state) => { state.loading = true; })
//       .addCase(fetchEmployees.fulfilled, (state, action) => {
//         state.loading = false;
//         state.employees = action.payload;
//       })
//       .addCase(fetchEmployees.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });

//     builder.addCase(approveEmployee.fulfilled, (state, action) => {
//       const index = state.employees.findIndex(e => e._id === action.payload._id);
//       if (index !== -1) state.employees[index] = action.payload;
//     });

//     builder.addCase(rejectEmployee.fulfilled, (state, action) => {
//       const index = state.employees.findIndex(e => e._id === action.payload._id);
//       if (index !== -1) state.employees[index] = action.payload;
//     });

//     // 🆕 Delete Preview
//     builder.addCase(getDeletePreview.fulfilled, (state, action) => {
//       state.deletePreview = action.payload;
//     });

//     builder.addCase(deleteEmployee.fulfilled, (state, action) => {
//       state.employees = state.employees.filter(e => e._id !== action.payload.id);
//       state.message = action.payload.message;
//       state.deletePreview = null;
//     });
//     builder.addCase(deleteEmployee.rejected, (state, action) => {
//       state.error = action.payload;
//     });

//     builder.addCase(updateEmployeeSalary.fulfilled, (state, action) => {
//       const index = state.employees.findIndex(e => e._id === action.payload._id);
//       if (index !== -1) state.employees[index] = action.payload;
//     });
//   },
// });

// export const { clearEmployeeError, clearEmployeeMessage, clearDeletePreview } = employeeSlice.actions;
// export default employeeSlice.reducer;





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

// Approve Employee
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

// Get Delete Preview
export const getDeletePreview = createAsyncThunk(
  'employees/getDeletePreview',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/employees/delete-preview/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Preview load nahi hua');
    }
  }
);

// Delete Employee
export const deleteEmployee = createAsyncThunk(
  'employees/deleteEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/employees/${id}`);
      return { id, message: response.data.message, deleted: response.data.deleted };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Delete nahi hua');
    }
  }
);

// Update Salary
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

// ════════════════════════════════════════════
// 🆕 Update Designation
// ════════════════════════════════════════════
export const updateEmployeeDesignation = createAsyncThunk(
  'employees/updateEmployeeDesignation',
  async ({ id, designation }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/employees/designation/${id}`, { designation });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Designation update nahi hui');
    }
  }
);

// ════════════════════════════════════════════
// 🆕 Update Manager
// ════════════════════════════════════════════
export const updateEmployeeManager = createAsyncThunk(
  'employees/updateEmployeeManager',
  async ({ id, leave_approval_manager }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/employees/manager/${id}`, { leave_approval_manager });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Manager update nahi hua');
    }
  }
);

// ════════════════════════════════════════════
// SLICE
// ════════════════════════════════════════════
const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    employees: [],
    deletePreview: null,
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearEmployeeError: (state) => { state.error = null; },
    clearEmployeeMessage: (state) => { state.message = null; },
    clearDeletePreview: (state) => { state.deletePreview = null; },
  },
  extraReducers: (builder) => {

    // ── Fetch ──
    builder
      .addCase(fetchEmployees.pending, (state) => { state.loading = true; })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Approve ──
    builder.addCase(approveEmployee.fulfilled, (state, action) => {
      const index = state.employees.findIndex(e => e._id === action.payload._id);
      if (index !== -1) state.employees[index] = action.payload;
    });

    // ── Reject ──
    builder.addCase(rejectEmployee.fulfilled, (state, action) => {
      const index = state.employees.findIndex(e => e._id === action.payload._id);
      if (index !== -1) state.employees[index] = action.payload;
    });

    // ── Delete Preview ──
    builder.addCase(getDeletePreview.fulfilled, (state, action) => {
      state.deletePreview = action.payload;
    });

    // ── Delete ──
    builder
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter(e => e._id !== action.payload.id);
        state.message = action.payload.message;
        state.deletePreview = null;
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ── Update Salary ──
    builder.addCase(updateEmployeeSalary.fulfilled, (state, action) => {
      const index = state.employees.findIndex(e => e._id === action.payload._id);
      if (index !== -1) state.employees[index] = action.payload;
    });

    // ── 🆕 Update Designation ──
    builder
      .addCase(updateEmployeeDesignation.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateEmployeeDesignation.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.employees.findIndex(e => e._id === action.payload._id);
        if (index !== -1) state.employees[index] = action.payload;
      })
      .addCase(updateEmployeeDesignation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── 🆕 Update Manager ──
    builder
      .addCase(updateEmployeeManager.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateEmployeeManager.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.employees.findIndex(e => e._id === action.payload._id);
        if (index !== -1) state.employees[index] = action.payload;
      })
      .addCase(updateEmployeeManager.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearEmployeeError,
  clearEmployeeMessage,
  clearDeletePreview,
} = employeeSlice.actions;

export default employeeSlice.reducer;
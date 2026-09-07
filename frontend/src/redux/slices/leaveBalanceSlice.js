



// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../api/axios';

// // ── EMPLOYEE - Fetch My Balance ──
// export const fetchMyBalance = createAsyncThunk(
//   'leaveBalance/fetchMy',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await API.get('/leave-balance/my');
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // ── Admin/Manager - Fetch Employee Balance ──
// export const fetchEmployeeBalance = createAsyncThunk(
//   'leaveBalance/fetchEmployee',
//   async (empId, { rejectWithValue }) => {
//     try {
//       const response = await API.get(`/leave-balance/employee/${empId}`);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // ── 🆕 SUPER ADMIN - Get All Employees with Balance (With Month & Year filter) ──
// export const fetchAllEmployeesWithBalance = createAsyncThunk(
//   'leaveBalance/fetchAllWithBalance',
//   async (filters = {}, { rejectWithValue }) => {
//     try {
//       const params = new URLSearchParams();
//       if (filters.company_id) params.append('company_id', filters.company_id);
//       if (filters.search) params.append('search', filters.search);
//       if (filters.month) params.append('month', filters.month);
//       if (filters.year) params.append('year', filters.year);

//       const response = await API.get(`/leave-balance/all-with-balance?${params.toString()}`);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // ── SUPER ADMIN - Adjust Balance ──
// export const adjustLeaveBalance = createAsyncThunk(
//   'leaveBalance/adjust',
//   async (data, { rejectWithValue }) => {
//     try {
//       const response = await API.post('/leave-balance/adjust', data);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // ── SUPER ADMIN - Get Adjustment History ──
// export const fetchAdjustmentHistory = createAsyncThunk(
//   'leaveBalance/fetchHistory',
//   async (empId = null, { rejectWithValue }) => {
//     try {
//       const url = empId 
//         ? `/leave-balance/adjustment-history?emp_id=${empId}`
//         : '/leave-balance/adjustment-history';
//       const response = await API.get(url);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// const leaveBalanceSlice = createSlice({
//   name: 'leaveBalance',
//   initialState: {
//     myBalance: null,
//     employeeBalance: null,
//     allEmployeesWithBalance: [],
//     adjustmentHistory: [],
//     loading: false,
//     error: null,
//     message: null,
//   },
//   reducers: {
//     clearBalanceMessage: (state) => { state.message = null; },
//     clearBalanceError: (state) => { state.error = null; },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchMyBalance.fulfilled, (state, action) => {
//         state.myBalance = action.payload;
//       });

//     builder
//       .addCase(fetchEmployeeBalance.fulfilled, (state, action) => {
//         state.employeeBalance = action.payload;
//       });

//     builder
//       .addCase(fetchAllEmployeesWithBalance.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchAllEmployeesWithBalance.fulfilled, (state, action) => {
//         state.loading = false;
//         state.allEmployeesWithBalance = action.payload;
//       })
//       .addCase(fetchAllEmployeesWithBalance.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });

//     builder
//       .addCase(adjustLeaveBalance.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(adjustLeaveBalance.fulfilled, (state, action) => {
//         state.loading = false;
//         state.message = action.payload.message;
//       })
//       .addCase(adjustLeaveBalance.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });

//     builder
//       .addCase(fetchAdjustmentHistory.fulfilled, (state, action) => {
//         state.adjustmentHistory = action.payload;
//       });
//   },
// });

// export const { clearBalanceMessage, clearBalanceError } = leaveBalanceSlice.actions;
// export default leaveBalanceSlice.reducer;





import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── EMPLOYEE - Fetch My Balance ──
export const fetchMyBalance = createAsyncThunk(
  'leaveBalance/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/leave-balance/my');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── Admin/Manager - Fetch Employee Balance ──
export const fetchEmployeeBalance = createAsyncThunk(
  'leaveBalance/fetchEmployee',
  async (empId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/leave-balance/employee/${empId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── SUPER ADMIN - Get All Employees with Balance ──
export const fetchAllEmployeesWithBalance = createAsyncThunk(
  'leaveBalance/fetchAllWithBalance',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.company_id) params.append('company_id', filters.company_id);
      if (filters.search) params.append('search', filters.search);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);

      const response = await API.get(
        `/leave-balance/all-with-balance?${params.toString()}`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── SUPER ADMIN - Adjust Balance ──
export const adjustLeaveBalance = createAsyncThunk(
  'leaveBalance/adjust',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/leave-balance/adjust', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── SUPER ADMIN - Get Adjustment History ──
export const fetchAdjustmentHistory = createAsyncThunk(
  'leaveBalance/fetchHistory',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // support old style: string empId
      if (typeof filters === 'string' && filters) {
        params.append('emp_id', filters);
      } else if (filters && typeof filters === 'object') {
        if (filters.emp_id) params.append('emp_id', filters.emp_id);
        if (filters.company_id) params.append('company_id', filters.company_id);
        if (filters.search) params.append('search', filters.search);
      }

      const response = await API.get(
        `/leave-balance/adjustment-history?${params.toString()}`
      );
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

const leaveBalanceSlice = createSlice({
  name: 'leaveBalance',
  initialState: {
    myBalance: null,
    employeeBalance: null,
    allEmployeesWithBalance: [],
    adjustmentHistory: [],
    loading: false,
    historyLoading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearBalanceMessage: (state) => {
      state.message = null;
    },
    clearBalanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMyBalance.fulfilled, (state, action) => {
      state.myBalance = action.payload;
    });

    builder.addCase(fetchEmployeeBalance.fulfilled, (state, action) => {
      state.employeeBalance = action.payload;
    });

    builder
      .addCase(fetchAllEmployeesWithBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllEmployeesWithBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.allEmployeesWithBalance = action.payload || [];
      })
      .addCase(fetchAllEmployeesWithBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(adjustLeaveBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(adjustLeaveBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload?.message || 'Adjusted successfully';
      })
      .addCase(adjustLeaveBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchAdjustmentHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchAdjustmentHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.adjustmentHistory = action.payload || [];
      })
      .addCase(fetchAdjustmentHistory.rejected, (state) => {
        state.historyLoading = false;
        state.adjustmentHistory = [];
      });
  },
});

export const { clearBalanceMessage, clearBalanceError } =
  leaveBalanceSlice.actions;
export default leaveBalanceSlice.reducer;
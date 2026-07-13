// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../api/axios';

// // ── GLOBAL STATS ──
// export const fetchGlobalStats = createAsyncThunk(
//   'superAdmin/fetchGlobalStats',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await API.get('/super-admin/stats');
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // ── GET ALL ADMINS ──
// export const fetchAllAdmins = createAsyncThunk(
//   'superAdmin/fetchAllAdmins',
//   async (filters = {}, { rejectWithValue }) => {
//     try {
//       const params = new URLSearchParams(filters).toString();
//       const response = await API.get(`/super-admin/admins?${params}`);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // ── CREATE ADMIN ──
// export const createAdmin = createAsyncThunk(
//   'superAdmin/createAdmin',
//   async (data, { rejectWithValue }) => {
//     try {
//       const response = await API.post('/super-admin/admins', data);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // ── DELETE ADMIN ──
// export const deleteAdmin = createAsyncThunk(
//   'superAdmin/deleteAdmin',
//   async (id, { rejectWithValue }) => {
//     try {
//       await API.delete(`/super-admin/admins/${id}`);
//       return id;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // ── GET ALL EMPLOYEES (across companies) ──
// export const fetchAllEmployeesGlobal = createAsyncThunk(
//   'superAdmin/fetchAllEmployees',
//   async (filters = {}, { rejectWithValue }) => {
//     try {
//       const params = new URLSearchParams(filters).toString();
//       const response = await API.get(`/super-admin/employees?${params}`);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // ── PROMOTE TO MANAGER ──
// export const promoteToManager = createAsyncThunk(
//   'superAdmin/promoteToManager',
//   async (id, { rejectWithValue }) => {
//     try {
//       const response = await API.put(`/super-admin/promote/${id}`);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // ── DEMOTE TO EMPLOYEE ──
// export const demoteToEmployee = createAsyncThunk(
//   'superAdmin/demoteToEmployee',
//   async (id, { rejectWithValue }) => {
//     try {
//       const response = await API.put(`/super-admin/demote/${id}`);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed');
//     }
//   }
// );

// // 🆕 GET ALL ATTENDANCE GLOBAL
// export const fetchAllAttendanceGlobal = createAsyncThunk(
//   'superAdmin/fetchAllAttendanceGlobal',
//   async (filters = {}, { rejectWithValue }) => {
//     try {
//       const params = new URLSearchParams();
//       if (filters.date) params.append('date', filters.date);
//       if (filters.emp_code) params.append('emp_code', filters.emp_code);
//       if (filters.company_id) params.append('company_id', filters.company_id);
//       if (filters.flagged) params.append('flagged', filters.flagged);
//       if (filters.location_status) params.append('location_status', filters.location_status);

//       const response = await API.get(`/super-admin/all-attendance?${params.toString()}`);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to load attendance');
//     }
//   }
// );

// const superAdminSlice = createSlice({
//   name: 'superAdmin',
//   initialState: {
//     stats: null,
//     admins: [],
//     allEmployees: [],
//     allAttendance: [],     // 🆕
//     loading: false,
//     error: null,
//     message: null,
//   },
//   reducers: {
//     clearSuperAdminError: (state) => { state.error = null; },
//     clearSuperAdminMessage: (state) => { state.message = null; },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchGlobalStats.fulfilled, (state, action) => {
//         state.stats = action.payload;
//       });

//     builder
//       .addCase(fetchAllAdmins.pending, (state) => { state.loading = true; })
//       .addCase(fetchAllAdmins.fulfilled, (state, action) => {
//         state.loading = false;
//         state.admins = action.payload;
//       });

//     builder
//       .addCase(createAdmin.fulfilled, (state, action) => {
//         state.message = action.payload.message;
//       })
//       .addCase(createAdmin.rejected, (state, action) => {
//         state.error = action.payload;
//       });

//     builder
//       .addCase(deleteAdmin.fulfilled, (state, action) => {
//         state.admins = state.admins.filter(a => a._id !== action.payload);
//         state.message = 'Admin deleted';
//       });

//     builder
//       .addCase(fetchAllEmployeesGlobal.pending, (state) => { state.loading = true; })
//       .addCase(fetchAllEmployeesGlobal.fulfilled, (state, action) => {
//         state.loading = false;
//         state.allEmployees = action.payload;
//       });

//     builder
//       .addCase(promoteToManager.fulfilled, (state, action) => {
//         state.message = action.payload.message;
//       })
//       .addCase(demoteToEmployee.fulfilled, (state, action) => {
//         state.message = action.payload.message;
//       });

//     // 🆕 All Attendance Global
//     builder
//       .addCase(fetchAllAttendanceGlobal.pending, (state) => { 
//         state.loading = true; 
//         state.error = null;
//       })
//       .addCase(fetchAllAttendanceGlobal.fulfilled, (state, action) => {
//         state.loading = false;
//         state.allAttendance = action.payload;
//       })
//       .addCase(fetchAllAttendanceGlobal.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.allAttendance = [];
//       });
//   },
// });

// export const { clearSuperAdminError, clearSuperAdminMessage } = superAdminSlice.actions;
// export default superAdminSlice.reducer;





import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── GLOBAL STATS ──
export const fetchGlobalStats = createAsyncThunk(
  'superAdmin/fetchGlobalStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/super-admin/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── GET ALL ADMINS ──
export const fetchAllAdmins = createAsyncThunk(
  'superAdmin/fetchAllAdmins',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await API.get(`/super-admin/admins?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── CREATE ADMIN ──
export const createAdmin = createAsyncThunk(
  'superAdmin/createAdmin',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/super-admin/admins', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── DELETE ADMIN ──
export const deleteAdmin = createAsyncThunk(
  'superAdmin/deleteAdmin',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/super-admin/admins/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── GET ALL EMPLOYEES ──
export const fetchAllEmployeesGlobal = createAsyncThunk(
  'superAdmin/fetchAllEmployees',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await API.get(`/super-admin/employees?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── PROMOTE TO MANAGER ──
export const promoteToManager = createAsyncThunk(
  'superAdmin/promoteToManager',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.put(`/super-admin/promote/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── DEMOTE TO EMPLOYEE ──
export const demoteToEmployee = createAsyncThunk(
  'superAdmin/demoteToEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.put(`/super-admin/demote/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── GET ALL ATTENDANCE GLOBAL ──
export const fetchAllAttendanceGlobal = createAsyncThunk(
  'superAdmin/fetchAllAttendanceGlobal',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.emp_code) params.append('emp_code', filters.emp_code);
      if (filters.company_id) params.append('company_id', filters.company_id);
      if (filters.flagged) params.append('flagged', filters.flagged);
      if (filters.location_status) params.append('location_status', filters.location_status);

      const response = await API.get(`/super-admin/all-attendance?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load attendance');
    }
  }
);

// ── 🆕 RESET USER PASSWORD ──
export const resetUserPassword = createAsyncThunk(
  'superAdmin/resetUserPassword',
  async ({ user_id, new_password }, { rejectWithValue }) => {
    try {
      const response = await API.post('/super-admin/reset-password', {
        user_id,
        new_password,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Password reset failed');
    }
  }
);

// ── 🆕 CHANGE OWN PASSWORD ──
export const changeOwnPassword = createAsyncThunk(
  'superAdmin/changeOwnPassword',
  async ({ current_password, new_password }, { rejectWithValue }) => {
    try {
      const response = await API.post('/super-admin/change-own-password', {
        current_password,
        new_password,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Password change failed');
    }
  }
);

const superAdminSlice = createSlice({
  name: 'superAdmin',
  initialState: {
    stats: null,
    admins: [],
    allEmployees: [],
    allAttendance: [],
    loading: false,
    error: null,
    message: null,
    // 🆕 Password reset states
    passwordLoading: false,
    passwordMessage: null,
    passwordError: null,
  },
  reducers: {
    clearSuperAdminError: (state) => { state.error = null; },
    clearSuperAdminMessage: (state) => { state.message = null; },
    // 🆕 Clear password messages
    clearPasswordMessage: (state) => {
      state.passwordMessage = null;
      state.passwordError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlobalStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });

    builder
      .addCase(fetchAllAdmins.pending, (state) => { state.loading = true; })
      .addCase(fetchAllAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.admins = action.payload;
      });

    builder
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.message = action.payload.message;
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(deleteAdmin.fulfilled, (state, action) => {
        state.admins = state.admins.filter(a => a._id !== action.payload);
        state.message = 'Admin deleted';
      });

    builder
      .addCase(fetchAllEmployeesGlobal.pending, (state) => { state.loading = true; })
      .addCase(fetchAllEmployeesGlobal.fulfilled, (state, action) => {
        state.loading = false;
        state.allEmployees = action.payload;
      });

    builder
      .addCase(promoteToManager.fulfilled, (state, action) => {
        state.message = action.payload.message;
      })
      .addCase(demoteToEmployee.fulfilled, (state, action) => {
        state.message = action.payload.message;
      });

    // All Attendance Global
    builder
      .addCase(fetchAllAttendanceGlobal.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(fetchAllAttendanceGlobal.fulfilled, (state, action) => {
        state.loading = false;
        state.allAttendance = action.payload;
      })
      .addCase(fetchAllAttendanceGlobal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.allAttendance = [];
      });

    // 🆕 Reset User Password
    builder
      .addCase(resetUserPassword.pending, (state) => {
        state.passwordLoading = true;
        state.passwordMessage = null;
        state.passwordError = null;
      })
      .addCase(resetUserPassword.fulfilled, (state, action) => {
        state.passwordLoading = false;
        state.passwordMessage = action.payload.message;
      })
      .addCase(resetUserPassword.rejected, (state, action) => {
        state.passwordLoading = false;
        state.passwordError = action.payload;
      });

    // 🆕 Change Own Password
    builder
      .addCase(changeOwnPassword.pending, (state) => {
        state.passwordLoading = true;
        state.passwordMessage = null;
        state.passwordError = null;
      })
      .addCase(changeOwnPassword.fulfilled, (state, action) => {
        state.passwordLoading = false;
        state.passwordMessage = action.payload.message;
      })
      .addCase(changeOwnPassword.rejected, (state, action) => {
        state.passwordLoading = false;
        state.passwordError = action.payload;
      });
  },
});

export const { 
  clearSuperAdminError, 
  clearSuperAdminMessage,
  clearPasswordMessage,  // 🆕
} = superAdminSlice.actions;

export default superAdminSlice.reducer;
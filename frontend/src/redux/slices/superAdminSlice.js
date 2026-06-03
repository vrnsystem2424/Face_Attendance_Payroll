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

// ── GET ALL EMPLOYEES (across companies) ──
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

const superAdminSlice = createSlice({
  name: 'superAdmin',
  initialState: {
    stats: null,
    admins: [],
    allEmployees: [],
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearSuperAdminError: (state) => { state.error = null; },
    clearSuperAdminMessage: (state) => { state.message = null; },
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
  },
});

export const { clearSuperAdminError, clearSuperAdminMessage } = superAdminSlice.actions;
export default superAdminSlice.reducer;
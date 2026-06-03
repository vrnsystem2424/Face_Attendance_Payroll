// src/redux/slices/leaveSlice.js


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';
// ════════════════════════════════════════════
// EMPLOYEE THUNKS
// ════════════════════════════════════════════

// Leave Apply karo
export const applyLeave = createAsyncThunk(
  'leaves/applyLeave',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/leaves/apply', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Leave apply nahi hui');
    }
  }
);

// Meri Leaves dekho
export const fetchMyLeaves = createAsyncThunk(
  'leaves/fetchMyLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/leaves/my');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Leaves load nahi hui');
    }
  }
);

// ════════════════════════════════════════════
// ADMIN THUNKS
// ════════════════════════════════════════════

// Sab ki Leaves (Admin)
export const fetchAllLeaves = createAsyncThunk(
  'leaves/fetchAllLeaves',
  async (status, { rejectWithValue }) => {
    try {
      const url = status ? `/leaves/all?status=${status}` : '/leaves/all';
      const response = await API.get(url);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Leaves load nahi hui');
    }
  }
);

// Leave Approve (Admin)
export const approveLeave = createAsyncThunk(
  'leaves/approveLeave',
  async ({ id, remark }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/leaves/approve/${id}`, { remark });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Approve nahi hua');
    }
  }
);

// Leave Reject (Admin)
export const rejectLeave = createAsyncThunk(
  'leaves/rejectLeave',
  async ({ id, remark }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/leaves/reject/${id}`, { remark });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Reject nahi hua');
    }
  }
);

// ════════════════════════════════════════════
// 🆕 SUPER ADMIN THUNKS
// ════════════════════════════════════════════

// Fetch all leaves (across all companies)
export const fetchAllLeavesSuperAdmin = createAsyncThunk(
  'leaves/fetchAllLeavesSuperAdmin',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.company_id && filters.company_id !== 'all') {
        params.append('company_id', filters.company_id);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.search && filters.search.trim() !== '') {
        params.append('search', filters.search.trim());
      }

      const response = await API.get(`/leaves/super-admin/all?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaves');
    }
  }
);

// Approve leave (Super admin)
export const superAdminApproveLeave = createAsyncThunk(
  'leaves/superAdminApproveLeave',
  async ({ id, admin_remark }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/leaves/super-admin/approve/${id}`, { admin_remark });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Approve failed');
    }
  }
);

// Reject leave (Super admin)
export const superAdminRejectLeave = createAsyncThunk(
  'leaves/superAdminRejectLeave',
  async ({ id, admin_remark }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/leaves/super-admin/reject/${id}`, { admin_remark });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Reject failed');
    }
  }
);

// Delete leave (Super admin)
export const superAdminDeleteLeave = createAsyncThunk(
  'leaves/superAdminDeleteLeave',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/leaves/super-admin/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Delete failed');
    }
  }
);

// ════════════════════════════════════════════
// SLICE
// ════════════════════════════════════════════
const leaveSlice = createSlice({
  name: 'leaves',
  initialState: {
    myLeaves: [],
    allLeaves: [],      // For admin
    leaves: [],         // 🆕 For super admin (all companies)
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearLeaveError: (state) => {
      state.error = null;
    },
    clearLeaveMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // ════════════════════════════════════════
    // APPLY LEAVE
    // ════════════════════════════════════════
    builder
      .addCase(applyLeave.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.myLeaves.unshift(action.payload.data);
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ════════════════════════════════════════
    // MY LEAVES (Employee)
    // ════════════════════════════════════════
    builder
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        state.myLeaves = action.payload;
      });

    // ════════════════════════════════════════
    // ALL LEAVES (Admin)
    // ════════════════════════════════════════
    builder
      .addCase(fetchAllLeaves.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.allLeaves = action.payload;
      })
      .addCase(fetchAllLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ════════════════════════════════════════
    // APPROVE LEAVE (Admin)
    // ════════════════════════════════════════
    builder
      .addCase(approveLeave.fulfilled, (state, action) => {
        const index = state.allLeaves.findIndex(l => l._id === action.payload._id);
        if (index !== -1) state.allLeaves[index] = action.payload;
      });

    // ════════════════════════════════════════
    // REJECT LEAVE (Admin)
    // ════════════════════════════════════════
    builder
      .addCase(rejectLeave.fulfilled, (state, action) => {
        const index = state.allLeaves.findIndex(l => l._id === action.payload._id);
        if (index !== -1) state.allLeaves[index] = action.payload;
      });

    // ════════════════════════════════════════
    // 🆕 SUPER ADMIN — FETCH ALL LEAVES
    // ════════════════════════════════════════
    builder
      .addCase(fetchAllLeavesSuperAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllLeavesSuperAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload;
      })
      .addCase(fetchAllLeavesSuperAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ════════════════════════════════════════
    // 🆕 SUPER ADMIN — APPROVE
    // ════════════════════════════════════════
    builder
      .addCase(superAdminApproveLeave.fulfilled, (state, action) => {
        const idx = state.leaves.findIndex(l => l._id === action.payload._id);
        if (idx !== -1) state.leaves[idx] = action.payload;
      });

    // ════════════════════════════════════════
    // 🆕 SUPER ADMIN — REJECT
    // ════════════════════════════════════════
    builder
      .addCase(superAdminRejectLeave.fulfilled, (state, action) => {
        const idx = state.leaves.findIndex(l => l._id === action.payload._id);
        if (idx !== -1) state.leaves[idx] = action.payload;
      });

    // ════════════════════════════════════════
    // 🆕 SUPER ADMIN — DELETE
    // ════════════════════════════════════════
    builder
      .addCase(superAdminDeleteLeave.fulfilled, (state, action) => {
        state.leaves = state.leaves.filter(l => l._id !== action.payload);
      });
  },
});

export const { clearLeaveError, clearLeaveMessage } = leaveSlice.actions;
export default leaveSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── MANAGER STATS ──
export const fetchManagerStats = createAsyncThunk(
  'manager/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/manager/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── MY TEAM ──
export const fetchMyTeam = createAsyncThunk(
  'manager/fetchMyTeam',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/manager/team');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── PENDING LEAVES ──
export const fetchPendingLeaves = createAsyncThunk(
  'manager/fetchPendingLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/manager/leaves/pending');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── ALL MY LEAVES ──
export const fetchAllMyLeaves = createAsyncThunk(
  'manager/fetchAllMyLeaves',
  async (status = '', { rejectWithValue }) => {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await API.get(`/manager/leaves${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── APPROVE LEAVE ──
export const approveLeaveByManager = createAsyncThunk(
  'manager/approveLeave',
  async ({ id, remark, approved_days }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/manager/leaves/${id}/approve`, {
        remark,
        approved_days,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

// ── REJECT LEAVE ──
export const rejectLeaveByManager = createAsyncThunk(
  'manager/rejectLeave',
  async ({ id, remark }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/manager/leaves/${id}/reject`, { remark });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

const managerSlice = createSlice({
  name: 'manager',
  initialState: {
    stats: null,
    team: [],
    pendingLeaves: [],
    allLeaves: [],
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearManagerError: (state) => { state.error = null; },
    clearManagerMessage: (state) => { state.message = null; },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchManagerStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });

    builder
      .addCase(fetchMyTeam.pending, (state) => { state.loading = true; })
      .addCase(fetchMyTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.team = action.payload;
      });

    builder
      .addCase(fetchPendingLeaves.pending, (state) => { state.loading = true; })
      .addCase(fetchPendingLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingLeaves = action.payload;
      });

    builder
      .addCase(fetchAllMyLeaves.pending, (state) => { state.loading = true; })
      .addCase(fetchAllMyLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.allLeaves = action.payload;
      });

    builder
      .addCase(approveLeaveByManager.fulfilled, (state, action) => {
        state.pendingLeaves = state.pendingLeaves.filter(l => l._id !== action.payload.data._id);
        state.message = action.payload.message;
      })
      .addCase(rejectLeaveByManager.fulfilled, (state, action) => {
        state.pendingLeaves = state.pendingLeaves.filter(l => l._id !== action.payload.data._id);
        state.message = action.payload.message;
      });
  },
});

export const { clearManagerError, clearManagerMessage } = managerSlice.actions;
export default managerSlice.reducer;
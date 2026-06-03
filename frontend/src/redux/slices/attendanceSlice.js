import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ════════════════════════════════════════
// EMPLOYEE — Mark Attendance
// ════════════════════════════════════════
export const markAttendance = createAsyncThunk(
  'attendance/markAttendance',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/attendance/mark-self', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Attendance mark nahi hui'
      );
    }
  }
);

// ════════════════════════════════════════
// 🆕 EMPLOYEE — Today Status (IN/OUT + working hours)
// ════════════════════════════════════════
export const fetchTodayStatus = createAsyncThunk(
  'attendance/fetchTodayStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/attendance/today-status');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Status load nahi hua'
      );
    }
  }
);

// ════════════════════════════════════════
// 🆕 EMPLOYEE — Monthly Summary
// ════════════════════════════════════════
export const fetchMonthlySummary = createAsyncThunk(
  'attendance/fetchMonthlySummary',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.month) queryParams.append('month', params.month);
      if (params.year) queryParams.append('year', params.year);

      const url = queryParams.toString()
        ? `/attendance/monthly-summary?${queryParams.toString()}`
        : '/attendance/monthly-summary';

      const response = await API.get(url);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Summary load nahi hua'
      );
    }
  }
);

// ════════════════════════════════════════
// 🆕 EMPLOYEE — Calendar
// ════════════════════════════════════════
export const fetchCalendar = createAsyncThunk(
  'attendance/fetchCalendar',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.month) queryParams.append('month', params.month);
      if (params.year) queryParams.append('year', params.year);

      const url = queryParams.toString()
        ? `/attendance/calendar?${queryParams.toString()}`
        : '/attendance/calendar';

      const response = await API.get(url);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Calendar load nahi hua'
      );
    }
  }
);

// ════════════════════════════════════════
// My Attendance History
// ════════════════════════════════════════
export const fetchMyAttendance = createAsyncThunk(
  'attendance/fetchMyAttendance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/attendance/my');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Attendance load nahi hui'
      );
    }
  }
);

// ════════════════════════════════════════
// ADMIN — All Attendance with filters
// ════════════════════════════════════════
export const fetchAllAttendance = createAsyncThunk(
  'attendance/fetchAllAttendance',
  async (params, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      if (params?.emp_code) queryParams.append('emp_code', params.emp_code);

      const queryString = queryParams.toString();
      const url = queryString
        ? `/attendance/all?${queryString}`
        : '/attendance/all';

      const response = await API.get(url);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Attendance load nahi hui'
      );
    }
  }
);

// ════════════════════════════════════════
// ADMIN — Today Attendance
// ════════════════════════════════════════
export const fetchTodayAttendance = createAsyncThunk(
  'attendance/fetchTodayAttendance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/attendance/today');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Attendance load nahi hui'
      );
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    myAttendance: [],
    allAttendance: [],
    todayData: null,
    todayStatus: null,            // 🆕
    monthlySummary: null,         // 🆕
    calendar: null,               // 🆕
    markResult: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearAttendanceError: (state) => {
      state.error = null;
    },
    clearMarkResult: (state) => {
      state.markResult = null;
    },
  },
  extraReducers: (builder) => {
    // Mark Attendance
    builder
      .addCase(markAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.markResult = action.payload;
      })
      .addCase(markAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // 🆕 Today Status
    builder
      .addCase(fetchTodayStatus.fulfilled, (state, action) => {
        state.todayStatus = action.payload;
      });

    // 🆕 Monthly Summary
    builder
      .addCase(fetchMonthlySummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMonthlySummary.fulfilled, (state, action) => {
        state.loading = false;
        state.monthlySummary = action.payload;
      })
      .addCase(fetchMonthlySummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // 🆕 Calendar
    builder
      .addCase(fetchCalendar.fulfilled, (state, action) => {
        state.calendar = action.payload;
      });

    // My Attendance
    builder
      .addCase(fetchMyAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.myAttendance = action.payload || [];
      })
      .addCase(fetchMyAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // All Attendance
    builder
      .addCase(fetchAllAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.allAttendance = action.payload || [];
      })
      .addCase(fetchAllAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.allAttendance = [];
      });

    // Today Attendance (Admin)
    builder
      .addCase(fetchTodayAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.todayData = action.payload || null;
      })
      .addCase(fetchTodayAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAttendanceError, clearMarkResult } = attendanceSlice.actions;
export default attendanceSlice.reducer;
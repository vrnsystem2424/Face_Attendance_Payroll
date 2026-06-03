import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── FETCH SETTINGS for specific month ──
export const fetchMonthlySettings = createAsyncThunk(
  'monthlySettings/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('month', params.month);
      queryParams.append('year', params.year);
      if (params.company_id) queryParams.append('company_id', params.company_id);

      const response = await API.get(`/monthly-settings?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch');
    }
  }
);

// ── SAVE / UPDATE SETTINGS ──
export const saveMonthlySettings = createAsyncThunk(
  'monthlySettings/save',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/monthly-settings', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save');
    }
  }
);

// ── ADD HOLIDAY ──
export const addHoliday = createAsyncThunk(
  'monthlySettings/addHoliday',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/monthly-settings/holiday/add', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add');
    }
  }
);

// ── REMOVE HOLIDAY ──
export const removeHoliday = createAsyncThunk(
  'monthlySettings/removeHoliday',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/monthly-settings/holiday/remove', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove');
    }
  }
);

// ── GET ALL SETTINGS (overview) ──
export const fetchAllSettings = createAsyncThunk(
  'monthlySettings/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/monthly-settings/all');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed');
    }
  }
);

const monthlySettingsSlice = createSlice({
  name: 'monthlySettings',
  initialState: {
    current: null,            // current month settings
    allSettings: [],          // all months overview
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearSettingsMessage: (state) => { state.message = null; },
    clearSettingsError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlySettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMonthlySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchMonthlySettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(saveMonthlySettings.fulfilled, (state, action) => {
        state.current = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(saveMonthlySettings.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(addHoliday.fulfilled, (state, action) => {
        state.current = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(addHoliday.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(removeHoliday.fulfilled, (state, action) => {
        state.current = action.payload.data;
        state.message = 'Holiday removed';
      });

    builder
      .addCase(fetchAllSettings.fulfilled, (state, action) => {
        state.allSettings = action.payload;
      });
  },
});

export const { clearSettingsMessage, clearSettingsError } = monthlySettingsSlice.actions;
export default monthlySettingsSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── FETCH ALL COMPANIES (for register dropdown) ──
export const fetchCompanies = createAsyncThunk(
  'company/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/companies');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch companies');
    }
  }
);

// ── FETCH COMPANY STATS (super admin) ──
export const fetchCompanyStats = createAsyncThunk(
  'company/fetchCompanyStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/companies/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

// ── CREATE COMPANY ──
export const createCompany = createAsyncThunk(
  'company/createCompany',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/companies', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create');
    }
  }
);

// ── UPDATE COMPANY ──
export const updateCompany = createAsyncThunk(
  'company/updateCompany',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/companies/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update');
    }
  }
);

// ── DELETE COMPANY ──
export const deleteCompany = createAsyncThunk(
  'company/deleteCompany',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/companies/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete');
    }
  }
);

const companySlice = createSlice({
  name: 'company',
  initialState: {
    companies: [],
    stats: [],
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearCompanyError: (state) => { state.error = null; },
    clearCompanyMessage: (state) => { state.message = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => { state.loading = true; })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchCompanyStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });

    builder
      .addCase(createCompany.fulfilled, (state, action) => {
        state.companies.push(action.payload.data);
        state.message = action.payload.message;
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(updateCompany.fulfilled, (state, action) => {
        const idx = state.companies.findIndex(c => c._id === action.payload.data._id);
        if (idx !== -1) state.companies[idx] = action.payload.data;
        state.message = action.payload.message;
      });

    builder
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.companies = state.companies.filter(c => c._id !== action.payload);
        state.message = 'Company deleted';
      });
  },
});

export const { clearCompanyError, clearCompanyMessage } = companySlice.actions;
export default companySlice.reducer;
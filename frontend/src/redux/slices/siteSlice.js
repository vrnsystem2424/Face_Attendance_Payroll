import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// 🆕 FIXED: Now accepts companyId parameter
export const fetchSites = createAsyncThunk(
  'sites/fetchSites',
  async (companyId = null, { rejectWithValue }) => {
    try {
      const url = companyId && companyId !== 'all' 
        ? `/sites?company_id=${companyId}` 
        : '/sites';
      const response = await API.get(url);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Sites load nahi hui');
    }
  }
);

// Site Add karo
export const addSite = createAsyncThunk(
  'sites/addSite',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/sites', data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Site add nahi hui');
    }
  }
);

// Site Update karo
export const updateSite = createAsyncThunk(
  'sites/updateSite',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/sites/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Site update nahi hui');
    }
  }
);

// Site Delete karo
export const deleteSite = createAsyncThunk(
  'sites/deleteSite',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/sites/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Site delete nahi hui');
    }
  }
);

const siteSlice = createSlice({
  name: 'sites',
  initialState: {
    sites: [],
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearSiteError: (state) => {
      state.error = null;
    },
    clearSiteMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSites.fulfilled, (state, action) => {
        state.loading = false;
        state.sites = action.payload || [];
      })
      .addCase(fetchSites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.sites = [];
      });

    builder
      .addCase(addSite.fulfilled, (state, action) => {
        state.sites.unshift(action.payload);
        state.message = 'Site added successfully';
      });

    builder
      .addCase(updateSite.fulfilled, (state, action) => {
        const index = state.sites.findIndex(s => s._id === action.payload._id);
        if (index !== -1) state.sites[index] = action.payload;
        state.message = 'Site updated';
      });

    builder
      .addCase(deleteSite.fulfilled, (state, action) => {
        state.sites = state.sites.filter(s => s._id !== action.payload);
        state.message = 'Site deleted';
      });
  },
});

export const { clearSiteError, clearSiteMessage } = siteSlice.actions;
export default siteSlice.reducer;
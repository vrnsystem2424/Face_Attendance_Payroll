import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// Sab Master Data Load karo
export const fetchAllMasterData = createAsyncThunk(
  'master/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/master');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Data load nahi hua');
    }
  }
);

// Add Master Data
export const addMasterData = createAsyncThunk(
  'master/add',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/master', data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Add nahi hua');
    }
  }
);

// Update Master Data
export const updateMasterData = createAsyncThunk(
  'master/update',
  async ({ id, value }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/master/${id}`, { value });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Update nahi hua');
    }
  }
);

// Delete Master Data
export const deleteMasterData = createAsyncThunk(
  'master/delete',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/master/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Delete nahi hua');
    }
  }
);

const masterSlice = createSlice({
  name: 'master',
  initialState: {
    allData: [],
    departments: [],
    designations: [],
    managers: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearMasterError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllMasterData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllMasterData.fulfilled, (state, action) => {
        state.loading = false;
        state.allData = action.payload;
        state.departments = action.payload.filter(d => d.type === 'department');
        state.designations = action.payload.filter(d => d.type === 'designation');
        state.managers = action.payload.filter(d => d.type === 'manager');
      })
      .addCase(fetchAllMasterData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(addMasterData.fulfilled, (state, action) => {
        state.allData.push(action.payload);
        if (action.payload.type === 'department') state.departments.push(action.payload);
        if (action.payload.type === 'designation') state.designations.push(action.payload);
        if (action.payload.type === 'manager') state.managers.push(action.payload);
      });

    builder
      .addCase(updateMasterData.fulfilled, (state, action) => {
        const index = state.allData.findIndex(d => d._id === action.payload._id);
        if (index !== -1) state.allData[index] = action.payload;
      });

    builder
      .addCase(deleteMasterData.fulfilled, (state, action) => {
        state.allData = state.allData.filter(d => d._id !== action.payload);
        state.departments = state.departments.filter(d => d._id !== action.payload);
        state.designations = state.designations.filter(d => d._id !== action.payload);
        state.managers = state.managers.filter(d => d._id !== action.payload);
      });
  },
});

export const { clearMasterError } = masterSlice.actions;
export default masterSlice.reducer;
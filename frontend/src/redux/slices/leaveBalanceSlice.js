import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

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

const leaveBalanceSlice = createSlice({
  name: 'leaveBalance',
  initialState: {
    myBalance: null,
    employeeBalance: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBalance.fulfilled, (state, action) => {
        state.myBalance = action.payload;
      })
      .addCase(fetchEmployeeBalance.fulfilled, (state, action) => {
        state.employeeBalance = action.payload;
      });
  },
});

export default leaveBalanceSlice.reducer;
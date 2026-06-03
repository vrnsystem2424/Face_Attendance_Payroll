// src/redux/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

// ── Save auth to localStorage ──
const saveAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// ── Clear auth from localStorage ──
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ── Get initial state from localStorage ──
const getInitialState = () => {
  try {
    return {
      user: JSON.parse(localStorage.getItem('user')) || null,
      token: localStorage.getItem('token') || null,
    };
  } catch {
    return { user: null, token: null };
  }
};

// ── Shared error handler ──
const handleError = (error) => {
  if (error.code === 'ERR_CONNECTION_REFUSED') {
    return 'Server is not running. Please try again later.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Check your connection.';
  }
  if (error.response) {
    return (
      error.response.data?.message ||
      `Server error: ${error.response.status}`
    );
  }
  return error.message || 'Something went wrong';
};

// ════════════════════════════════════════════════════════════
// ASYNC THUNKS
// ════════════════════════════════════════════════════════════

// ── 1. EMPLOYEE / MANAGER LOGIN ──
export const loginEmployee = createAsyncThunk(
  'auth/loginEmployee',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('🔄 Employee/Manager login attempt');

      const response = await API.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      const { token, data, message } = response.data;
      saveAuthData(token, data);

      return { token, data, message };
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// ── 2. ADMIN LOGIN ──
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('🔄 Admin login attempt');

      const response = await API.post('/auth/admin-login', {
        email: credentials.email,
        password: credentials.password,
      });

      const { token, data, message } = response.data;
      saveAuthData(token, data);

      return { token, data, message };
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// ── 3. SUPER ADMIN LOGIN (🆕 NEW) ──
export const loginSuperAdmin = createAsyncThunk(
  'auth/loginSuperAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('🔄 Super Admin login attempt');

      const response = await API.post('/auth/super-admin-login', {
        email: credentials.email,
        password: credentials.password,
      });

      const { token, data, message } = response.data;
      saveAuthData(token, data);

      return { token, data, message };
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// ── 4. REGISTER EMPLOYEE ──
export const registerEmployee = createAsyncThunk(
  'auth/registerEmployee',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/register', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// ── 5. FETCH CURRENT USER (🆕 NEW — refresh user data) ──
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/auth/me');
      const userData = response.data.data;
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// ════════════════════════════════════════════════════════════
// SHARED REDUCER HANDLERS
// ════════════════════════════════════════════════════════════

const handlePending = (state) => {
  state.loading = true;
  state.error = null;
};

const handleRejected = (state, action) => {
  state.loading = false;
  state.error = action.payload;
};

const handleLoginFulfilled = (state, action) => {
  state.loading = false;
  state.user = action.payload.data;
  state.token = action.payload.token;
  state.message = action.payload.message;
  state.error = null;
};

// ════════════════════════════════════════════════════════════
// SLICE
// ════════════════════════════════════════════════════════════

const { user, token } = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user,
    token,
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    // ── Logout ──
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.message = null;
      clearAuthData();
    },

    // ── Clear messages ──
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },

    // ── 🆕 Update user locally (e.g. after face register) ──
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },

  extraReducers: (builder) => {
    // ── Employee / Manager Login ──
    builder
      .addCase(loginEmployee.pending, handlePending)
      .addCase(loginEmployee.fulfilled, handleLoginFulfilled)
      .addCase(loginEmployee.rejected, handleRejected);

    // ── Admin Login ──
    builder
      .addCase(loginAdmin.pending, handlePending)
      .addCase(loginAdmin.fulfilled, handleLoginFulfilled)
      .addCase(loginAdmin.rejected, handleRejected);

    // ── 🆕 Super Admin Login ──
    builder
      .addCase(loginSuperAdmin.pending, handlePending)
      .addCase(loginSuperAdmin.fulfilled, handleLoginFulfilled)
      .addCase(loginSuperAdmin.rejected, handleRejected);

    // ── Register Employee ──
    builder
      .addCase(registerEmployee.pending, handlePending)
      .addCase(registerEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(registerEmployee.rejected, handleRejected);

    // ── 🆕 Fetch Current User ──
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const {
  logout,
  clearError,
  clearMessage,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;
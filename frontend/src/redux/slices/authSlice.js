



// // src/redux/slices/authSlice.js

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../api/axios';

// // ════════════════════════════════════════════════════════════
// // HELPERS
// // ════════════════════════════════════════════════════════════

// const saveAuthData = (token, user) => {
//   if (!token || typeof token !== 'string') {
//     console.error('❌ Invalid token — not saving');
//     return;
//   }
//   localStorage.setItem('token', token);
//   localStorage.setItem('user', JSON.stringify(user));
//   console.log('✅ Auth data saved successfully');
// };

// const clearAuthData = () => {
//   localStorage.removeItem('token');
//   localStorage.removeItem('user');
// };

// const getInitialState = () => {
//   try {
//     return {
//       user: JSON.parse(localStorage.getItem('user')) || null,
//       token: localStorage.getItem('token') || null,
//     };
//   } catch {
//     return { user: null, token: null };
//   }
// };

// const handleError = (error) => {
//   if (error.code === 'ERR_CONNECTION_REFUSED') return 'Server is not running.';
//   if (error.code === 'ECONNABORTED') return 'Request timed out.';
//   if (error.response) return error.response.data?.message || `Server error: ${error.response.status}`;
//   return error.message || 'Something went wrong';
// };

// // ════════════════════════════════════════════════════════════
// // ASYNC THUNKS
// // ════════════════════════════════════════════════════════════

// // ── 1. Employee Login ──
// export const loginEmployee = createAsyncThunk(
//   'auth/loginEmployee',
//   async (credentials, { rejectWithValue }) => {
//     try {
//       const response = await API.post('/auth/login', {
//         email: credentials.email,
//         password: credentials.password,
//       });
//       const { token, data, message } = response.data;
//       saveAuthData(token, data);
//       return { token, data, message };
//     } catch (error) {
//       return rejectWithValue(handleError(error));
//     }
//   }
// );

// // ── 2. Admin Login ──
// export const loginAdmin = createAsyncThunk(
//   'auth/loginAdmin',
//   async (credentials, { rejectWithValue }) => {
//     try {
//       const response = await API.post('/auth/admin-login', {
//         email: credentials.email,
//         password: credentials.password,
//       });
//       const { token, data, message } = response.data;
//       saveAuthData(token, data);
//       return { token, data, message };
//     } catch (error) {
//       return rejectWithValue(handleError(error));
//     }
//   }
// );

// // ── 3. Super Admin Login ──
// export const loginSuperAdmin = createAsyncThunk(
//   'auth/loginSuperAdmin',
//   async (credentials, { rejectWithValue }) => {
//     try {
//       const response = await API.post('/auth/super-admin-login', {
//         email: credentials.email,
//         password: credentials.password,
//       });
//       const { token, data, message } = response.data;
//       saveAuthData(token, data);
//       return { token, data, message };
//     } catch (error) {
//       return rejectWithValue(handleError(error));
//     }
//   }
// );

// // ── 4. Register Employee ──
// export const registerEmployee = createAsyncThunk(
//   'auth/registerEmployee',
//   async (data, { rejectWithValue }) => {
//     try {
//       const response = await API.post('/auth/register', data);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(handleError(error));
//     }
//   }
// );

// // ── 5. Fetch Current User ──
// export const fetchCurrentUser = createAsyncThunk(
//   'auth/fetchCurrentUser',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await API.get('/auth/me');
//       const userData = response.data.data;
//       console.log('✅ fetchCurrentUser:', userData);
//       // ✅ face_encoding bhi save ho
//       localStorage.setItem('user', JSON.stringify(userData));
//       return userData;
//     } catch (error) {
//       return rejectWithValue(handleError(error));
//     }
//   }
// );

// // ════════════════════════════════════════════════════════════
// // SHARED HANDLERS
// // ════════════════════════════════════════════════════════════

// const handlePending = (state) => {
//   state.loading = true;
//   state.error = null;
// };

// const handleRejected = (state, action) => {
//   state.loading = false;
//   state.error = action.payload;
// };

// const handleLoginFulfilled = (state, action) => {
//   state.loading = false;
//   state.user = action.payload.data;
//   state.token = action.payload.token;
//   state.message = action.payload.message;
//   state.error = null;
// };

// // ════════════════════════════════════════════════════════════
// // SLICE
// // ════════════════════════════════════════════════════════════

// const { user, token } = getInitialState();

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     user,
//     token,
//     loading: false,
//     error: null,
//     message: null,
//   },
//   reducers: {
//     logout: (state) => {
//       state.user = null;
//       state.token = null;
//       state.error = null;
//       state.message = null;
//       clearAuthData();
//     },
//     clearError: (state) => { state.error = null; },
//     clearMessage: (state) => { state.message = null; },

//     // ✅ Local update + localStorage sync
//     updateUser: (state, action) => {
//       if (!state.user) return;
//       state.user = { ...state.user, ...action.payload };
//       localStorage.setItem('user', JSON.stringify(state.user));
//     },
//   },

//   extraReducers: (builder) => {
//     // ── Employee Login ──
//     builder
//       .addCase(loginEmployee.pending, handlePending)
//       .addCase(loginEmployee.fulfilled, handleLoginFulfilled)
//       .addCase(loginEmployee.rejected, handleRejected);

//     // ── Admin Login ──
//     builder
//       .addCase(loginAdmin.pending, handlePending)
//       .addCase(loginAdmin.fulfilled, handleLoginFulfilled)
//       .addCase(loginAdmin.rejected, handleRejected);

//     // ── Super Admin Login ──
//     builder
//       .addCase(loginSuperAdmin.pending, handlePending)
//       .addCase(loginSuperAdmin.fulfilled, handleLoginFulfilled)
//       .addCase(loginSuperAdmin.rejected, handleRejected);

//     // ── Register Employee ──
//     builder
//       .addCase(registerEmployee.pending, handlePending)
//       .addCase(registerEmployee.fulfilled, (state, action) => {
//         state.loading = false;
//         state.message = action.payload.message;
//         state.error = null;
//       })
//       .addCase(registerEmployee.rejected, handleRejected);

//     // ── Fetch Current User ──
//     builder
//       .addCase(fetchCurrentUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCurrentUser.fulfilled, (state, action) => {
//         state.loading = false;
//         // ✅ Pura user replace karo fresh data se
//         state.user = action.payload;
//         state.error = null;
//       })
//       .addCase(fetchCurrentUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const {
//   logout,
//   clearError,
//   clearMessage,
//   updateUser,
// } = authSlice.actions;

// export default authSlice.reducer;






import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
const saveAuthData = (token, user) => {
  if (!token || typeof token !== 'string') {
    console.error('❌ Invalid token — not saving');
    return;
  }
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  console.log('✅ Auth data saved successfully');
};

const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

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

const handleError = (error) => {
  if (error.code === 'ERR_CONNECTION_REFUSED') return 'Server is not running.';
  if (error.code === 'ECONNABORTED') return 'Request timed out.';
  if (error.response) return error.response.data?.message || `Server error: ${error.response.status}`;
  return error.message || 'Something went wrong';
};

// ════════════════════════════════════════════════════════════
// EXISTING THUNKS
// ════════════════════════════════════════════════════════════

// ── 1. Employee Login ──
export const loginEmployee = createAsyncThunk(
  'auth/loginEmployee',
  async (credentials, { rejectWithValue }) => {
    try {
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

// ── 2. Admin Login ──
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
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

// ── 3. Super Admin Login ──
export const loginSuperAdmin = createAsyncThunk(
  'auth/loginSuperAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
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

// ── 4. Register Employee ──
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

// ── 5. Fetch Current User ──
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
// 🆕 FORGOT PASSWORD THUNKS
// ════════════════════════════════════════════════════════════

// ── 6. Send OTP ──
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/forgot-password', { email });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// ── 7. Verify OTP ──
export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/verify-otp', { email, otp });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// ── 8. Reset Password ──
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email, otp, newPassword }, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// ════════════════════════════════════════════════════════════
// SHARED HANDLERS
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
    // 🆕 Forgot password states
    otpSent: false,
    otpVerified: false,
    passwordReset: false,
    forgotLoading: false,
    forgotError: null,
    forgotMessage: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.message = null;
      clearAuthData();
    },
    clearError: (state) => { state.error = null; },
    clearMessage: (state) => { state.message = null; },
    updateUser: (state, action) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    // 🆕 Reset forgot password states
    resetForgotPassword: (state) => {
      state.otpSent = false;
      state.otpVerified = false;
      state.passwordReset = false;
      state.forgotLoading = false;
      state.forgotError = null;
      state.forgotMessage = null;
    },
    clearForgotError: (state) => {
      state.forgotError = null;
    },
  },

  extraReducers: (builder) => {
    // ── Employee Login ──
    builder
      .addCase(loginEmployee.pending, handlePending)
      .addCase(loginEmployee.fulfilled, handleLoginFulfilled)
      .addCase(loginEmployee.rejected, handleRejected);

    // ── Admin Login ──
    builder
      .addCase(loginAdmin.pending, handlePending)
      .addCase(loginAdmin.fulfilled, handleLoginFulfilled)
      .addCase(loginAdmin.rejected, handleRejected);

    // ── Super Admin Login ──
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

    // ── Fetch Current User ──
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── 🆕 Forgot Password - Send OTP ──
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.forgotLoading = true;
        state.forgotError = null;
        state.forgotMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.forgotLoading = false;
        state.otpSent = true;
        state.forgotMessage = action.payload;
        state.forgotError = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotLoading = false;
        state.forgotError = action.payload;
      });

    // ── 🆕 Verify OTP ──
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.forgotLoading = true;
        state.forgotError = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.forgotLoading = false;
        state.otpVerified = true;
        state.forgotMessage = action.payload;
        state.forgotError = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.forgotLoading = false;
        state.forgotError = action.payload;
      });

    // ── 🆕 Reset Password ──
    builder
      .addCase(resetPassword.pending, (state) => {
        state.forgotLoading = true;
        state.forgotError = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.forgotLoading = false;
        state.passwordReset = true;
        state.forgotMessage = action.payload;
        state.forgotError = null;
        // Reset all forgot states after success
        state.otpSent = false;
        state.otpVerified = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.forgotLoading = false;
        state.forgotError = action.payload;
      });
  },
});

export const {
  logout,
  clearError,
  clearMessage,
  updateUser,
  resetForgotPassword,
  clearForgotError,
} = authSlice.actions;

export default authSlice.reducer;
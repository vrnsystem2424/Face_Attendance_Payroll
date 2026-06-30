// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../api/axios';

// export const loadAllFaceEncodings = createAsyncThunk(
//   'faces/loadAllFaceEncodings',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await API.get('/employees/face-encodings');
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Face data load nahi hua');
//     }
//   }
// );

// export const registerFace = createAsyncThunk(
//   'faces/registerFace',
//   async (face_encoding, { rejectWithValue }) => {
//     try {
//       const response = await API.post('/employees/register-face', { face_encoding });
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Face register nahi hua');
//     }
//   }
// );

// const faceSlice = createSlice({
//   name: 'faces',
//   initialState: {
//     faceData: [],
//     loading: false,
//     error: null,
//     message: null,
//     isLoaded: false,
//   },
//   reducers: {
//     clearFaceError: (state) => {
//       state.error = null;
//     },
//     clearFaceMessage: (state) => {
//       state.message = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(loadAllFaceEncodings.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(loadAllFaceEncodings.fulfilled, (state, action) => {
//         state.loading = false;
//         state.faceData = action.payload;
//         state.isLoaded = true;
//       })
//       .addCase(loadAllFaceEncodings.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });

//     builder
//       .addCase(registerFace.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(registerFace.fulfilled, (state, action) => {
//         state.loading = false;
//         state.message = action.payload.message;
//       })
//       .addCase(registerFace.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { clearFaceError, clearFaceMessage } = faceSlice.actions;
// export default faceSlice.reducer;




////////////////////////////////////////////////////////


// src/redux/slices/faceSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

const handleError = (error) => {
  if (error.code === 'ERR_CONNECTION_REFUSED') return 'Server is not running.';
  if (error.code === 'ECONNABORTED') return 'Request timed out.';
  if (error.response) return error.response.data?.message || `Server error: ${error.response.status}`;
  return error.message || 'Something went wrong';
};

// ── 1. Register Face ──
export const registerFace = createAsyncThunk(
  'faces/registerFace',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await API.post('/face/register', payload);
      console.log('✅ Face register response:', response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// ── 2. Load All Face Encodings ──
export const loadAllFaceEncodings = createAsyncThunk(
  'faces/loadAllFaceEncodings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/face/all-encodings');
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

const faceSlice = createSlice({
  name: 'faces',
  initialState: {
    loading: false,
    error: null,
    message: null,
    allEncodings: [],
    encodingsLoaded: false,
  },
  reducers: {
    clearFaceError: (state) => { state.error = null; },
    clearFaceMessage: (state) => { state.message = null; },
  },
  extraReducers: (builder) => {
    // ── Register Face ──
    builder
      .addCase(registerFace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerFace.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload?.message || 'Face registered!';
        state.error = null;
      })
      .addCase(registerFace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Load All Encodings ──
    builder
      .addCase(loadAllFaceEncodings.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.encodingsLoaded = false;
      })
      .addCase(loadAllFaceEncodings.fulfilled, (state, action) => {
        state.loading = false;
        state.allEncodings = action.payload?.data || [];
        state.encodingsLoaded = true;
        state.error = null;
      })
      .addCase(loadAllFaceEncodings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.encodingsLoaded = false;
      });
  },
});

export const { clearFaceError, clearFaceMessage } = faceSlice.actions;
export default faceSlice.reducer;
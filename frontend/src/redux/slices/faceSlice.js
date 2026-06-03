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






import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

export const loadAllFaceEncodings = createAsyncThunk(
  'faces/loadAllFaceEncodings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/employees/face-encodings');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Face data load nahi hua');
    }
  }
);

// ── UPDATED: Accepts object with encoding + all_encodings ──
export const registerFace = createAsyncThunk(
  'faces/registerFace',
  async (payload, { rejectWithValue }) => {
    try {
      // payload can be:
      // Old format: Array (single encoding) → backward compatible
      // New format: { encoding, all_encodings, capture_count }

      let body;
      if (Array.isArray(payload)) {
        // Old single-encoding format (backward compatible)
        body = { face_encoding: payload };
      } else {
        // New multi-encoding format
        body = {
          face_encoding: payload.encoding,           // averaged encoding (primary)
          all_encodings: payload.all_encodings,       // all individual encodings
          capture_count: payload.capture_count,       // how many frames captured
        };
      }

      const response = await API.post('/employees/register-face', body);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Face register nahi hua');
    }
  }
);

const faceSlice = createSlice({
  name: 'faces',
  initialState: {
    faceData: [],
    loading: false,
    error: null,
    message: null,
    isLoaded: false,
  },
  reducers: {
    clearFaceError: (state) => {
      state.error = null;
    },
    clearFaceMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAllFaceEncodings.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAllFaceEncodings.fulfilled, (state, action) => {
        state.loading = false;
        state.faceData = action.payload;
        state.isLoaded = true;
      })
      .addCase(loadAllFaceEncodings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(registerFace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerFace.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(registerFace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFaceError, clearFaceMessage } = faceSlice.actions;
export default faceSlice.reducer;
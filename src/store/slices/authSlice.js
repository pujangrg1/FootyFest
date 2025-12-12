import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  profile: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    setProfile(state, action) {
      state.profile = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.profile = null;
      state.error = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setUser, setProfile, clearAuth, setLoading, setError } = authSlice.actions;

export default authSlice.reducer;



import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  profile: null,
  roles: [], // Array of roles user has
  selectedRole: null, // Currently selected role
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
      // Extract roles from profile
      if (action.payload?.roles && Array.isArray(action.payload.roles)) {
        state.roles = action.payload.roles;
        // Set selected role if not already set
        if (!state.selectedRole && action.payload.roles.length > 0) {
          state.selectedRole = action.payload.roles[0];
        }
      } else if (action.payload?.role) {
        // Legacy: single role, convert to array
        state.roles = [action.payload.role];
        if (!state.selectedRole) {
          state.selectedRole = action.payload.role;
        }
      }
    },
    setRoles(state, action) {
      state.roles = action.payload;
      // Set selected role if not already set or if current selection is not in new roles
      if (!state.selectedRole || !action.payload.includes(state.selectedRole)) {
        state.selectedRole = action.payload.length > 0 ? action.payload[0] : null;
      }
    },
    setSelectedRole(state, action) {
      if (state.roles.includes(action.payload)) {
        state.selectedRole = action.payload;
      }
    },
    addRole(state, action) {
      const role = action.payload;
      if (!state.roles.includes(role)) {
        state.roles.push(role);
        // If no role is selected, select the newly added one
        if (!state.selectedRole) {
          state.selectedRole = role;
        }
      }
    },
    clearAuth(state) {
      state.user = null;
      state.profile = null;
      state.roles = [];
      state.selectedRole = null;
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

export const { setUser, setProfile, setRoles, setSelectedRole, addRole, clearAuth, setLoading, setError } = authSlice.actions;

export default authSlice.reducer;



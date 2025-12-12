import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tournamentsReducer from './slices/tournamentsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tournaments: tournamentsReducer,
  },
});



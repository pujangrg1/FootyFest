import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
  selectedTournamentId: null,
};

const tournamentsSlice = createSlice({
  name: 'tournaments',
  initialState,
  reducers: {
    setTournaments(state, action) {
      state.items = action.payload;
    },
    addTournament(state, action) {
      state.items.push(action.payload);
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    selectTournament(state, action) {
      state.selectedTournamentId = action.payload;
    },
  },
});

export const {
  setTournaments,
  addTournament,
  setLoading,
  setError,
  selectTournament,
} = tournamentsSlice.actions;

export default tournamentsSlice.reducer;



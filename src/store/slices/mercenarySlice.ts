import { createSlice } from '@reduxjs/toolkit';

interface MercenaryState {
  mercenaries: any[];
  loading: boolean;
  error: string | null;
}

const initialState: MercenaryState = {
  mercenaries: [],
  loading: false,
  error: null,
};

const mercenarySlice = createSlice({
  name: 'mercenaries',
  initialState,
  reducers: {},
});

export default mercenarySlice.reducer; 
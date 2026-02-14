import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BankStatement } from '@/types';

interface StatementsState {
  items: BankStatement[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

const initialState: StatementsState = {
  items: [],
  loading: false,
  uploading: false,
  error: null,
};

const statementsSlice = createSlice({
  name: 'statements',
  initialState,
  reducers: {
    setStatements(state, action: PayloadAction<BankStatement[]>) {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addStatement(state, action: PayloadAction<BankStatement>) {
      state.items.unshift(action.payload);
      state.uploading = false;
    },
    removeStatement(state, action: PayloadAction<string>) {
      state.items = state.items.filter((s) => s.id !== action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setUploading(state, action: PayloadAction<boolean>) {
      state.uploading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
      state.uploading = false;
    },
  },
});

export const { setStatements, addStatement, removeStatement, setLoading, setUploading, setError } =
  statementsSlice.actions;
export default statementsSlice.reducer;

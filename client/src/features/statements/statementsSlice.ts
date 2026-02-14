import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BankStatement } from '@/types';

interface StatementsState {
  items: BankStatement[];
  activeStatementId: string | null;
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

const initialState: StatementsState = {
  items: [],
  activeStatementId: null,
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
      const defaultStmt = action.payload.find((s) => s.is_default);
      state.activeStatementId = defaultStmt?.id ?? null;
    },
    addStatement(state, action: PayloadAction<BankStatement>) {
      state.items.unshift(action.payload);
      state.uploading = false;
      if (action.payload.is_default) {
        state.items.forEach((s) => {
          if (s.id !== action.payload.id) s.is_default = false;
        });
        state.activeStatementId = action.payload.id;
      }
    },
    removeStatement(state, action: PayloadAction<string>) {
      state.items = state.items.filter((s) => s.id !== action.payload);
      if (state.activeStatementId === action.payload) {
        const newDefault = state.items.find((s) => s.is_default);
        state.activeStatementId = newDefault?.id ?? state.items[0]?.id ?? null;
      }
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

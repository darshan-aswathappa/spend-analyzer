import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Transaction, TransactionSummary } from '@/types';

interface TransactionsState {
  items: Transaction[];
  summary: TransactionSummary | null;
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  filters: {
    category: string;
    type: string;
    from: string;
    to: string;
  };
}

const initialState: TransactionsState = {
  items: [],
  summary: null,
  total: 0,
  page: 0,
  loading: false,
  error: null,
  filters: {
    category: '',
    type: '',
    from: '',
    to: '',
  },
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setTransactions(state, action: PayloadAction<{ transactions: Transaction[]; total: number }>) {
      state.items = action.payload.transactions;
      state.total = action.payload.total;
      state.loading = false;
      state.error = null;
    },
    setSummary(state, action: PayloadAction<TransactionSummary>) {
      state.summary = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setFilter(state, action: PayloadAction<Partial<TransactionsState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 0;
    },
    clearFilters(state) {
      state.filters = initialState.filters;
      state.page = 0;
    },
  },
});

export const { setTransactions, setSummary, setLoading, setError, setPage, setFilter, clearFilters } =
  transactionsSlice.actions;
export default transactionsSlice.reducer;

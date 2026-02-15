import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/apiClient';
import type { TaxLocale, TaxSummaryData, TaxCategoryValue } from '@/types';
import { LOCAL_STORAGE_KEY } from './constants';

function readLocaleFromStorage(): TaxLocale | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TaxLocale) : null;
  } catch {
    return null;
  }
}

interface TaxSummaryState {
  locale: TaxLocale | null;
  localeChecked: boolean;
  localeSaving: boolean;
  summary: TaxSummaryData | null;
  summaryLoading: boolean;
  summaryYear: number | null;
  tagging: Record<string, boolean>;
  error: string | null;
}

const initialState: TaxSummaryState = {
  locale: readLocaleFromStorage(),
  localeChecked: false,
  localeSaving: false,
  summary: null,
  summaryLoading: false,
  summaryYear: null,
  tagging: {},
  error: null,
};

export const loadTaxLocale = createAsyncThunk('taxSummary/loadLocale', async () => {
  const { data } = await apiClient.get<{ data: TaxLocale | null }>('/tax/locale');
  return data.data;
});

export const saveTaxLocale = createAsyncThunk(
  'taxSummary/saveLocale',
  async (payload: TaxLocale) => {
    const { data } = await apiClient.put<{ data: TaxLocale }>('/tax/locale', payload);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    return data.data;
  }
);

export const fetchAnnualSummary = createAsyncThunk(
  'taxSummary/fetchSummary',
  async (year: number) => {
    const { data } = await apiClient.get<TaxSummaryData>('/tax/summary', {
      params: { year },
    });
    return data;
  }
);

export const tagTransaction = createAsyncThunk(
  'taxSummary/tagTransaction',
  async (
    { transactionId, value }: { transactionId: string; value: TaxCategoryValue | null },
    { dispatch, getState }
  ) => {
    await apiClient.patch(`/tax/transactions/${transactionId}/tag`, {
      tax_category: value,
    });
    // Re-fetch summary to reflect the change
    const state = getState() as { taxSummary: TaxSummaryState };
    const year = state.taxSummary.summaryYear ?? new Date().getFullYear();
    dispatch(fetchAnnualSummary(year));
    return transactionId;
  }
);

const taxSummarySlice = createSlice({
  name: 'taxSummary',
  initialState,
  reducers: {
    clearTaxError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // loadTaxLocale
    builder.addCase(loadTaxLocale.fulfilled, (state, action) => {
      state.localeChecked = true;
      if (action.payload) {
        state.locale = action.payload;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(action.payload));
      } else {
        // No server locale — keep whatever was in localStorage (already in state.locale)
        state.localeChecked = true;
      }
    });
    builder.addCase(loadTaxLocale.rejected, (state) => {
      state.localeChecked = true;
      // Keep localStorage value if server call fails
    });

    // saveTaxLocale
    builder.addCase(saveTaxLocale.pending, (state) => {
      state.localeSaving = true;
    });
    builder.addCase(saveTaxLocale.fulfilled, (state, action) => {
      state.localeSaving = false;
      state.locale = { country: action.payload.country, state: action.payload.state };
    });
    builder.addCase(saveTaxLocale.rejected, (state) => {
      state.localeSaving = false;
      state.error = 'Failed to save location settings.';
    });

    // fetchAnnualSummary
    builder.addCase(fetchAnnualSummary.pending, (state) => {
      // Only show spinner on initial load; keep existing data visible during refreshes
      if (!state.summary) {
        state.summaryLoading = true;
      }
      state.error = null;
    });
    builder.addCase(fetchAnnualSummary.fulfilled, (state, action) => {
      state.summaryLoading = false;
      state.summary = action.payload;
      state.summaryYear = action.payload.year;
    });
    builder.addCase(fetchAnnualSummary.rejected, (state) => {
      state.summaryLoading = false;
      state.error = 'Failed to load tax summary.';
    });

    // tagTransaction
    builder.addCase(tagTransaction.pending, (state, action) => {
      state.tagging[action.meta.arg.transactionId] = true;
    });
    builder.addCase(tagTransaction.fulfilled, (state, action) => {
      delete state.tagging[action.payload];
    });
    builder.addCase(tagTransaction.rejected, (state, action) => {
      delete state.tagging[action.meta.arg.transactionId];
      state.error = 'Failed to tag transaction.';
    });
  },
});

export const { clearTaxError } = taxSummarySlice.actions;
export default taxSummarySlice.reducer;

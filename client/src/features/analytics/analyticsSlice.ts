import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TrendsData, ProjectionsData, MonthlyReportData } from '@/types';

interface AnalyticsState {
  trends: TrendsData | null;
  projections: ProjectionsData | null;
  reportData: MonthlyReportData | null;
  loading: boolean;
  projectionsLoading: boolean;
  reportLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  trends: null,
  projections: null,
  reportData: null,
  loading: false,
  projectionsLoading: false,
  reportLoading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setTrends(state, action: PayloadAction<TrendsData>) {
      state.trends = action.payload;
    },
    setProjections(state, action: PayloadAction<ProjectionsData>) {
      state.projections = action.payload;
    },
    setReportData(state, action: PayloadAction<MonthlyReportData | null>) {
      state.reportData = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setProjectionsLoading(state, action: PayloadAction<boolean>) {
      state.projectionsLoading = action.payload;
    },
    setReportLoading(state, action: PayloadAction<boolean>) {
      state.reportLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setTrends,
  setProjections,
  setReportData,
  setLoading,
  setProjectionsLoading,
  setReportLoading,
  setError,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;

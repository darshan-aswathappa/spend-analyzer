import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImpulseTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface ImpulseData {
  score: number;
  rating: 'Low' | 'Medium' | 'High';
  discretionary_pct: number;
  post_payday_ratio: number;
  top_transactions: ImpulseTransaction[];
  months_analyzed: number;
}

export interface CategoryMonthPoint {
  month: string;
  amount: number;
}

export interface CategoryEntry {
  name: string;
  base_risk: 'Low' | 'Medium' | 'High';
  effective_risk: 'Low' | 'Medium' | 'High';
  monthly_avg: number;
  latest_month_amount: number;
  trend: 'up' | 'down' | 'flat';
  trend_pct: number;
  monthly_data: CategoryMonthPoint[];
}

export interface HeatmapData {
  categories: CategoryEntry[];
  months_analyzed: number;
}

export interface FlaggedMerchant {
  merchant_key: string;
  risk_type: string;
  risk_level: 'high';
  transaction_count: number;
  total_amount: number;
  latest_date: string;
  sample_description: string;
}

export interface MerchantData {
  flagged: FlaggedMerchant[];
  total_flagged: number;
  total_risk_amount: number;
}

export interface BillEntry {
  name: string;
  category: string;
  avg_payment_day: number;
  occurrences: number;
  behavior: 'early' | 'on_time' | 'late';
}

export interface PaymentData {
  score: number | null;
  rating: 'excellent' | 'good' | 'fair' | 'poor' | null;
  breakdown: { early: number; on_time: number; late: number; missed: number };
  bills: BillEntry[];
  months_analyzed: number;
}

export interface BurstDay {
  date: string;
  amount: number;
}

export interface MonthlyHistoryPoint {
  month: string;
  total: number;
}

export interface VelocityData {
  current_month_total: number;
  projected_monthly: number;
  three_month_avg: number;
  velocity_ratio: number;
  alert_level: 'normal' | 'warning' | 'critical';
  days_elapsed: number;
  days_in_month: number;
  monthly_history: MonthlyHistoryPoint[];
  burst_days: BurstDay[];
  months_analyzed: number;
}

interface InsightState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface RiskInsightsState {
  impulse: InsightState<ImpulseData>;
  heatmap: InsightState<HeatmapData>;
  merchants: InsightState<MerchantData>;
  payments: InsightState<PaymentData>;
  velocity: InsightState<VelocityData>;
}

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchImpulseScore = createAsyncThunk('riskInsights/impulse', async () => {
  const res = await apiClient.get<ImpulseData>('/risk-assessment/insights/impulse');
  return res.data;
});

export const fetchCategoryHeatmap = createAsyncThunk('riskInsights/heatmap', async () => {
  const res = await apiClient.get<HeatmapData>('/risk-assessment/insights/heatmap');
  return res.data;
});

export const fetchMerchantFlags = createAsyncThunk('riskInsights/merchants', async () => {
  const res = await apiClient.get<MerchantData>('/risk-assessment/insights/merchants');
  return res.data;
});

export const fetchPaymentBehavior = createAsyncThunk('riskInsights/payments', async () => {
  const res = await apiClient.get<PaymentData>('/risk-assessment/insights/payments');
  return res.data;
});

export const fetchVelocityAlerts = createAsyncThunk('riskInsights/velocity', async () => {
  const res = await apiClient.get<VelocityData>('/risk-assessment/insights/velocity');
  return res.data;
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const empty = <T>(): InsightState<T> => ({ data: null, loading: false, error: null });

const initialState: RiskInsightsState = {
  impulse:   empty<ImpulseData>(),
  heatmap:   empty<HeatmapData>(),
  merchants: empty<MerchantData>(),
  payments:  empty<PaymentData>(),
  velocity:  empty<VelocityData>(),
};

function pending<T>(state: InsightState<T>) {
  state.loading = true;
  state.error = null;
}
function rejected<T>(state: InsightState<T>, action: any) {
  state.loading = false;
  state.error = action.error.message || 'Failed to load';
}

const riskInsightsSlice = createSlice({
  name: 'riskInsights',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchImpulseScore.pending,   (s) => pending(s.impulse))
      .addCase(fetchImpulseScore.fulfilled, (s, a) => { s.impulse.loading = false; s.impulse.data = a.payload; })
      .addCase(fetchImpulseScore.rejected,  (s, a) => rejected(s.impulse, a))

      .addCase(fetchCategoryHeatmap.pending,   (s) => pending(s.heatmap))
      .addCase(fetchCategoryHeatmap.fulfilled, (s, a) => { s.heatmap.loading = false; s.heatmap.data = a.payload; })
      .addCase(fetchCategoryHeatmap.rejected,  (s, a) => rejected(s.heatmap, a))

      .addCase(fetchMerchantFlags.pending,   (s) => pending(s.merchants))
      .addCase(fetchMerchantFlags.fulfilled, (s, a) => { s.merchants.loading = false; s.merchants.data = a.payload; })
      .addCase(fetchMerchantFlags.rejected,  (s, a) => rejected(s.merchants, a))

      .addCase(fetchPaymentBehavior.pending,   (s) => pending(s.payments))
      .addCase(fetchPaymentBehavior.fulfilled, (s, a) => { s.payments.loading = false; s.payments.data = a.payload; })
      .addCase(fetchPaymentBehavior.rejected,  (s, a) => rejected(s.payments, a))

      .addCase(fetchVelocityAlerts.pending,   (s) => pending(s.velocity))
      .addCase(fetchVelocityAlerts.fulfilled, (s, a) => { s.velocity.loading = false; s.velocity.data = a.payload; })
      .addCase(fetchVelocityAlerts.rejected,  (s, a) => rejected(s.velocity, a));
  },
});

export default riskInsightsSlice.reducer;

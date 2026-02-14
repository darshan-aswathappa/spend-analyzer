import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RiskOnboarding, RiskScore } from '@/types';

interface RiskAssessmentState {
  onboarding: RiskOnboarding | null;
  onboardingChecked: boolean;
  score: RiskScore | null;
  history: RiskScore[];
  loading: boolean;
  scoreLoading: boolean;
  historyLoading: boolean;
  onboardingSubmitting: boolean;
  error: string | null;
}

const initialState: RiskAssessmentState = {
  onboarding: null,
  onboardingChecked: false,
  score: null,
  history: [],
  loading: false,
  scoreLoading: false,
  historyLoading: false,
  onboardingSubmitting: false,
  error: null,
};

const riskAssessmentSlice = createSlice({
  name: 'riskAssessment',
  initialState,
  reducers: {
    setOnboarding(state, action: PayloadAction<RiskOnboarding | null>) {
      state.onboarding = action.payload;
    },
    setOnboardingChecked(state, action: PayloadAction<boolean>) {
      state.onboardingChecked = action.payload;
    },
    setScore(state, action: PayloadAction<RiskScore | null>) {
      state.score = action.payload;
    },
    setHistory(state, action: PayloadAction<RiskScore[]>) {
      state.history = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setScoreLoading(state, action: PayloadAction<boolean>) {
      state.scoreLoading = action.payload;
    },
    setHistoryLoading(state, action: PayloadAction<boolean>) {
      state.historyLoading = action.payload;
    },
    setOnboardingSubmitting(state, action: PayloadAction<boolean>) {
      state.onboardingSubmitting = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setOnboarding,
  setOnboardingChecked,
  setScore,
  setHistory,
  setLoading,
  setScoreLoading,
  setHistoryLoading,
  setOnboardingSubmitting,
  setError,
} = riskAssessmentSlice.actions;

export default riskAssessmentSlice.reducer;

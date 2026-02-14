import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import apiClient from '@/lib/apiClient';
import {
  setOnboarding,
  setOnboardingChecked,
  setScore,
  setHistory,
  setLoading,
  setScoreLoading,
  setHistoryLoading,
  setError,
} from './riskAssessmentSlice';
import { OnboardingWizard } from './OnboardingWizard';
import { RiskDashboard } from './RiskDashboard';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { RiskOnboarding, RiskScore } from '@/types';

export function RiskAssessmentPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { onboarding, onboardingChecked, score, history, loading, scoreLoading, error } =
    useSelector((state: RootState) => state.riskAssessment);
  const [editMode, setEditMode] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    async function checkOnboarding() {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        const { data } = await apiClient.get<{ data: RiskOnboarding | null }>(
          '/risk-assessment/onboarding'
        );
        dispatch(setOnboarding(data.data));
        dispatch(setOnboardingChecked(true));
      } catch (err: any) {
        dispatch(setError('Failed to check onboarding status'));
      } finally {
        dispatch(setLoading(false));
      }
    }

    checkOnboarding();
  }, [dispatch]);

  // Fetch score and history when onboarding is complete
  useEffect(() => {
    if (!onboarding || editMode) return;

    async function fetchScore() {
      dispatch(setScoreLoading(true));
      try {
        const { data } = await apiClient.get<{ score: RiskScore }>('/risk-assessment/score');
        dispatch(setScore(data.score));
      } catch (err: any) {
        console.error('Score fetch error:', err);
      } finally {
        dispatch(setScoreLoading(false));
      }
    }

    async function fetchHistory() {
      dispatch(setHistoryLoading(true));
      try {
        const { data } = await apiClient.get<{ history: RiskScore[] }>(
          '/risk-assessment/history',
          { params: { months: 12 } }
        );
        dispatch(setHistory(data.history));
      } catch (err: any) {
        console.error('History fetch error:', err);
      } finally {
        dispatch(setHistoryLoading(false));
      }
    }

    fetchScore();
    fetchHistory();
  }, [onboarding, editMode, dispatch]);

  async function handleRecalculate() {
    dispatch(setScoreLoading(true));
    try {
      const { data } = await apiClient.get<{ score: RiskScore }>('/risk-assessment/score', {
        params: { force: true },
      });
      dispatch(setScore(data.score));
      // Refresh history too
      const histRes = await apiClient.get<{ history: RiskScore[] }>(
        '/risk-assessment/history',
        { params: { months: 12 } }
      );
      dispatch(setHistory(histRes.data.history));
    } catch (err: any) {
      console.error('Recalculate error:', err);
    } finally {
      dispatch(setScoreLoading(false));
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Risk Assessment</h1>
        <div className="max-w-2xl mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
            >
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-3 w-64 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !onboardingChecked) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Risk Assessment</h1>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Show onboarding wizard if not completed yet (first time)
  if (!onboarding) {
    return (
      <div className="p-6">
        <OnboardingWizard
          existingData={null}
          onComplete={() => setEditMode(false)}
        />
      </div>
    );
  }

  // Show dashboard with edit profile modal overlay
  return (
    <div className="p-6">
      <RiskDashboard
        score={score}
        history={history}
        scoreLoading={scoreLoading}
        onRecalculate={handleRecalculate}
        onEditProfile={() => setEditMode(true)}
      />

      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Edit Financial Profile</DialogTitle>
          <DialogDescription className="sr-only">
            Update your financial profile settings for risk assessment
          </DialogDescription>
          <OnboardingWizard
            existingData={onboarding}
            onComplete={() => setEditMode(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

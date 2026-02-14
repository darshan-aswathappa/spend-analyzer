import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/store';
import { useToast } from '@/components/ui/toaster';
import { updateStatementStatus } from '@/features/statements/statementsSlice';
import { setScore } from '@/features/risk-assessment/riskAssessmentSlice';

export function useNotifications() {
  const session = useSelector((state: RootState) => state.auth.session);
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const es = new EventSource(
      `${baseUrl}/notifications/stream?token=${session.access_token}`
    );

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') return;

      if (data.type === 'statement_processed') {
        dispatch(
          updateStatementStatus({
            id: data.payload.statementId,
            status: 'completed',
          })
        );
        toast({
          title: 'Statement processed',
          description: `${data.payload.transactionCount} transactions extracted from ${data.payload.filename}. Ready to view.`,
          variant: 'success',
        });
      } else if (data.type === 'risk_score_updated') {
        dispatch(setScore(null));
        toast({
          title: 'Risk score updated',
          description: `Your risk score has been recalculated: ${data.payload.overall_score}/100 (${data.payload.rating}).`,
          variant: 'default',
        });
      } else if (data.type === 'statement_failed') {
        dispatch(
          updateStatementStatus({
            id: data.payload.statementId,
            status: 'failed',
            error: data.payload.error,
          })
        );
        toast({
          title: 'Statement processing failed',
          description: data.payload.error || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    };

    es.onerror = () => {
      // EventSource will auto-reconnect
    };

    eventSourceRef.current = es;
    return () => es.close();
  }, [session?.access_token, toast, dispatch]);
}

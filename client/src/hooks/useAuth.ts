import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';

export function useAuth() {
  const { session, user, loading } = useSelector((state: RootState) => state.auth);
  return { session, user, loading, isAuthenticated: !!session };
}

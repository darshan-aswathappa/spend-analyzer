import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard', { replace: true });
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        navigate('/login', { replace: true });
      }
    });

    // Fallback: if no event fires within 5s, check session directly
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <p className="text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './app/store';
import { AppRoutes } from './routes/AppRoutes';
import { supabase } from './lib/supabaseClient';
import { setSession } from './features/auth/authSlice';
import type { AppDispatch } from './app/store';

function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      dispatch(setSession(data.session));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setSession(session));
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}

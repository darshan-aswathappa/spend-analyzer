import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './app/store';
import { AppRoutes } from './routes/AppRoutes';
import { supabase } from './lib/supabaseClient';
import { setSession } from './features/auth/authSlice';
import type { AppDispatch } from './app/store';
import { Toaster } from './components/ui/toaster';
import { useNotifications } from './hooks/useNotifications';
import { ThemeProvider } from './contexts/ThemeContext';
import { fetchNotifications } from './features/notifications/notificationsSlice';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';

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

function NotificationListener() {
  useNotifications();
  const dispatch = useDispatch<AppDispatch>();
  const session = useSelector((state: RootState) => state.auth.session);

  useEffect(() => {
    if (session?.access_token) {
      dispatch(fetchNotifications());
    }
  }, [session?.access_token, dispatch]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <BrowserRouter>
          <Toaster>
            <AuthProvider>
              <NotificationListener />
              <AppRoutes />
            </AuthProvider>
          </Toaster>
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  );
}

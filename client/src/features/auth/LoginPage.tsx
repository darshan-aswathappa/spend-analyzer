import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mail, Chrome, Loader2 } from 'lucide-react';

const DEMO_EMAIL = 'demo@spendanalyzer.com';
const DEMO_PASSWORD = 'demo123456';

type Mode = 'login' | 'signup' | 'magic';

export function LoginPage({ demo = false }: { demo?: boolean }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState(demo ? DEMO_EMAIL : '');
  const [password, setPassword] = useState(demo ? DEMO_PASSWORD : '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Check your email for a magic link.' });
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Account created. Check your email to confirm.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Seed demo data after successful demo login
        if (demo) {
          try {
            await apiClient.post('/demo/seed');
          } catch {
            // Seed may fail if already seeded — that's fine
          }
          navigate('/dashboard', { replace: true });
          return;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl mb-4">
            <span className="text-white font-bold text-sm">SA</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">SpendAnalyzer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personal finance, clearly.</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            {demo && (
              <Badge className="w-fit mb-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                Demo Mode
              </Badge>
            )}
            <CardTitle className="text-lg">
              {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Magic link'}
            </CardTitle>
            <CardDescription>
              {demo
                ? 'Credentials are prefilled — just click Sign in'
                : mode === 'login'
                ? 'Welcome back to your dashboard'
                : mode === 'signup'
                ? 'Get started in seconds'
                : "We'll email you a one-click sign-in link"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <Chrome className="h-4 w-4 mr-2" />
              Continue with Google
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-2 text-xs text-gray-400 dark:text-gray-500">
                or
              </span>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {mode !== 'magic' && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                </div>
              )}

              {message && (
                <p
                  className={`text-sm rounded-md px-3 py-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {message.text}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'magic' ? (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send magic link
                  </>
                ) : mode === 'signup' ? (
                  'Create account'
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Mode switchers */}
            <div className="flex flex-col gap-1.5 text-center text-sm text-gray-500 dark:text-gray-400">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => { setMode('magic'); setMessage(null); }}
                  >
                    Sign in with magic link instead
                  </button>
                  <span>
                    No account?{' '}
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => { setMode('signup'); setMessage(null); }}
                    >
                      Sign up
                    </button>
                  </span>
                </>
              )}
              {mode === 'signup' && (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => { setMode('login'); setMessage(null); }}
                  >
                    Sign in
                  </button>
                </span>
              )}
              {mode === 'magic' && (
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => { setMode('login'); setMessage(null); }}
                >
                  Back to sign in
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

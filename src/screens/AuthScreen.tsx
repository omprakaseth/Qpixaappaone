import { useState, useRef } from 'react';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { analytics } from '@/lib/analytics';

interface AuthScreenProps {
  onBack: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthScreen({ onBack, initialMode = 'login' }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    
    if (deltaX > 80 && deltaY < 50) {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (mode === 'signup' && !username) {
      toast.error('Please enter a username');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        
        if (data?.session) {
          analytics.trackUserGrowth(data.session.user.id, data.session.user.email, 'email');
          toast.success('Account created successfully!');
          onBack(); // Close auth screen if auto-logged in
        } else {
          analytics.track('User Signup Started', { method: 'email' });
          toast.success('Account created! Please check your email to confirm.');
          setMode('login'); // Switch to login mode
          setPassword(''); // Clear password for safety
        }
      } else if (mode === 'otp') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });
        if (error) throw error;
        analytics.track('OTP Login Requested', { email });
        toast.success('Magic link sent! Check your email.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.user) {
          analytics.identify(data.user.id, { $email: data.user.email });
          analytics.track('User Login', { method: 'email' });
        }
        toast.success('Welcome back!');
        onBack();
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[80] bg-background overflow-y-auto scrollbar-hide"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onBack}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="text-base font-bold text-foreground">
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Secure Login'}
        </h1>
      </div>

      <div className="px-6 pt-8 pb-8 flex flex-col items-center">
        <div className="mb-6">
          <Logo size={80} animated={false} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Join Qpixa' : 'Login with OTP'}
        </h2>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          {mode === 'login' ? 'Sign in to access your creations' : mode === 'signup' ? 'Create an account to get started' : 'We will send a secure magic link to your email'}
        </p>

        <div className="w-full space-y-3 mb-6">
          {mode === 'signup' && (
            <div className="flex items-center bg-secondary rounded-xl px-4 h-12">
              <User size={18} className="text-muted-foreground mr-3" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
              />
            </div>
          )}
          <div className="flex items-center bg-secondary rounded-xl px-4 h-12">
            <Mail size={18} className="text-muted-foreground mr-3" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
          {mode !== 'otp' && (
            <div className="flex items-center bg-secondary rounded-xl px-4 h-12">
              <Lock size={18} className="text-muted-foreground mr-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
              />
              <button onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} className="text-muted-foreground" /> : <Eye size={18} className="text-muted-foreground" />}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link'}
        </button>

        {mode === 'login' && (
          <button
            onClick={() => setMode('otp')}
            className="w-full py-3.5 mt-3 rounded-xl bg-secondary/50 text-foreground font-semibold text-sm"
          >
            Login with Email OTP
          </button>
        )}

        <div className="flex items-center gap-3 w-full my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={async () => {
            setLoading(true);
            try {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin,
                }
              });
              if (error) throw error;
            } catch (err: any) {
              toast.error(err.message || 'Google sign-in failed');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="text-sm text-muted-foreground mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-primary font-semibold"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

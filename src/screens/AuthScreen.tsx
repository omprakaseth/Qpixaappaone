import { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import qpixerLogo from '@/assets/qpixer-logo.png';

interface AuthScreenProps {
  onBack: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthScreen({ onBack, initialMode = 'login' }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Check your email to confirm your account!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
    <div className="fixed inset-0 z-[80] bg-background overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onBack}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="text-base font-bold text-foreground">{mode === 'login' ? 'Sign In' : 'Create Account'}</h1>
      </div>

      <div className="px-6 pt-8 pb-8 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6">
          <img src={qpixerLogo} alt="Qpixer" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {mode === 'login' ? 'Welcome back' : 'Join Qpixer'}
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          {mode === 'login' ? 'Sign in to access your creations' : 'Create an account to get started'}
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
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

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
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
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

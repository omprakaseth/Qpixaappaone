"use client";
import { useState } from 'react';
import Image from 'next/image';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
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
    <div className="fixed inset-0 z-[80] bg-background/95 backdrop-blur-xl flex flex-col justify-center items-center p-4">
      {/* Header - Floating Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-all active:scale-95"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
      </div>

      <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-[32px] overflow-hidden p-8 sm:p-10 relative">
        {/* Background blobs */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center relative z-10">
          <div className="mb-8">
            <Logo size={64} animated={true} />
          </div>

          <h1 className="text-2xl font-black text-foreground mb-2 text-center tracking-tight">
            Authentication
          </h1>
          <p className="text-sm text-muted-foreground mb-8 text-center px-4">
            Join our global community of AI artists
          </p>

          {/* Unified Tabs */}
          <div className="w-full flex bg-secondary/50 p-1 rounded-2xl mb-8">
            <button 
              onClick={() => setMode('login')}
              className={cn(
                "flex-1 py-2.5 text-xs font-black rounded-xl transition-all",
                mode === 'login' ? "bg-card text-foreground shadow-sm shadow-black/5" : "text-muted-foreground hover:text-foreground"
              )}
            >
              SIGN IN
            </button>
            <button 
              onClick={() => setMode('signup')}
              className={cn(
                "flex-1 py-2.5 text-xs font-black rounded-xl transition-all",
                mode === 'signup' ? "bg-card text-foreground shadow-sm shadow-black/5" : "text-muted-foreground hover:text-foreground"
              )}
            >
              SIGN UP
            </button>
          </div>

          <div className="w-full space-y-4 mb-8">
            {mode === 'signup' && (
              <div className="group transition-all">
                <div className="flex items-center bg-secondary/50 border border-border group-focus-within:border-primary/50 rounded-2xl px-4 h-14 transition-all">
                  <User size={18} className="text-muted-foreground mr-3" />
                  <input
                    type="text"
                    placeholder="Full Name / Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
                  />
                </div>
              </div>
            )}
            
            <div className="group transition-all">
              <div className="flex items-center bg-secondary/50 border border-border group-focus-within:border-primary/50 rounded-2xl px-4 h-14 transition-all">
                <Mail size={18} className="text-muted-foreground mr-3" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
                />
              </div>
            </div>

            {mode !== 'otp' && (
              <div className="group transition-all">
                <div className="flex items-center bg-secondary/50 border border-border group-focus-within:border-primary/50 rounded-2xl px-4 h-14 transition-all">
                  <Lock size={18} className="text-muted-foreground mr-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} className="text-muted-foreground" /> : <Eye size={18} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={16} />
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Start Creating' : 'Send Link'}
              </>
            )}
          </button>

          {mode === 'login' && (
            <button
              onClick={() => setMode('otp')}
              className="mt-4 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Use Magic Link instead
            </button>
          )}

          <div className="flex items-center gap-3 w-full my-8">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border/50" />
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
            className="w-full py-4 rounded-2xl bg-secondary border border-border text-foreground font-bold text-sm flex items-center justify-center gap-3 hover:bg-secondary/80 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Image 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              width={20} 
              height={20} 
              className="w-5 h-5" 
            />
            Google
          </button>

          <p className="text-sm text-muted-foreground mt-10">
            {mode === 'login' ? "New here? " : 'Already a member? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary font-black hover:underline underline-offset-4"
            >
              {mode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

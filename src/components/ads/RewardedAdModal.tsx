import { useState, useEffect, useRef } from 'react';
import { Gift, X, Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAppState } from '@/context/AppContext';

interface RewardedAdModalProps {
  open: boolean;
  onClose: () => void;
  rewardCredits: number;
  publisherId: string;
}

export default function RewardedAdModal({ open, onClose, rewardCredits, publisherId }: RewardedAdModalProps) {
  const { user, refreshProfile, setCredits } = useAppState();
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!watching) return;
    const duration = 15; // 15 seconds
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 0.1;
      setProgress(Math.min((elapsed / duration) * 100, 100));
      if (elapsed >= duration) {
        clearInterval(timerRef.current);
        handleRewardComplete();
      }
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [watching]);

  const handleRewardComplete = async () => {
    setCompleted(true);
    setWatching(false);

    if (user) {
      // Add credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits + rewardCredits })
          .eq('id', user.id);
        setCredits(prev => prev + rewardCredits);
        refreshProfile();
      }
    }

    toast.success(`🎉 ${rewardCredits} credits earned!`);
  };

  const handleClose = () => {
    clearInterval(timerRef.current);
    setWatching(false);
    setProgress(0);
    setCompleted(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-card rounded-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-primary" />
            <span className="text-sm font-bold text-foreground">Earn Free Credits</span>
          </div>
          {!watching && (
            <button onClick={handleClose} className="p-1">
              <X size={18} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {completed ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">+{rewardCredits} Credits!</p>
                <p className="text-sm text-muted-foreground mt-1">Credits added to your account</p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                Continue
              </button>
            </div>
          ) : watching ? (
            <div className="space-y-4">
              {/* Ad area - placeholder or real ad */}
              <div className="aspect-video bg-secondary rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Ad Playing...</p>
                  <p className="text-xs text-muted-foreground mt-1">Please wait to earn credits</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.ceil(15 - (progress / 100) * 15)}s remaining
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Gift size={32} className="text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Watch an Ad</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Watch a short 15s ad to earn <span className="text-primary font-bold">{rewardCredits} free credits</span>
                </p>
              </div>
              <button
                onClick={() => setWatching(true)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2"
              >
                <Play size={16} />
                Watch Ad
              </button>
              <button
                onClick={handleClose}
                className="text-sm text-muted-foreground"
              >
                No thanks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

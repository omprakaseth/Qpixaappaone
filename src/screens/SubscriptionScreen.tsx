"use client";
import { ArrowLeft, Check, Sparkles, Zap } from 'lucide-react';

interface SubscriptionScreenProps {
  onBack: () => void;
}

export default function SubscriptionScreen({ onBack }: SubscriptionScreenProps) {
  return (
    <div className="fixed inset-0 z-[70] bg-background overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onBack}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="text-base font-bold text-foreground">GET PRO</h1>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {/* Free Plan */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={20} className="text-muted-foreground" />
            <h2 className="text-base font-bold text-foreground">Free Plan</h2>
          </div>
          <p className="text-2xl font-bold text-foreground mb-4">$0<span className="text-sm text-muted-foreground font-normal">/month</span></p>
          <div className="space-y-2.5">
            {['10 generations per day', 'Standard quality', 'Watermark on images', 'Community access', 'Basic prompts'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-5 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold">
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-card rounded-2xl p-5 border-2 border-primary relative">
          <span className="absolute -top-3 left-5 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full">
            RECOMMENDED
          </span>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">Pro Plan</h2>
          </div>
          <p className="text-2xl font-bold text-foreground mb-4">$9.99<span className="text-sm text-muted-foreground font-normal">/month</span></p>
          <div className="space-y-2.5">
            {['Unlimited generations', 'HD quality output', 'No watermark', 'No ads', 'Priority generation', 'Advanced prompts', 'Early access to features'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check size={14} className="text-primary" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}

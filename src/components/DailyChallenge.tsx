"use client";
import React from 'react';
import { Trophy, Sparkles, ChevronRight, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DailyChallenge() {
  return (
    <div className="mx-3 mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-background border border-primary/20 p-5">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
            <Trophy size={14} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Daily Challenge</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Timer size={14} />
            <span className="text-[10px] font-bold">14h 22m left</span>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">Cyberpunk Samurai</h2>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Create a futuristic warrior blending traditional Japanese aesthetics with neon-lit cyberpunk elements.
        </p>
        
        <div className="flex items-center gap-3">
          <Button className="h-9 px-5 rounded-xl text-xs font-bold gap-2">
            <Sparkles size={14} />
            Enter Now
          </Button>
          <button className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            View Entries
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      
      {/* Floating icons */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-20 pointer-events-none">
        <Sparkles size={64} className="text-primary animate-pulse" />
      </div>
    </div>
  );
}

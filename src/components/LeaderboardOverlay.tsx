"use client";
import React from 'react';
import { X, Trophy, Medal, Crown, TrendingUp, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardOverlayProps {
  open: boolean;
  onClose: () => void;
}

const mockLeaders = [
  { id: '1', name: 'PixelMaster', username: '@pixel_m', score: 12450, rank: 1, avatar: 'P' },
  { id: '2', name: 'ArtLover99', username: '@art_lover', score: 10200, rank: 2, avatar: 'A' },
  { id: '3', name: 'CreativeAI', username: '@ai_creative', score: 9800, rank: 3, avatar: 'C' },
  { id: '4', name: 'DreamWeaver', username: '@dream_w', score: 8500, rank: 4, avatar: 'D' },
  { id: '5', name: 'PromptGenius', username: '@p_genius', score: 7200, rank: 5, avatar: 'P' },
  { id: '6', name: 'Visionary', username: '@vision_ai', score: 6800, rank: 6, avatar: 'V' },
  { id: '7', name: 'CyberArtist', username: '@cyber_a', score: 5400, rank: 7, avatar: 'C' },
];

export default function LeaderboardOverlay({ open, onClose }: LeaderboardOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-background rounded-t-[32px] border-t border-border overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-border relative">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Trophy size={24} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Top Creators</h2>
                  <p className="text-xs text-muted-foreground">Weekly rankings based on engagement</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="absolute right-6 top-6 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {mockLeaders.map((leader, i) => (
                <div
                  key={leader.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    i < 3 ? 'bg-primary/5 border-primary/20' : 'bg-secondary/30 border-transparent'
                  }`}
                >
                  <div className="w-8 flex justify-center">
                    {leader.rank === 1 && <Crown size={24} className="text-yellow-500" />}
                    {leader.rank === 2 && <Medal size={24} className="text-slate-400" />}
                    {leader.rank === 3 && <Medal size={24} className="text-amber-600" />}
                    {leader.rank > 3 && <span className="text-sm font-bold text-muted-foreground">#{leader.rank}</span>}
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm overflow-hidden">
                    {leader.avatar}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{leader.name}</p>
                    <p className="text-[10px] text-muted-foreground">{leader.username}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{leader.score.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Points</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Your Rank */}
            <div className="p-6 bg-secondary/50 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    Y
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">You</p>
                    <p className="text-[10px] text-muted-foreground">Rank #1,245</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                  <TrendingUp size={14} className="text-primary" />
                  <span className="text-xs font-bold text-primary">+12%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

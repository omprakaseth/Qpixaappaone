import React from 'react';
import { TrendingUp, Users, Target, ChevronRight } from 'lucide-react';
import { useAppState } from '@/context/AppContext';

export function DesktopRightPanel() {
  const { posts } = useAppState();

  const trendingPrompts = [
    "Cyberpunk city at night, neon lights, rainy hyper-realistic",
    "Ancient Greek temple on a floating island, cinematic lighting",
    "Cute 3D character design, Pixar style, soft ambient",
    "Gothic cathedral interior, dramatic rays of light, 8k resolution"
  ];

  return (
    <aside className="w-[320px] h-screen bg-[#0f0f13] border-l border-[#1f1f23] p-6 hidden lg:flex flex-col gap-8 fixed right-0 top-0 overflow-y-auto">
      {/* Trending Prompts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Trending Prompts
          </h3>
        </div>
        <div className="space-y-3">
          {trendingPrompts.map((prompt, i) => (
            <div 
              key={i} 
              className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <p className="text-xs text-muted-foreground line-clamp-2 italic group-hover:text-white">"{prompt}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Creators */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users size={16} className="text-primary" /> Top Creators
          </h3>
          <button className="text-[10px] font-bold text-primary hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
             <div key={i} className="flex items-center justify-between group cursor-pointer">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-secondary border border-white/10 group-hover:border-primary/50 transition-colors" />
                 <div>
                   <p className="text-xs font-bold text-white">Artist Name</p>
                   <p className="text-[10px] text-muted-foreground">@artist_handle</p>
                 </div>
               </div>
               <button className="px-3 py-1 rounded-lg bg-white/10 text-[10px] font-bold text-white hover:bg-primary hover:text-white transition-all">
                 Follow
               </button>
             </div>
          ))}
        </div>
      </section>

      {/* Top Categories */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target size={16} className="text-primary" /> Categories
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['Photography', 'Anime', 'Digital Art', 'Abstract', '3D Render', 'Architecture'].map((cat) => (
            <button 
              key={cat} 
              className="px-3 py-2 bg-white/5 rounded-lg border border-white/5 text-[10px] font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all text-left"
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Footer Info */}
      <div className="mt-auto pt-6 border-t border-[#1f1f23] opacity-30 text-[10px] text-muted-foreground">
        <p>© 2026 Qpixa AI. All rights reserved.</p>
        <div className="flex gap-4 mt-2">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Contact</a>
        </div>
      </div>
    </aside>
  );
}

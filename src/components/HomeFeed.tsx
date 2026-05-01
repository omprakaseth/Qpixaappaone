"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { LayoutGrid, SlidersHorizontal, Star, TrendingUp, Zap } from 'lucide-react';

export default function HomeFeed() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categories = [
    { name: 'Video AI', icon: <Zap className="w-5 h-5" /> },
    { name: 'Image Gen', icon: <LayoutGrid className="w-5 h-5" /> },
    { name: 'Audio/Voice', icon: <TrendingUp className="w-5 h-5" /> },
    { name: 'Text/Chat', icon: <Star className="w-5 h-5" /> },
  ];

  return (
    <div className="flex-1 bg-zinc-950 text-white overflow-y-auto no-scrollbar pb-24">
      {/* Header Area */}
      <div className="px-4 pt-6 pb-4 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Discover AI
        </h1>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-sm font-medium pr-1">Filter</span>
        </button>
      </div>

      {/* Filter / Categories Section (Collapsible) */}
      {isFilterOpen && (
        <div className="px-4 mb-6 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> Categories
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat, i) => (
                <button key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition-colors text-left">
                  <div className="text-indigo-400">{cat.icon}</div>
                  <span className="font-medium text-sm">{cat.name}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
              <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Feed */}
      <div className="px-4 space-y-6">
        <h2 className="text-lg font-semibold">Trending AI Tools</h2>
        
        {/* Mock Cards */}
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
            <div className="h-48 bg-zinc-800 relative">
              <Image 
                src={`https://picsum.photos/seed/ai${item}/600/400`} 
                alt="AI Tool" 
                fill
                className="object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> 4.9
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">SuperAI Video Gen {item}</h3>
                  <p className="text-zinc-400 text-sm">Create viral videos in seconds</p>
                </div>
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs font-semibold">Free Trial</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ArrowLeft, Star, ShoppingBag, TrendingUp, MapPin, Calendar, Coins, Grid3X3, Info, UserPlus, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import type { MarketplacePrompt } from '@/screens/MarketplaceScreen';

interface SellerProfileScreenProps {
  sellerName: string;
  sellerPrompts: MarketplacePrompt[];
  onBack: () => void;
  onPromptTap: (prompt: MarketplacePrompt) => void;
}

const modelBadgeColors: Record<string, string> = {
  'Gemini Image': 'bg-purple-500/80',
  'DALL-E': 'bg-emerald-500/80',
  'Midjourney': 'bg-blue-500/80',
  'Stable Diff.': 'bg-pink-500/80',
  'FLUX': 'bg-orange-500/80',
};

export default function SellerProfileScreen({ sellerName, sellerPrompts, onBack, onPromptTap }: SellerProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<'prompts' | 'about'>('prompts');

  const totalSales = sellerPrompts.reduce((sum, p) => sum + p.sales_count, 0);
  const avgRating = sellerPrompts.length > 0
    ? (sellerPrompts.reduce((sum, p) => sum + p.rating, 0) / sellerPrompts.length).toFixed(1)
    : '0.0';
  const initial = sellerName.charAt(0).toUpperCase();
  const isTopSeller = totalSales > 200;

  const tabs = [
    { id: 'prompts' as const, icon: Grid3X3 },
    { id: 'about' as const, icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 pt-3 pb-3 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-secondary">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1">{sellerName}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Info - Same structure as own profile */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-5">
            {/* Avatar with gradient ring */}
            <div className="relative flex-shrink-0">
              <div className="w-[76px] h-[76px] rounded-full p-[2.5px] bg-gradient-to-tr from-primary via-primary/60 to-accent">
                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center border-2 border-background">
                  <span className="text-xl font-bold text-secondary-foreground">{initial}</span>
                </div>
              </div>
            </div>

            {/* Stats - Public profile shows Prompts, Followers only (NO Following) */}
            <div className="flex-1 flex items-center justify-around">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{sellerPrompts.length}</p>
                <p className="text-[10px] text-muted-foreground">Prompts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totalSales.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Sales</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">0</p>
                <p className="text-[10px] text-muted-foreground">Followers</p>
              </div>
            </div>
          </div>

          {/* Name & Info */}
          <div className="mt-3">
            <h2 className="text-[13px] font-bold text-foreground">@{sellerName}</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">AI Prompt Creator</p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {isTopSeller && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <ShoppingBag size={10} /> Top Seller
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              <Star size={9} className="text-yellow-400 fill-yellow-400" /> {avgRating}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              <MapPin size={9} /> Global
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              <Calendar size={9} /> 2025
            </span>
          </div>

          {/* Action Buttons - Follow & Message for other's profile */}
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-[7px] rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
              <UserPlus size={13} /> Follow
            </button>
            <button className="flex-1 py-[7px] rounded-lg bg-secondary text-secondary-foreground text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
              Message
            </button>
          </div>
        </div>

        {/* Tabs - icon only, same as own profile */}
        <div className="flex border-b border-border">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center py-3 border-b-2 transition-colors ${
                activeTab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
              }`}
            >
              <t.icon size={18} />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="pb-20">
          {activeTab === 'prompts' && (
            <div className="grid grid-cols-2 gap-3 p-3">
              {sellerPrompts.map(prompt => {
                const badgeColor = modelBadgeColors[prompt.model_type] || 'bg-muted';
                const img = prompt.preview_images?.[0] || prompt.preview_image || '/placeholder.svg';
                return (
                  <button
                    key={prompt.id}
                    onClick={() => onPromptTap(prompt)}
                    className="rounded-xl overflow-hidden bg-card border border-border text-left transition-transform active:scale-[0.97]"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute top-1.5 left-1.5">
                        <span className={`${badgeColor} text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full`}>
                          {prompt.model_type}
                        </span>
                      </div>
                      {prompt.price === 0 && (
                        <div className="absolute top-1.5 right-1.5">
                          <span className="bg-green-500/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">FREE</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-[11px] font-semibold text-foreground truncate mb-1">{prompt.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-[10px] font-medium text-foreground">{prompt.rating}</span>
                          <span className="text-[10px] text-muted-foreground">({prompt.sales_count})</span>
                        </div>
                        {prompt.price > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] font-bold text-primary">
                            <Coins size={10} />{prompt.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-3 p-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">About @{sellerName}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Professional AI prompt creator specializing in high-quality image generation prompts.
                  All prompts are thoroughly tested across multiple AI models for consistent, stunning results.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(sellerPrompts.map(p => p.category))].map(cat => (
                    <span key={cat} className="bg-secondary text-foreground text-[10px] font-medium px-2.5 py-1 rounded-full">
                      {cat}
                    </span>
                  ))}
                  {[...new Set(sellerPrompts.map(p => p.model_type))].map(model => (
                    <span key={model} className="bg-primary/10 text-primary text-[10px] font-medium px-2.5 py-1 rounded-full">
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

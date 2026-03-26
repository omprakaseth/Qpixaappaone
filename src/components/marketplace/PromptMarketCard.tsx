import { Star, Coins, Sparkles } from 'lucide-react';
import type { MarketplacePrompt } from '@/screens/MarketplaceScreen';

interface PromptMarketCardProps {
  prompt: MarketplacePrompt;
  isPurchased: boolean;
  onTap: () => void;
}

export default function PromptMarketCard({ prompt, isPurchased, onTap }: PromptMarketCardProps) {
  return (
    <button
      onClick={onTap}
      className="flex flex-col rounded-xl overflow-hidden bg-card border border-border text-left transition-transform active:scale-[0.97]"
    >
      {/* Preview Image */}
      <div className="relative aspect-square w-full overflow-hidden">
        <img
          src={prompt.preview_image || '/placeholder.svg'}
          alt={prompt.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Price badge */}
        <div className="absolute top-2 right-2">
          {prompt.price === 0 ? (
            <span className="flex items-center gap-1 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Sparkles size={10} />
              FREE
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-background/80 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Coins size={10} />
              {prompt.price}
            </span>
          )}
        </div>
        {/* Featured badge */}
        {prompt.is_featured && (
          <div className="absolute top-2 left-2">
            <span className="bg-primary/90 text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              FEATURED
            </span>
          </div>
        )}
        {/* Purchased overlay */}
        {isPurchased && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full">
              OWNED
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1">
        <h3 className="text-xs font-semibold text-foreground line-clamp-1">{prompt.title}</h3>
        <p className="text-[10px] text-muted-foreground">@{prompt.creator_name || 'unknown'}</p>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] text-muted-foreground font-medium">{prompt.rating}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{prompt.sales_count} sales</span>
        </div>
        <span className="text-[9px] text-muted-foreground/70 bg-secondary px-1.5 py-0.5 rounded-full w-fit mt-0.5">
          {prompt.model_type}
        </span>
      </div>
    </button>
  );
}

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AILoaderProps {
  className?: string;
  showSecondary?: boolean;
}

export default function AILoader({ className, showSecondary = true }: AILoaderProps) {
  return (
    <div className={cn("flex items-center gap-3 py-2", className)}>
      {/* Loader Icon Container */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg 
          width="32" 
          height="20" 
          viewBox="0 0 130 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="loader-gradient-ai" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#7B61FF" />
            </linearGradient>
            <filter id="loader-glow-ai" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComponentTransfer in="blur" result="lowOpacityBlur">
                <feFuncA type="linear" slope="0.4" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="lowOpacityBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.path 
            d="M 62 70 V 40 A 18 18 0 1 0 26 40 A 18 18 0 0 0 62 40 C 62 32 68 32 68 40 A 18 18 0 0 1 104 40 A 18 18 0 1 1 68 40 V 70"
            stroke="url(#loader-gradient-ai)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#loader-glow-ai)"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ 
              pathLength: [0, 1, 1, 0],
              opacity: [0.4, 1, 1, 0.4],
              pathOffset: [0, 0, 1, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </svg>
      </div>

      {/* Text Content */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground/90 leading-none">
          Generating...
        </span>
        {showSecondary && (
          <span className="text-[11px] text-muted-foreground/60 mt-0.5 leading-none">
            Creating your image
          </span>
        )}
      </div>
    </div>
  );
}

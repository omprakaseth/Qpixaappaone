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
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Rotating Arc */}
        <motion.svg
          viewBox="0 0 32 32"
          className="w-full h-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <defs>
            <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" /> {/* Purple-500 */}
              <stop offset="100%" stopColor="#3B82F6" /> {/* Blue-500 */}
            </linearGradient>
          </defs>
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="url(#loader-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="60 100" // Creates a ~60% arc
            className="opacity-90 drop-shadow-[0_0_3px_rgba(139,92,246,0.3)]"
          />
        </motion.svg>

        {/* Center Text "qp" */}
        <motion.span
          className="absolute text-[10px] font-bold text-foreground/80 tracking-tight"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          qp
        </motion.span>
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

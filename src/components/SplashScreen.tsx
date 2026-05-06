import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('hasShownSplash');
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('hasShownSplash')) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('hasShownSplash', 'true');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut",
              scale: {
                type: "spring",
                damping: 12,
                stiffness: 100
              }
            }}
            className="relative"
          >
            {/* New QP SVG Icon */}
            <svg 
              width="100" 
              height="100" 
              viewBox="0 0 512 512" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="logo-grad" x1="80" y1="80" x2="432" y2="432" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7B61FF" />
                  <stop offset="1" stopColor="#4F46E5" />
                </linearGradient>
                <filter id="splash-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="15" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <motion.circle 
                cx="256" 
                cy="256" 
                r="240" 
                stroke="url(#logo-grad)" 
                strokeWidth="20" 
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <motion.g
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                filter="url(#splash-glow)"
              >
                <path d="M245 240C245 201.34 213.66 170 175 170C136.34 170 105 201.34 105 240C105 278.66 136.34 310 175 310H245V410" stroke="white" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M267 240C267 201.34 298.34 170 337 170C375.66 170 407 201.34 407 240C407 278.66 375.66 310 337 310H267V410" stroke="white" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" />
              </motion.g>
            </svg>

            {/* Pulsing background glow */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 -z-10 bg-primary/20 blur-3xl rounded-full"
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 flex flex-col items-center"
          >
            <h1 className="text-2xl font-black tracking-[0.3em] text-white mb-2">
              QPIXA
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-[1px] w-8 bg-white/20" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                AI Creative Studio
              </p>
              <div className="h-[1px] w-8 bg-white/20" />
            </div>
          </motion.div>

          {/* Loading bar */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-transparent via-primary to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

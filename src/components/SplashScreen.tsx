"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let hasShown = false;
    try {
      if (typeof window !== 'undefined') {
        hasShown = !!sessionStorage.getItem('hasShownSplash');
      }
    } catch (e) {
      console.warn('Session storage access denied', e);
    }

    if (hasShown) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('hasShownSplash', 'true');
        }
      } catch (e) {
        console.warn('Session storage access denied', e);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
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
            {/* QP SVG Icon */}
            <svg 
              width="120" 
              height="80" 
              viewBox="0 0 130 80" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="splash-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#7B61FF" />
                </linearGradient>
                <filter id="splash-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <motion.path 
                d="M 62 70 V 40 A 18 18 0 1 0 26 40 A 18 18 0 0 0 62 40 C 62 32 68 32 68 40 A 18 18 0 0 1 104 40 A 18 18 0 1 1 68 40 V 70"
                stroke="url(#splash-gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#splash-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ 
                  duration: 1.5, 
                  ease: "easeInOut",
                  delay: 0.2
                }}
              />
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

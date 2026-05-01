"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface LogoLoaderProps {
  size?: number;
  text?: string;
  className?: string;
}

export const LogoLoader: React.FC<LogoLoaderProps> = ({ size = 60, text, className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <svg 
          width={size} 
          height={size * 0.6} 
          viewBox="0 0 130 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#7B61FF" />
            </linearGradient>
            <filter id="loader-glow" x="-30%" y="-30%" width="160%" height="160%">
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
            stroke="url(#loader-gradient)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#loader-glow)"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </svg>
      </motion.div>
      {text && (
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-4">
          {text}
        </p>
      )}
    </div>
  );
};

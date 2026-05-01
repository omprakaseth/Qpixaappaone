"use client";
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 40, animated = true }) => {
  return (
    <svg 
      width={size} 
      height={size * 0.6} 
      viewBox="0 0 130 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#7B61FF" />
        </linearGradient>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
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
      <path 
        d="M 62 70 V 40 A 18 18 0 1 0 26 40 A 18 18 0 0 0 62 40 C 62 32 68 32 68 40 A 18 18 0 0 1 104 40 A 18 18 0 1 1 68 40 V 70"
        stroke="url(#logo-gradient)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        className={animated ? "logo-path" : ""}
      />
      {animated && (
        <style>{`
          .logo-path {
            stroke-dasharray: 500;
            stroke-dashoffset: 500;
            animation: draw 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          @keyframes draw {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      )}
    </svg>
  );
};

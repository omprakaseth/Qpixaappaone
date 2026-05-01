"use client";
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

export default function VerifiedBadge({ size = 14, className }: VerifiedBadgeProps) {
  return (
    <BadgeCheck
      size={size}
      className={cn("text-blue-500 fill-blue-500 stroke-white flex-shrink-0", className)}
    />
  );
}

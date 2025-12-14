'use client';

import { cn } from '@/lib/utils';

interface WizardProgressProps {
  current: number;
  total: number;
  className?: string;
}

export function WizardProgress({ current, total, className }: WizardProgressProps) {
  return (
    <div className={cn('flex gap-1 mb-6', className)}>
      {Array.from({ length: total }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors duration-300',
            idx < current
              ? 'bg-gradient-to-r from-amber-500 to-amber-600'
              : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  );
}

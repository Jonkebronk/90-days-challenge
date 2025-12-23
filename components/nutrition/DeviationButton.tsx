'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviationButtonProps {
  onClick: () => void;
  className?: string;
}

export function DeviationButton({ onClick, className }: DeviationButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium shadow-md hover:from-amber-600 hover:to-orange-600 transition-all hover:shadow-lg',
        className
      )}
    >
      <AlertTriangle className="h-4 w-4" />
      Registrera Kostavvikelse
    </button>
  );
}

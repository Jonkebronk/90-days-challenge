'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  showBack?: boolean;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function WizardNavigation({
  onBack,
  onNext,
  nextLabel = 'Nästa',
  backLabel = 'Tillbaka',
  showBack = true,
  isNextDisabled = false,
  isLoading = false,
  className,
}: WizardNavigationProps) {
  return (
    <div className={cn('flex gap-3 mt-6', className)}>
      {showBack && onBack && (
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 h-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>
      )}
      {onNext && (
        <Button
          onClick={onNext}
          disabled={isNextDisabled || isLoading}
          className={cn(
            'flex-1 h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold',
            !showBack && 'w-full'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Vänta...
            </>
          ) : (
            nextLabel
          )}
        </Button>
      )}
    </div>
  );
}
